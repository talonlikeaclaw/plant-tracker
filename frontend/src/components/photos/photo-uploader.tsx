import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PhotoPicker, type SelectedPhoto } from "@/components/photos/photo-picker";
import type { UploadPhotosResponse } from "@/api/photos";

interface PhotoUploaderProps {
  onUpload: (files: File[], featuredIndex: number | undefined, takenAts: (string | undefined)[]) => Promise<UploadPhotosResponse>;
}

export function PhotoUploader({ onUpload }: PhotoUploaderProps) {
  const [items, setItems] = useState<SelectedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (items.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const result = await onUpload(
        items.map((item) => item.file),
        items.findIndex((item) => item.isFeatured),
        items.map((item) => item.takenAt || undefined),
      );
      if (result.errors.length === 0) {
        setItems([]);
        return;
      }
      const failed = new Map(result.errors.map((item) => [item.index, item.error]));
      setItems(
        items.flatMap((item, index) =>
          failed.has(index) ? [{ ...item, uploadError: failed.get(index) }] : [],
        ),
      );
      setError(`${result.photos.length} uploaded. Fix the remaining ${result.errors.length} photo${result.errors.length === 1 ? "" : "s"} and try again.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <PhotoPicker items={items} onChange={setItems} allowDates allowFeatured disabled={uploading} />
      {error && <Alert variant="destructive"><AlertCircleIcon className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      {items.length > 0 && <Button type="button" size="sm" disabled={uploading} onClick={handleUpload}>{uploading ? "Uploading..." : `Upload ${items.length} photo${items.length === 1 ? "" : "s"}`}</Button>}
    </div>
  );
}
