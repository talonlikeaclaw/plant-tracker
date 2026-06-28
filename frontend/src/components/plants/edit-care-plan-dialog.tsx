import { useEffect, useState } from "react";
import { AlertCircleIcon } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateCarePlan } from "@/api/carePlans";
import { getErrorMessage } from "@/lib/utils";
import type { CarePlan, Plant, CareType } from "@/types";

interface EditCarePlanDialogProps {
  plan: CarePlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plants: Plant[];
  careTypes: CareType[];
  onSuccess?: () => void;
}

export function EditCarePlanDialog({
  plan,
  open,
  onOpenChange,
  plants,
  careTypes,
  onSuccess,
}: EditCarePlanDialogProps) {
  const [form, setForm] = useState({
    plant_id: "",
    care_type_id: "",
    start_date: "",
    frequency_days: "",
    note: "",
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (plan) {
      setForm({
        plant_id: plan.plant_id.toString(),
        care_type_id: plan.care_type_id.toString(),
        start_date: plan.start_date || "",
        frequency_days: plan.frequency_days?.toString() || "",
        note: plan.note || "",
        active: plan.active,
      });
      setError("");
    }
  }, [plan]);

  const handleSave = async () => {
    if (!plan || !form.plant_id || !form.care_type_id) {
      setError("Plant and care type are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const updateData: {
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

      if (form.start_date) updateData.start_date = form.start_date;
      if (form.frequency_days)
        updateData.frequency_days = parseInt(form.frequency_days);
      if (form.note) updateData.note = form.note;

      await updateCarePlan(plan.id, updateData);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update care plan"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Care Plan</DialogTitle>
          <DialogDescription>Update your care plan details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Plant Selection */}
          <div className="space-y-2">
            <Label htmlFor="edit-plant">
              Plant <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.plant_id}
              onValueChange={(value) => setForm({ ...form, plant_id: value })}
              disabled={loading}
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
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="edit-frequency">Frequency (Days)</Label>
            <Input
              id="edit-frequency"
              type="number"
              min="1"
              value={form.frequency_days}
              onChange={(e) =>
                setForm({ ...form, frequency_days: e.target.value })
              }
              placeholder="e.g., 7 for weekly"
              disabled={loading}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="edit-note">Note</Label>
            <Input
              id="edit-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Any special instructions"
              disabled={loading}
            />
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-active"
              checked={form.active}
              onCheckedChange={(checked) =>
                setForm({ ...form, active: checked as boolean })
              }
              disabled={loading}
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
            <Button onClick={handleSave} disabled={loading} className="flex-1">
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
