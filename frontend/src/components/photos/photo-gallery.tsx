import { useState } from "react";
import { Trash2Icon, ImageIcon, StarIcon } from "lucide-react";
import { format } from "date-fns";
import { AuthImage } from "@/components/photos/auth-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, parseLocalDate } from "@/lib/utils";
import type { PhotoWithSource, PhotoSource } from "@/types";

interface PhotoGalleryProps {
  photos: PhotoWithSource[];
  /** If provided, a delete button appears in the photo viewer */
  onDelete?: (photoId: number) => void;
  /** If provided, plant photos can be selected as the cover photo */
  onSetCover?: (photoId: number) => void;
  /** If provided, photo dates can be corrected in the photo viewer */
  onUpdateTakenAt?: (photoId: number, takenAt: string) => void;
  className?: string;
}

/** Returns a human-readable label for a photo's source */
function getSourceLabel(source: PhotoSource): string {
  if (source.type === "plant") return "Plant photo";
  const parts: string[] = [];
  if (source.care_type) parts.push(source.care_type);
  if (source.care_date)
    parts.push(format(parseLocalDate(source.care_date), "PP"));
  return parts.length > 0 ? parts.join(" · ") : "Care log";
}

export function PhotoGallery({
  photos,
  onDelete,
  onSetCover,
  onUpdateTakenAt,
  className,
}: PhotoGalleryProps) {
  const [selected, setSelected] = useState<PhotoWithSource | null>(null);
  const [takenAt, setTakenAt] = useState("");

  const selectPhoto = (photo: PhotoWithSource) => {
    setSelected(photo);
    setTakenAt(photo.taken_at?.slice(0, 10) ?? "");
  };

  if (photos.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center",
          className,
        )}
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4",
          className,
        )}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <button
              type="button"
              onClick={() => selectPhoto(photo)}
              className="absolute inset-0"
              aria-label={`View ${photo.original_filename || "photo"}`}
            >
              <AuthImage
                photoId={photo.id}
                thumb
                className="h-full w-full object-cover"
              />
            </button>
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            <Badge
              variant="secondary"
              className="pointer-events-none absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate text-xs"
            >
              {getSourceLabel(photo.source)}
            </Badge>
            {photo.source.type === "plant" && photo.position === 0 && (
              <Badge variant="success" className="pointer-events-none absolute bottom-1 left-1 text-xs">
                <StarIcon className="mr-1 h-3 w-3 fill-current" />
                Cover
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Photo viewer</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <AuthImage
                photoId={selected.id}
                className="max-h-[60dvh] w-full rounded-lg object-contain"
                alt={selected.original_filename || "Plant photo"}
              />
              <div className="space-y-3">
                <div className="min-w-0 space-y-1">
                  <Badge variant="secondary" className="text-xs">
                    {getSourceLabel(selected.source)}
                  </Badge>
                  {selected.taken_at && (
                    <p className="text-xs text-muted-foreground">
                      Taken {format(new Date(selected.taken_at), "PPP")}
                    </p>
                  )}
                  {selected.original_filename && (
                    <p className="truncate text-sm text-muted-foreground">
                      {selected.original_filename}
                    </p>
                  )}
                </div>
                {onUpdateTakenAt && (
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="selected-photo-date">Photo date</Label>
                      <Input
                        id="selected-photo-date"
                        type="date"
                        value={takenAt}
                        onChange={(event) => setTakenAt(event.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!takenAt || takenAt === selected.taken_at?.slice(0, 10)}
                      onClick={() => {
                        onUpdateTakenAt(selected.id, takenAt);
                        setSelected(null);
                      }}
                    >
                      Save date
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {onSetCover &&
                    selected.source.type === "plant" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={selected.position === 0}
                        onClick={() => {
                          onSetCover(selected.id);
                          setSelected(null);
                        }}
                      >
                        <StarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {selected.position === 0 ? "Cover photo" : "Set as cover"}
                      </Button>
                    )}
                  {onDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        onDelete(selected.id);
                        setSelected(null);
                      }}
                    >
                      <Trash2Icon className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
