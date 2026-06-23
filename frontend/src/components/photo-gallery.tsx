import { useState } from "react";
import { Trash2Icon, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { AuthImage } from "@/components/auth-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  /** If provided, a delete button appears on each photo (hover + lightbox) */
  onDelete?: (photoId: number) => void;
  className?: string;
}

/** Returns a human-readable label for a photo's source */
function getSourceLabel(source: PhotoSource): string {
  if (source.type === "plant") return "Plant photo";
  const parts: string[] = [];
  if (source.care_type) parts.push(source.care_type);
  if (source.care_date) parts.push(format(parseLocalDate(source.care_date), "PP"));
  return parts.length > 0 ? parts.join(" · ") : "Care log";
}

export function PhotoGallery({
  photos,
  onDelete,
  className,
}: PhotoGalleryProps) {
  const [selected, setSelected] = useState<PhotoWithSource | null>(null);

  if (photos.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center",
          className
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
          className
        )}
      >
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelected(photo)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <AuthImage
              photoId={photo.id}
              thumb
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            {/* Source badge */}
            <Badge
              variant="secondary"
              className="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate text-xs"
            >
              {getSourceLabel(photo.source)}
            </Badge>
            {/* Delete button */}
            {onDelete && (
              <span
                role="button"
                tabIndex={0}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive/90 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(photo.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onDelete(photo.id);
                  }
                }}
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Photo viewer</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <AuthImage
                photoId={selected.id}
                className="w-full rounded-lg"
                alt={selected.original_filename || "Plant photo"}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <Badge variant="secondary" className="text-xs">
                    {getSourceLabel(selected.source)}
                  </Badge>
                  {selected.original_filename && (
                    <p className="truncate text-sm text-muted-foreground">
                      {selected.original_filename}
                    </p>
                  )}
                </div>
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
