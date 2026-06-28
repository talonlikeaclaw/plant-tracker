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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateCareType } from "@/api/careTypes";
import { getErrorMessage } from "@/lib/utils";
import type { CareType } from "@/types";

interface EditCareTypeDialogProps {
  careType: CareType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditCareTypeDialog({
  careType,
  open,
  onOpenChange,
  onSuccess,
}: EditCareTypeDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (careType) {
      setName(careType.name);
      setDescription(careType.description || "");
      setError("");
    }
  }, [careType]);

  const handleSave = async () => {
    if (!careType || !name) return;

    setLoading(true);
    setError("");
    try {
      await updateCareType(careType.id, { name, description });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update care type"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Care Type</DialogTitle>
          <DialogDescription>Update the name and description</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
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
              onClick={handleSave}
              disabled={loading || !name}
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
