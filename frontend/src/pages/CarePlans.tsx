import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilIcon, Trash2Icon, AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAllCarePlans, updateCarePlan, deleteCarePlan } from "@/api/carePlans";
import { getAllPlants } from "@/api/plants";
import { getDefaultCareTypes, getUserCareTypes } from "@/api/careTypes";
import type { CarePlan, Plant, CareType } from "@/types";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

export default function CarePlans() {
  const navigate = useNavigate();
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [careTypes, setCareTypes] = useState<CareType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<CarePlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<CarePlan | null>(null);

  // Edit form states
  const [editForm, setEditForm] = useState({
    plant_id: "",
    care_type_id: "",
    start_date: "",
    frequency_days: "",
    note: "",
    active: true,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const [plansRes, plantsRes, defaultTypes, userTypes] = await Promise.all([
        getAllCarePlans().catch(() => []),
        getAllPlants(),
        getDefaultCareTypes(),
        getUserCareTypes().catch(() => ({ care_types: [] })),
      ]);

      setCarePlans(plansRes);
      setPlants(plantsRes.plants ?? []);

      // Combine default and user care types
      const allCareTypes = [
        ...(defaultTypes.care_types ?? []),
        ...(userTypes.care_types ?? []),
      ];
      setCareTypes(allCareTypes);
    } catch (err) {
      console.error("Failed to load care plans:", err);
      setError("Failed to load care plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditDialog = (plan: CarePlan) => {
    setEditingPlan(plan);
    setEditForm({
      plant_id: plan.plant_id.toString(),
      care_type_id: plan.care_type_id.toString(),
      start_date: plan.start_date || "",
      frequency_days: plan.frequency_days?.toString() || "",
      note: plan.note || "",
      active: plan.active,
    });
  };

  const closeEditDialog = () => {
    setEditingPlan(null);
    setEditForm({
      plant_id: "",
      care_type_id: "",
      start_date: "",
      frequency_days: "",
      note: "",
      active: true,
    });
    setError("");
  };

  const handleEdit = async () => {
    if (!editingPlan || !editForm.plant_id || !editForm.care_type_id) {
      setError("Plant and care type are required");
      return;
    }

    setFormLoading(true);
    setError("");
    try {
      const updateData: any = {
        plant_id: parseInt(editForm.plant_id),
        care_type_id: parseInt(editForm.care_type_id),
        active: editForm.active,
      };

      if (editForm.start_date) updateData.start_date = editForm.start_date;
      if (editForm.frequency_days) updateData.frequency_days = parseInt(editForm.frequency_days);
      if (editForm.note) updateData.note = editForm.note;

      await updateCarePlan(editingPlan.id, updateData);
      setSuccess("Care plan updated successfully!");
      closeEditDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update care plan");
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteDialog = (plan: CarePlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;

    setFormLoading(true);
    setError("");
    try {
      await deleteCarePlan(planToDelete.id);
      setSuccess("Care plan deleted successfully!");
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete care plan");
    } finally {
      setFormLoading(false);
    }
  };

  // Helper functions to get names
  const getPlantName = (plantId: number) => {
    const plant = plants.find((p) => p.id === plantId);
    return plant?.nickname || `Plant #${plantId}`;
  };

  const getCareTypeName = (careTypeId: number) => {
    const careType = careTypes.find((ct) => ct.id === careTypeId);
    return careType?.name || `Care Type #${careTypeId}`;
  };

  const activePlans = carePlans.filter((plan) => plan.active);
  const inactivePlans = carePlans.filter((plan) => !plan.active);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Care Plans
              </h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Manage your plant care schedules
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                onClick={() => navigate("/care-plans/add")}
                className="w-full sm:w-auto"
              >
                Create Care Plan
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
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

          {/* Active Plans */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Active Plans ({activePlans.length})
            </h2>
            {isLoading ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    Loading care plans...
                  </p>
                </CardContent>
              </Card>
            ) : activePlans.length === 0 ? (
              <Card>
                <CardContent>
                  <div className="py-8 text-center space-y-3">
                    <p className="text-muted-foreground">
                      No active care plans yet.
                    </p>
                    <Button onClick={() => navigate("/care-plans/add")}>
                      Create Your First Care Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlans.map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {getPlantName(plan.plant_id)}
                          </CardTitle>
                          <CardDescription>
                            {getCareTypeName(plan.care_type_id)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          {/* Edit Dialog */}
                          <Dialog
                            open={editingPlan?.id === plan.id}
                            onOpenChange={(open) => {
                              if (!open) closeEditDialog();
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(plan)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Care Plan</DialogTitle>
                                <DialogDescription>
                                  Update your care plan details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Plant Selection */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-plant">
                                    Plant <span className="text-destructive">*</span>
                                  </Label>
                                  <Select
                                    value={editForm.plant_id}
                                    onValueChange={(value) =>
                                      setEditForm({ ...editForm, plant_id: value })
                                    }
                                    disabled={formLoading}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a plant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {plants.map((plant) => (
                                        <SelectItem key={plant.id} value={plant.id.toString()}>
                                          {plant.nickname}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Care Type Selection */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-care-type">
                                    Care Type <span className="text-destructive">*</span>
                                  </Label>
                                  <Select
                                    value={editForm.care_type_id}
                                    onValueChange={(value) =>
                                      setEditForm({ ...editForm, care_type_id: value })
                                    }
                                    disabled={formLoading}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select care type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {careTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                          {type.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-start-date">Start Date</Label>
                                  <Input
                                    id="edit-start-date"
                                    type="date"
                                    value={editForm.start_date}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, start_date: e.target.value })
                                    }
                                    disabled={formLoading}
                                  />
                                </div>

                                {/* Frequency */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-frequency">Frequency (Days)</Label>
                                  <Input
                                    id="edit-frequency"
                                    type="number"
                                    min="1"
                                    value={editForm.frequency_days}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, frequency_days: e.target.value })
                                    }
                                    placeholder="e.g., 7 for weekly"
                                    disabled={formLoading}
                                  />
                                </div>

                                {/* Note */}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-note">Note</Label>
                                  <Input
                                    id="edit-note"
                                    value={editForm.note}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, note: e.target.value })
                                    }
                                    placeholder="Any special instructions"
                                    disabled={formLoading}
                                  />
                                </div>

                                {/* Active Checkbox */}
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-active"
                                    checked={editForm.active}
                                    onCheckedChange={(checked) =>
                                      setEditForm({ ...editForm, active: checked as boolean })
                                    }
                                    disabled={formLoading}
                                  />
                                  <Label htmlFor="edit-active" className="cursor-pointer">
                                    Active (plan is enabled)
                                  </Label>
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
                                    disabled={formLoading}
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
                            onClick={() => openDeleteDialog(plan)}
                          >
                            <Trash2Icon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {plan.start_date && (
                        <div className="text-sm">
                          <span className="font-medium">Start Date:</span>{" "}
                          {format(parseLocalDate(plan.start_date), "PPP")}
                        </div>
                      )}
                      {plan.frequency_days && (
                        <div className="text-sm">
                          <span className="font-medium">Frequency:</span> Every{" "}
                          {plan.frequency_days} day
                          {plan.frequency_days !== 1 && "s"}
                        </div>
                      )}
                      {plan.note && (
                        <div className="text-sm">
                          <span className="font-medium">Note:</span> {plan.note}
                        </div>
                      )}
                      <div className="pt-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                          Active
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Inactive Plans */}
          {inactivePlans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Inactive Plans ({inactivePlans.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactivePlans.map((plan) => (
                  <Card key={plan.id} className="opacity-60">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {getPlantName(plan.plant_id)}
                          </CardTitle>
                          <CardDescription>
                            {getCareTypeName(plan.care_type_id)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          {/* Edit Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(plan)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(plan)}
                          >
                            <Trash2Icon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {plan.start_date && (
                        <div className="text-sm">
                          <span className="font-medium">Start Date:</span>{" "}
                          {format(parseLocalDate(plan.start_date), "PPP")}
                        </div>
                      )}
                      {plan.frequency_days && (
                        <div className="text-sm">
                          <span className="font-medium">Frequency:</span> Every{" "}
                          {plan.frequency_days} day
                          {plan.frequency_days !== 1 && "s"}
                        </div>
                      )}
                      {plan.note && (
                        <div className="text-sm">
                          <span className="font-medium">Note:</span> {plan.note}
                        </div>
                      )}
                      <div className="pt-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                          Inactive
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Care Plan</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this care plan for{" "}
                  {planToDelete && getPlantName(planToDelete.plant_id)}?
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
                  {formLoading ? "Deleting..." : "Delete Care Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
