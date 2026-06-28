import { LeafIcon } from "lucide-react";
import { AuthImage } from "@/components/photos/auth-image";
import { cn } from "@/lib/utils";

interface PlantThumbnailProps {
  photoId?: number | null;
  thumb?: boolean;
  /** Sizing/shape classes applied to both the image and the fallback block. */
  className?: string;
  /** Classes for the fallback leaf icon (size/opacity). */
  iconClassName?: string;
  alt?: string;
}

/**
 * Renders a plant's cover photo via AuthImage, or a leaf-icon fallback block
 * when there is no photo. The caller controls sizing through `className`.
 */
export function PlantThumbnail({
  photoId,
  thumb,
  className,
  iconClassName = "h-8 w-8 text-muted-foreground",
  alt = "",
}: PlantThumbnailProps) {
  if (photoId) {
    return (
      <AuthImage
        photoId={photoId}
        thumb={thumb}
        className={className}
        alt={alt}
      />
    );
  }
  return (
    <div className={cn("bg-muted flex items-center justify-center", className)}>
      <LeafIcon className={iconClassName} />
    </div>
  );
}
