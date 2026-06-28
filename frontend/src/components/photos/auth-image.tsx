import { useEffect, useState } from "react";
import { ImageOffIcon } from "lucide-react";
import { fetchPhotoFile } from "@/api/photos";
import { cn } from "@/lib/utils";

interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** ID of the photo to render */
  photoId: number;
  /** Fetch the 400px thumbnail variant instead of the full-size original */
  thumb?: boolean;
}

/**
 * Renders an <img> whose source is a JWT-protected photo served by the
 * /api/photos/<id>/file endpoint.
 *
 */
export function AuthImage({
  photoId,
  thumb = false,
  className,
  alt = "",
  ...imgProps
}: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(false);

    fetchPhotoFile(photoId, thumb)
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [photoId, thumb]);

  if (loading) {
    return (
      <div
        className={cn("animate-pulse bg-muted", className)}
        role="img"
        aria-label="Loading image..."
      />
    );
  }

  if (error || !objectUrl) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted", className)}
        role="img"
        aria-label="Image failed to load"
      >
        <ImageOffIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return <img src={objectUrl} className={className} alt={alt} {...imgProps} />;
}
