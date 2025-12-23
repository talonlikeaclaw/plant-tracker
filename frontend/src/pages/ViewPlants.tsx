import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilIcon, Trash2Icon, AlertCircleIcon, PlusCircleIcon } from "lucide-react";
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
import { getAllPlants, updatePlant, deletePlant } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import type { Plant, Species } from "@/types";
import { format } from "date-fns";

export default function ViewPlants() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
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
      const [plantsRes, speciesRes] = await Promise.all([
        getAllPlants(),
        getAllSpecies(),
      ]);

      setPlants(plantsRes.plants ?? []);
      setSpecies(speciesRes.species ?? []);
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Plants</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your plant collection
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/plants/add")}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Add Plant
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
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
              All Plants ({plants.length})
            </h2>
            {isLoading ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    Loading plants...
                  </p>
                </CardContent>
              </Card>
            ) : plants.length === 0 ? (
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
                {plants.map((plant) => (
                  <Card key={plant.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {plant.nickname}
                          </CardTitle>
                          <CardDescription>
                            {getSpeciesName(plant.species_id)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
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
                    <CardContent className="space-y-2">
                      {plant.location && (
                        <div className="text-sm">
                          <span className="font-medium">Location:</span>{" "}
                          {plant.location}
                        </div>
                      )}
                      {plant.date_added && (
                        <div className="text-sm">
                          <span className="font-medium">Added:</span>{" "}
                          {format(new Date(plant.date_added), "PPP")}
                        </div>
                      )}
                      {plant.last_watered && (
                        <div className="text-sm">
                          <span className="font-medium">Last watered:</span>{" "}
                          {format(new Date(plant.last_watered), "PPP")}
                        </div>
                      )}
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
