import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/feedback/status-alerts";
import { SpeciesSelect } from "@/components/forms/species-select";
import { updatePlant } from "@/api/plants";
import { getErrorMessage } from "@/lib/utils";
import type { Plant, Species } from "@/types";

interface EditPlantDialogProps {
  plant: Plant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  species: Species[];
  onSuccess?: () => void;
}

/**
 * Self-contained edit dialog for a plant.
 * Manages its own form state and error feedback.
 */
export function EditPlantDialog({
  plant,
  open,
  onOpenChange,
  species,
  onSuccess,
}: EditPlantDialogProps) {
  const [form, setForm] = useState({
    nickname: "",
    species_id: "",
    location: "",
    last_watered: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (plant) {
      setForm({
        nickname: plant.nickname,
        species_id: plant.species_id?.toString() || "",
        location: plant.location || "",
        last_watered: plant.last_watered || "",
      });
      setError("");
    }
  }, [plant]);

  const handleSubmit = async () => {
    if (!plant || !form.nickname) {
      setError("Nickname is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const updateData: {
        nickname: string;
        species_id?: number;
        location?: string;
        last_watered?: string;
      } = {
        nickname: form.nickname,
      };
      if (form.species_id) updateData.species_id = parseInt(form.species_id);
      if (form.location) updateData.location = form.location;
      if (form.last_watered) updateData.last_watered = form.last_watered;

      await updatePlant(plant.id, updateData);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update plant"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Plant</DialogTitle>
          <DialogDescription>
            Update your plant&apos;s information
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
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Species */}
          <div className="space-y-2">
            <Label htmlFor="edit-species">Species</Label>
            <SpeciesSelect
              value={form.species_id}
              onValueChange={(value) => setForm({ ...form, species_id: value })}
              species={species}
              disabled={loading}
              placeholder="Select species"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="edit-location">Location</Label>
            <Input
              id="edit-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Living room window"
              disabled={loading}
            />
          </div>

          {/* Last Watered */}
          <div className="space-y-2">
            <Label htmlFor="edit-watered">Last Watered</Label>
            <Input
              id="edit-watered"
              type="date"
              value={form.last_watered}
              onChange={(e) =>
                setForm({ ...form, last_watered: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {error && <ErrorAlert message={error} />}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.nickname}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
