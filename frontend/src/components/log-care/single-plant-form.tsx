import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { CameraIcon, XIcon } from "lucide-react";
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
import { PlantSelect } from "@/components/forms/plant-select";
import { CareTypeSelect } from "@/components/forms/care-type-select";
import { createCareLog } from "@/api/careLogs";
import { uploadCareLogPhotos } from "@/api/photos";
import type { Plant, CareType } from "@/types";
import { getTodayLocal, getErrorMessage } from "@/lib/utils";

interface SinglePlantFormProps {
  plants: Plant[];
  careTypes: CareType[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Single-plant care logging form: plant, care type, date, note, and optional
 * photo attachment. Reports outcomes via callbacks so the parent can refresh.
 */
export function SinglePlantForm({
  plants,
  careTypes,
  loading,
  onSuccess,
  onError,
}: SinglePlantFormProps) {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    plant_id: "",
    care_type_id: "",
    care_date: getTodayLocal(),
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Photo selection
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; preview: string }[]
  >([]);
  const filesRef = useRef(selectedFiles);
  filesRef.current = selectedFiles;

  useEffect(() => {
    return () =>
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
  }, []);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearFiles = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    setSelectedFiles([]);
  };

  // Pre-select plant from URL query parameter once plants are loaded
  useEffect(() => {
    const plantId = searchParams.get("plant");
    if (plantId && plants.length > 0 && !form.plant_id) {
      setForm((prev) => ({ ...prev, plant_id: plantId }));
    }
  }, [plants, searchParams, form.plant_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.plant_id || !form.care_type_id) {
      onError("Plant and care type are required");
      return;
    }

    setSubmitting(true);
    try {
      const logData: {
        plant_id: number;
        care_type_id: number;
        care_date?: string;
        note?: string;
      } = {
        plant_id: parseInt(form.plant_id),
        care_type_id: parseInt(form.care_type_id),
      };

      if (form.care_date) logData.care_date = form.care_date;
      if (form.note) logData.note = form.note;

      const result = await createCareLog(logData);

      // Upload photos if any were selected
      if (selectedFiles.length > 0) {
        try {
          await uploadCareLogPhotos(
            result.care_log.id,
            selectedFiles.map((f) => f.file),
          );
        } catch {
          clearFiles();
          onSuccess("Care logged, but photo upload failed.");
          return;
        }
      }

      clearFiles();

      // Reset form
      setForm({
        plant_id: "",
        care_type_id: "",
        care_date: getTodayLocal(),
        note: "",
      });

      onSuccess("Care logged successfully!");
    } catch (err) {
      onError(getErrorMessage(err, "Failed to log care. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Care Activity</CardTitle>
        <CardDescription>Record a care activity for one plant</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plant Selection */}
          <div className="space-y-2">
            <Label htmlFor="plant_id">
              Plant <span className="text-destructive">*</span>
            </Label>
            <PlantSelect
              value={form.plant_id}
              onValueChange={(value) => setForm({ ...form, plant_id: value })}
              plants={plants}
              disabled={busy}
            />
          </div>

          {/* Care Type */}
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
              disabled={busy}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="care_date">Date</Label>
            <Input
              id="care_date"
              type="date"
              value={form.care_date}
              onChange={(e) => setForm({ ...form, care_date: e.target.value })}
              disabled={busy}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Notes (Optional)</Label>
            <Input
              id="note"
              type="text"
              placeholder="Any observations or details"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={busy}
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((item, idx) => (
                <div
                  key={item.preview}
                  className="group relative h-16 w-16 overflow-hidden rounded-lg"
                >
                  <img
                    src={item.preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-muted-foreground/50">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                  disabled={busy}
                />
                <CameraIcon className="h-5 w-5 text-muted-foreground" />
              </label>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={busy} className="w-full">
            {submitting ? "Logging..." : "Log Care"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
