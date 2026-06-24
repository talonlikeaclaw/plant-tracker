import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilIcon, Trash2Icon, AlertCircleIcon, PlusCircleIcon, ClockIcon, HistoryIcon, MapPinIcon, CalendarIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AuthImage } from "@/components/auth-image";
import { getAllPlants, updatePlant, deletePlant } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import { getCareLogsByPlant } from "@/api/careLogs";
import { getUpcomingCareLogs } from "@/api/dashboard";
import { getDefaultCareTypes, getUserCareTypes } from "@/api/careTypes";
import type { Plant, Species, PlantWithCareData, CareType, UpcomingCareLog, CareLog } from "@/types";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

export default function ViewPlants() {
  const navigate = useNavigate();
  const [enrichedPlants, setEnrichedPlants] = useState<PlantWithCareData[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);

  // Edit form states
  const [editForm, setEditForm] = useState({
    nickname: "",
    species_id: "",
    location: "",
    last_watered: "",
  });

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      // Fetch all basic data
      const [plantsRes, speciesRes, defaultCareTypesRes, userCareTypesRes] = await Promise.all([
        getAllPlants(),
        getAllSpecies(),
        getDefaultCareTypes(),
        getUserCareTypes(),
      ]);

      const plantsData = plantsRes.plants ?? [];
      const allCareTypes = [
        ...(defaultCareTypesRes.care_types ?? []),
        ...(userCareTypesRes.care_types ?? []),
      ];

      setSpecies(speciesRes.species ?? []);

      // Fetch care data for all plants
      const [upcomingCareData, ...careLogsData] = await Promise.all([
        getUpcomingCareLogs(),
        ...plantsData.map((plant: Plant) => getCareLogsByPlant(plant.id)),
      ]);

      // Enrich each plant with care data
      const enriched: PlantWithCareData[] = plantsData.map((plant: Plant, index: number) => {
        const careLogs = careLogsData[index].care_logs ?? [];
        const upcomingCare = upcomingCareData.filter((care: UpcomingCareLog) => care.plant_id === plant.id);

        // Calculate urgency status
        let urgencyStatus: "overdue" | "due_today" | "due_soon" | "up_to_date" = "up_to_date";
        if (upcomingCare.length > 0) {
          const mostUrgent = upcomingCare.reduce((prev: UpcomingCareLog, curr: UpcomingCareLog) =>
            curr.days_until_due < prev.days_until_due ? curr : prev
          );

          if (mostUrgent.days_until_due < 0) {
            urgencyStatus = "overdue";
          } else if (mostUrgent.days_until_due === 0) {
            urgencyStatus = "due_today";
          } else if (mostUrgent.days_until_due <= 3) {
            urgencyStatus = "due_soon";
          }
        }

        // Group care logs by care type and get most recent for each
        const careTypeMap = new Map<number, CareLog>();
        careLogs.forEach((log: CareLog) => {
          const existing = careTypeMap.get(log.care_type_id);
          if (!existing || new Date(log.care_date) > new Date(existing.care_date)) {
            careTypeMap.set(log.care_type_id, log);
          }
        });

        // Create care history summary
        const recentCareHistory = Array.from(careTypeMap.values())
          .map((log: CareLog) => {
            const careType = allCareTypes.find((ct: CareType) => ct.id === log.care_type_id);
            const careDate = new Date(log.care_date);
            const now = new Date();
            const daysAgo = Math.floor((now.getTime() - careDate.getTime()) / (1000 * 60 * 60 * 24));

            return {
              careTypeName: careType?.name || "Unknown",
              lastCareDate: log.care_date,
              daysAgo,
            };
          })
          .sort((a, b) => a.daysAgo - b.daysAgo)
          .slice(0, 5); // Show only top 5 most recent care types

        return {
          ...plant,
          recentCareHistory,
          upcomingCare,
          urgencyStatus,
        };
      });

      setEnrichedPlants(enriched);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load plants");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditDialog = (plant: Plant) => {
    setEditingPlant(plant);
    setEditForm({
      nickname: plant.nickname,
      species_id: plant.species_id?.toString() || "",
      location: plant.location || "",
      last_watered: plant.last_watered || "",
    });
  };

  const closeEditDialog = () => {
    setEditingPlant(null);
    setEditForm({
      nickname: "",
      species_id: "",
      location: "",
      last_watered: "",
    });
    setError("");
  };

  const handleEdit = async () => {
    if (!editingPlant || !editForm.nickname) {
      setError("Nickname is required");
      return;
    }

    setFormLoading(true);
    setError("");
    try {
      const updateData: any = {
        nickname: editForm.nickname,
      };

      if (editForm.species_id) updateData.species_id = parseInt(editForm.species_id);
      if (editForm.location) updateData.location = editForm.location;
      if (editForm.last_watered) updateData.last_watered = editForm.last_watered;

      await updatePlant(editingPlant.id, updateData);
      setSuccess("Plant updated successfully!");
      closeEditDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update plant");
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteDialog = (plant: Plant) => {
    setPlantToDelete(plant);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!plantToDelete) return;

    setFormLoading(true);
    setError("");
    try {
      await deletePlant(plantToDelete.id);
      setSuccess(`${plantToDelete.nickname} deleted successfully!`);
      setDeleteDialogOpen(false);
      setPlantToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete plant");
    } finally {
      setFormLoading(false);
    }
  };

  const getSpeciesName = (speciesId: number | undefined) => {
    if (!speciesId) return "No species";
    const s = species.find((sp) => sp.id === speciesId);
    return s?.common_name || "Unknown species";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                My Plants
              </h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                View and manage your plant collection
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                onClick={() => navigate("/plants/add")}
                className="w-full sm:w-auto"
              >
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Add Plant
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Plants Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              All Plants ({enrichedPlants.length})
            </h2>
            {isLoading ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    Loading plants...
                  </p>
                </CardContent>
              </Card>
            ) : enrichedPlants.length === 0 ? (
              <Card>
                <CardContent>
                  <div className="py-8 text-center space-y-3">
                    <p className="text-muted-foreground">
                      No plants yet. Start your collection!
                    </p>
                    <Button onClick={() => navigate("/plants/add")}>
                      <PlusCircleIcon className="h-4 w-4 mr-2" />
                      Add Your First Plant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrichedPlants.map((plant) => (
                  <Card key={plant.id} className="overflow-hidden">
                    {plant.cover_photo_id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/plants/${plant.id}`)}
                        className="group block w-full"
                      >
                        <AuthImage
                          photoId={plant.cover_photo_id}
                          thumb
                          className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </button>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-1 truncate">
                            <button
                              type="button"
                              onClick={() => navigate(`/plants/${plant.id}`)}
                              className="hover:underline text-left"
                            >
                              {plant.nickname}
                            </button>
                          </CardTitle>
                          <CardDescription className="mb-2">
                            {getSpeciesName(plant.species_id)}
                          </CardDescription>
                          <div className="flex items-center gap-2 flex-wrap">
                            {plant.urgencyStatus === "overdue" && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                            {plant.urgencyStatus === "due_today" && (
                              <Badge variant="warning">Due Today</Badge>
                            )}
                            {plant.urgencyStatus === "due_soon" && (
                              <Badge variant="success">Due Soon</Badge>
                            )}
                            {plant.urgencyStatus === "up_to_date" && plant.recentCareHistory.length > 0 && (
                              <Badge variant="secondary">All Set</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {/* Edit Dialog */}
                          <Dialog
                            open={editingPlant?.id === plant.id}
                            onOpenChange={(open) => {
                              if (!open) closeEditDialog();
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(plant)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Plant</DialogTitle>
                                <DialogDescription>
                                  Update your plant's information
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Nickname */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-nickname">
                                    Nickname <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    id="edit-nickname"
                                    value={editForm.nickname}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        nickname: e.target.value,
                                      })
                                    }
                                    disabled={formLoading}
                                  />
                                </div>

                                {/* Species */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-species">Species</Label>
                                  <Select
                                    value={editForm.species_id}
                                    onValueChange={(value) =>
                                      setEditForm({
                                        ...editForm,
                                        species_id: value,
                                      })
                                    }
                                    disabled={formLoading}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select species" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {species.map((s) => (
                                        <SelectItem
                                          key={s.id}
                                          value={s.id.toString()}
                                        >
                                          {s.common_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-location">Location</Label>
                                  <Input
                                    id="edit-location"
                                    value={editForm.location}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        location: e.target.value,
                                      })
                                    }
                                    placeholder="e.g., Living room window"
                                    disabled={formLoading}
                                  />
                                </div>

                                {/* Last Watered */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-watered">
                                    Last Watered
                                  </Label>
                                  <Input
                                    id="edit-watered"
                                    type="date"
                                    value={editForm.last_watered}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        last_watered: e.target.value,
                                      })
                                    }
                                    disabled={formLoading}
                                  />
                                </div>

                                {error && (
                                  <Alert variant="destructive">
                                    <AlertCircleIcon className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                  </Alert>
                                )}

                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleEdit}
                                    disabled={formLoading || !editForm.nickname}
                                    className="flex-1"
                                  >
                                    {formLoading ? "Saving..." : "Save Changes"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={closeEditDialog}
                                    disabled={formLoading}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(plant)}
                          >
                            <Trash2Icon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Location & Date Info */}
                      {(plant.location || plant.date_added) && (
                        <div className="rounded-lg bg-muted/20 p-3 space-y-2">
                          {plant.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-foreground">{plant.location}</span>
                            </div>
                          )}
                          {plant.date_added && (
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">
                                Added {format(parseLocalDate(plant.date_added), "PP")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Recent Care History */}
                      {plant.recentCareHistory.length > 0 && (
                        <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                            <span>Recent Care</span>
                          </div>
                          <div className="space-y-1.5">
                            {plant.recentCareHistory.map((care, idx) => (
                              <div key={idx} className="flex items-baseline gap-1.5 text-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                                <div>
                                  <span className="font-medium text-foreground">{care.careTypeName}</span>
                                  <span className="text-muted-foreground">
                                    {" "}· {care.daysAgo === 0
                                      ? "today"
                                      : care.daysAgo === 1
                                      ? "yesterday"
                                      : `${care.daysAgo}d ago`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upcoming Care */}
                      {plant.upcomingCare.length > 0 && (
                        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <ClockIcon className="h-4 w-4 text-primary" />
                            <span>Upcoming Care</span>
                          </div>
                          <div className="space-y-1.5">
                            {plant.upcomingCare.slice(0, 3).map((care, idx) => {
                              const isPending = care.days_until_due > 7;
                              return (
                                <div key={idx} className="flex items-baseline gap-1.5 text-sm">
                                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${
                                    care.days_until_due < 0
                                      ? "bg-destructive"
                                      : care.days_until_due === 0
                                      ? "bg-yellow-500"
                                      : isPending
                                      ? "bg-muted-foreground/40"
                                      : "bg-green-500"
                                  }`} />
                                  <div>
                                    <span className="font-medium text-foreground">{care.care_type}</span>
                                    <span className={`${
                                      care.days_until_due < 0
                                        ? "text-destructive"
                                        : care.days_until_due === 0
                                        ? "text-yellow-600 dark:text-yellow-500"
                                        : isPending
                                        ? "text-muted-foreground/70"
                                        : "text-muted-foreground"
                                    }`}>
                                      {" "}· {care.days_until_due < 0
                                        ? `${Math.abs(care.days_until_due)}d overdue`
                                        : care.days_until_due === 0
                                        ? "due today"
                                        : `in ${care.days_until_due}d`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* No care data message */}
                      {plant.recentCareHistory.length === 0 && plant.upcomingCare.length === 0 && (
                        <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            No care logs or plans yet
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Add a care plan to get started
                          </p>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="pt-3 border-t flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/log-care?plant=${plant.id}`)}
                        >
                          Log Care
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/care-plans/add?plant=${plant.id}`)}
                        >
                          Add Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Plant</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{plantToDelete?.nickname}"?
                  This will also delete all associated care logs and care plans.
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={formLoading}
                >
                  {formLoading ? "Deleting..." : "Delete Plant"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
