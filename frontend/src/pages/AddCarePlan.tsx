import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircleIcon, CheckCircle2Icon, PlusCircleIcon } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCarePlan } from "@/api/carePlans";
import { getDefaultCareTypes, getUserCareTypes, createCareType } from "@/api/careTypes";
import { getAllPlants } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import type { Plant, CareType, Species } from "@/types";

export default function AddCarePlan() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    plant_id: "",
    care_type_id: "",
    start_date: "",
    frequency_days: "",
    note: "",
    active: true,
  });

  const [plants, setPlants] = useState<Plant[]>([]);
  const [careTypes, setCareTypes] = useState<CareType[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCareTypeName, setNewCareTypeName] = useState("");
  const [newCareTypeDesc, setNewCareTypeDesc] = useState("");
  const [careTypeLoading, setCareTypeLoading] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const loadData = async () => {
    try {
      const [plantsRes, speciesRes, defaultTypes, userTypes] = await Promise.all([
        getAllPlants(),
        getAllSpecies(),
        getDefaultCareTypes(),
        getUserCareTypes().catch(() => ({ care_types: [] })),
      ]);

      setPlants(plantsRes.plants ?? []);
      setSpecies(speciesRes.species ?? []);

      // Combine default and user care types
      const allCareTypes = [
        ...(defaultTypes.care_types ?? []),
        ...(userTypes.care_types ?? []),
      ];
      setCareTypes(allCareTypes);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load plants and care types");
    }
  };

  // Helper to parse watering frequency from text
  const parseWateringFrequency = (waterText: string): number | null => {
    const lower = waterText.toLowerCase();
    if (lower.includes("daily")) return 1;
    if (lower.includes("weekly") || lower.includes("week")) return 7;
    if (lower.includes("bi-weekly") || lower.includes("biweekly") || lower.includes("2 weeks")) return 14;
    if (lower.includes("monthly") || lower.includes("month")) return 30;
    if (lower.includes("every 3 days")) return 3;
    if (lower.includes("every 5 days")) return 5;
    if (lower.includes("every 10 days")) return 10;
    return null;
  };

  // Handle plant selection
  const handlePlantSelect = (plantId: string) => {
    setForm({ ...form, plant_id: plantId });
    const plant = plants.find((p) => p.id.toString() === plantId);
    setSelectedPlant(plant || null);
  };

  // Auto-suggest based on species
  const handleAutoSuggest = () => {
    if (!selectedPlant) return;

    const plantSpecies = species.find((s) => s.id === selectedPlant.species_id);
    if (!plantSpecies) return;

    // Find watering care type
    const wateringType = careTypes.find(
      (ct) => ct.name.toLowerCase().includes("water")
    );

    if (wateringType && plantSpecies.water_requirements) {
      const suggestedFreq = parseWateringFrequency(plantSpecies.water_requirements);

      setForm({
        ...form,
        care_type_id: wateringType.id.toString(),
        frequency_days: suggestedFreq ? suggestedFreq.toString() : "",
        start_date: new Date().toISOString().split("T")[0],
        note: `Based on ${plantSpecies.common_name} water requirements`,
      });
    }
  };

  // Get species for selected plant
  const getSelectedPlantSpecies = (): Species | null => {
    if (!selectedPlant) return null;
    return species.find((s) => s.id === selectedPlant.species_id) || null;
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCareType = async () => {
    if (!newCareTypeName) {
      return;
    }

    setCareTypeLoading(true);
    try {
      const result = await createCareType({
        name: newCareTypeName,
        description: newCareTypeDesc,
      });

      // Add to list and select it
      const newType = result.care_type;
      setCareTypes([...careTypes, newType]);
      setForm({ ...form, care_type_id: newType.id.toString() });

      // Reset and close dialog
      setNewCareTypeName("");
      setNewCareTypeDesc("");
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create care type");
    } finally {
      setCareTypeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.plant_id || !form.care_type_id) {
      setError("Plant and care type are required");
      return;
    }

    setLoading(true);
    try {
      const carePlanData: any = {
        plant_id: parseInt(form.plant_id),
        care_type_id: parseInt(form.care_type_id),
        active: form.active,
      };

      if (form.start_date) carePlanData.start_date = form.start_date;
      if (form.frequency_days) carePlanData.frequency_days = parseInt(form.frequency_days);
      if (form.note) carePlanData.note = form.note;

      await createCarePlan(carePlanData);
      setSuccess("Care plan created successfully!");

      // Reset form
      setForm({
        plant_id: "",
        care_type_id: "",
        start_date: "",
        frequency_days: "",
        note: "",
        active: true,
      });

      // Redirect after delay
      setTimeout(() => {
        navigate("/care-plans");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to create care plan. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Create Care Plan
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set up a recurring care schedule for your plants
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Care Plan Details</CardTitle>
              <CardDescription>
                Choose a plant and care type to schedule regular care activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Plant Selection */}
                <div className="space-y-2">
                  <Label htmlFor="plant_id">
                    Select Plant <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.plant_id}
                    onValueChange={handlePlantSelect}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No plants available
                        </SelectItem>
                      ) : (
                        plants.map((plant) => (
                          <SelectItem key={plant.id} value={plant.id.toString()}>
                            {plant.nickname}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Plant Species Info */}
                {selectedPlant && getSelectedPlantSpecies() && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {getSelectedPlantSpecies()?.common_name}
                          </CardTitle>
                          {getSelectedPlantSpecies()?.scientific_name && (
                            <CardDescription className="text-sm italic">
                              {getSelectedPlantSpecies()?.scientific_name}
                            </CardDescription>
                          )}
                        </div>
                        {getSelectedPlantSpecies()?.water_requirements && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAutoSuggest}
                          >
                            Auto-suggest watering
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {getSelectedPlantSpecies()?.water_requirements && (
                        <div className="text-sm">
                          <span className="font-medium">Water:</span>{" "}
                          {getSelectedPlantSpecies()?.water_requirements}
                        </div>
                      )}
                      {getSelectedPlantSpecies()?.sunlight && (
                        <div className="text-sm">
                          <span className="font-medium">Sunlight:</span>{" "}
                          {getSelectedPlantSpecies()?.sunlight}
                        </div>
                      )}
                      {selectedPlant.location && (
                        <div className="text-sm">
                          <span className="font-medium">Current location:</span>{" "}
                          {selectedPlant.location}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Care Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="care_type_id">
                    Care Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.care_type_id}
                    onValueChange={(value) =>
                      setForm({ ...form, care_type_id: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select care type" />
                    </SelectTrigger>
                    <SelectContent>
                      {careTypes.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No care types available
                        </SelectItem>
                      ) : (
                        careTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                            {type.description && ` - ${type.description}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-sm"
                      >
                        <PlusCircleIcon className="h-3 w-3 mr-1" />
                        Add custom care type
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Custom Care Type</DialogTitle>
                        <DialogDescription>
                          Add your own care activity type
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="care_type_name">Name</Label>
                          <Input
                            id="care_type_name"
                            value={newCareTypeName}
                            onChange={(e) => setNewCareTypeName(e.target.value)}
                            placeholder="e.g., Pruning, Misting"
                            disabled={careTypeLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="care_type_desc">
                            Description (Optional)
                          </Label>
                          <Input
                            id="care_type_desc"
                            value={newCareTypeDesc}
                            onChange={(e) => setNewCareTypeDesc(e.target.value)}
                            placeholder="Brief description"
                            disabled={careTypeLoading}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={handleAddCareType}
                            disabled={careTypeLoading || !newCareTypeName}
                            className="flex-1"
                          >
                            {careTypeLoading ? "Adding..." : "Add Care Type"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={careTypeLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date (Optional)</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    When to start this care schedule. Leave empty for today.
                  </p>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency_days">
                    Frequency (Days) (Optional)
                  </Label>
                  <Input
                    id="frequency_days"
                    name="frequency_days"
                    type="number"
                    min="1"
                    placeholder="e.g., 7 for weekly"
                    value={form.frequency_days}
                    onChange={(e) =>
                      setForm({ ...form, frequency_days: e.target.value })
                    }
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often to repeat this care (in days). Example: 7 = weekly,
                    14 = bi-weekly
                  </p>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Notes (Optional)</Label>
                  <Input
                    id="note"
                    name="note"
                    type="text"
                    placeholder="Any special instructions or reminders"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    disabled={loading}
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={form.active}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, active: checked as boolean })
                    }
                    disabled={loading}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    Active (plan is enabled)
                  </Label>
                </div>

                {/* Success Message */}
                {success && (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating Plan..." : "Create Care Plan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
