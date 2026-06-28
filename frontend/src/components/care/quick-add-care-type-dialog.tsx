import { useState } from "react";
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
import { createCareType } from "@/api/careTypes";
import { getErrorMessage } from "@/lib/utils";
import type { CareType } from "@/types";

interface QuickAddCareTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (careType: CareType) => void;
}

export function QuickAddCareTypeDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickAddCareTypeDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name) return;

    setLoading(true);
    setError("");
    try {
      const result = await createCareType({ name, description });
      onCreated?.(result.care_type);
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create care type"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pruning, Misting"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="care_type_desc">Description (Optional)</Label>
            <Input
              id="care_type_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || !name}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add Care Type"}
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
