import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PageLayout } from "@/components/layout/page-layout";
import { SuccessAlert, ErrorAlert } from "@/components/feedback/status-alerts";
import { PlantSelect } from "@/components/forms/plant-select";
import { CareTypeSelect } from "@/components/forms/care-type-select";
import { QuickAddCareTypeDialog } from "@/components/care/quick-add-care-type-dialog";
import { SpeciesInfoCard } from "@/components/species/species-info-card";
import { createCarePlan } from "@/api/carePlans";
import {
  getDefaultCareTypes,
  getUserCareTypes,
} from "@/api/careTypes";
import { getAllPlants } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import type { Plant, CareType, Species } from "@/types";
import { getTodayLocal, getErrorMessage } from "@/lib/utils";

export default function AddCarePlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    const wateringType = careTypes.find((ct) =>
      ct.name.toLowerCase().includes("water"),
    );

    if (wateringType && plantSpecies.water_requirements) {
      const suggestedFreq = parseWateringFrequency(
        plantSpecies.water_requirements,
      );

      setForm({
        ...form,
        care_type_id: wateringType.id.toString(),
        frequency_days: suggestedFreq ? suggestedFreq.toString() : "",
        start_date: getTodayLocal(),
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

  // Pre-select plant from URL query parameter once plants are loaded
  useEffect(() => {
    const plantId = searchParams.get("plant");
    if (plantId && plants.length > 0 && !form.plant_id) {
      const plant = plants.find((p) => p.id.toString() === plantId);
      if (plant) {
        setForm((prev) => ({ ...prev, plant_id: plantId }));
        setSelectedPlant(plant);
      }
    }
  }, [plants, searchParams, form.plant_id]);

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
      const carePlanData: {
        plant_id: number;
        care_type_id: number;
        active: boolean;
        start_date?: string;
        frequency_days?: number;
        note?: string;
      } = {
        plant_id: parseInt(form.plant_id),
        care_type_id: parseInt(form.care_type_id),
        active: form.active,
      };

      if (form.start_date) carePlanData.start_date = form.start_date;
      if (form.frequency_days)
        carePlanData.frequency_days = parseInt(form.frequency_days);
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
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to create care plan. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const selectedSpecies = getSelectedPlantSpecies();

  return (
    <PageLayout
      title="Create Care Plan"
      subtitle="Set up a recurring care schedule for your plants"
      maxWidth="2xl"
      contentClassName=""
      headerActions={
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="shrink-0 w-full sm:w-auto"
        >
          Back to Dashboard
        </Button>
      }
    >
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
              <PlantSelect
                value={form.plant_id}
                onValueChange={handlePlantSelect}
                plants={plants}
                disabled={loading}
                placeholder="Choose a plant"
              />
            </div>

            {/* Plant Species Info */}
            {selectedPlant && selectedSpecies && (
              <SpeciesInfoCard
                species={selectedSpecies}
                plantLocation={selectedPlant.location}
                onAutoSuggest={handleAutoSuggest}
              />
            )}

            {/* Care Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="care_type_id">
                Care Type <span className="text-destructive">*</span>
              </Label>
              <CareTypeSelect
                value={form.care_type_id}
                onValueChange={(value) =>
                  setForm({ ...form, care_type_id: value })
                }
                careTypes={careTypes}
                disabled={loading}
                showDescription
              />
              <QuickAddCareTypeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onCreated={(newType) => {
                  setCareTypes([...careTypes, newType]);
                  setForm({ ...form, care_type_id: newType.id.toString() });
                }}
              />
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

            {/* Success / Error Messages */}
            {success && (
              <SuccessAlert message={success} withIcon />
            )}
            {error && <ErrorAlert message={error} />}

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
    </PageLayout>
  );
}
