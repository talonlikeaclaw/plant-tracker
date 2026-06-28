import { useState } from "react";
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
import { CareTypeSelect } from "@/components/forms/care-type-select";
import { createCareLog } from "@/api/careLogs";
import type { Plant, CareType } from "@/types";
import { getTodayLocal } from "@/lib/utils";

interface MultiPlantFormProps {
  plants: Plant[];
  careTypes: CareType[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Multi-plant care logging form: pick a care type and any number of plants,
 * then log the same activity for all of them at once.
 */
export function MultiPlantForm({
  plants,
  careTypes,
  loading,
  onSuccess,
  onError,
}: MultiPlantFormProps) {
  const [selectedPlants, setSelectedPlants] = useState<number[]>([]);
  const [multiCareType, setMultiCareType] = useState("");
  const [multiNote, setMultiNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const togglePlantSelection = (plantId: number) => {
    setSelectedPlants((prev) =>
      prev.includes(plantId)
        ? prev.filter((id) => id !== plantId)
        : [...prev, plantId],
    );
  };

  const handleSubmit = async () => {
    if (selectedPlants.length === 0 || !multiCareType) {
      onError("Please select at least one plant and a care type");
      return;
    }

    setSubmitting(true);
    try {
      const careDate = getTodayLocal();

      // Log care for each selected plant
      await Promise.all(
        selectedPlants.map((plantId) =>
          createCareLog({
            plant_id: plantId,
            care_type_id: parseInt(multiCareType),
            care_date: careDate,
            note: multiNote || undefined,
          }),
        ),
      );

      onSuccess(
        `Care logged for ${selectedPlants.length} plant${
          selectedPlants.length > 1 ? "s" : ""
        }!`,
      );

      // Reset
      setSelectedPlants([]);
      setMultiCareType("");
      setMultiNote("");
    } catch {
      onError("Failed to log care for some plants. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Care for Multiple Plants</CardTitle>
        <CardDescription>
          Select multiple plants to log the same care activity for all at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Care Type */}
        <div className="space-y-2">
          <Label>
            Care Type <span className="text-destructive">*</span>
          </Label>
          <CareTypeSelect
            value={multiCareType}
            onValueChange={setMultiCareType}
            careTypes={careTypes}
            disabled={busy}
          />
        </div>

        {/* Plant Selection */}
        <div className="space-y-2">
          <Label>
            Select Plants <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
            {plants.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2">
                No plants available
              </p>
            ) : (
              plants.map((plant) => (
                <div
                  key={plant.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`plant-${plant.id}`}
                    checked={selectedPlants.includes(plant.id)}
                    onCheckedChange={() => togglePlantSelection(plant.id)}
                    disabled={busy}
                  />
                  <Label
                    htmlFor={`plant-${plant.id}`}
                    className="cursor-pointer flex-1"
                  >
                    {plant.nickname}
                  </Label>
                </div>
              ))
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedPlants.length} plant
            {selectedPlants.length !== 1 && "s"} selected
          </p>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="multi-note">Notes (Optional)</Label>
          <Input
            id="multi-note"
            type="text"
            placeholder="Notes for all selected plants"
            value={multiNote}
            onChange={(e) => setMultiNote(e.target.value)}
            disabled={busy}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={busy || selectedPlants.length === 0}
          className="w-full"
        >
          {submitting
            ? "Logging..."
            : `Log Care for ${selectedPlants.length} Plant${
                selectedPlants.length !== 1 ? "s" : ""
              }`}
        </Button>
      </CardContent>
    </Card>
  );
}
