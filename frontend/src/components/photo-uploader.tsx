import { useEffect, useRef, useState } from "react";
import { UploadCloudIcon, XIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  /** Called with validated files when user clicks Upload */
  onUpload: (files: File[]) => Promise<void>;
  /** Max individual file size in MB */
  maxSizeMB?: number;
  className?: string;
}

interface SelectedFile {
  file: File;
  preview: string;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

function isAllowedType(file: File): boolean {
  if (file.type && ALLOWED_TYPES.includes(file.type)) return true;
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? ALLOWED_EXTENSIONS.includes(ext) : false;
}

export function PhotoUploader({
  onUpload,
  maxSizeMB = 10,
  className,
}: PhotoUploaderProps) {
  const [items, setItems] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<SelectedFile[]>([]);
  itemsRef.current = items;

  // Revoke any remaining object URLs on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError("");

    const newItems: SelectedFile[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (!isAllowedType(file)) {
        errors.push(`${file.name}: unsupported format`);
        return;
      }
      if (file.size > maxBytes) {
        errors.push(`${file.name}: exceeds ${maxSizeMB}MB limit`);
        return;
      }
      newItems.push({
        file,
        preview: URL.createObjectURL(file),
      });
    });

    if (errors.length > 0) {
      setError(errors.join("; "));
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const removeFile = (index: number) => {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (items.length === 0) return;
    setUploading(true);
    setError("");
    try {
      await onUpload(items.map((item) => item.file));
      // Success - revoke previews and clear
      items.forEach((item) => URL.revokeObjectURL(item.preview));
      setItems([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to upload photos";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40",
        )}
      >
        <UploadCloudIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">
          Drag photos here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WebP, HEIC · max {maxSizeMB}MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.concat(ALLOWED_EXTENSIONS).join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
          }}
        />
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview grid */}
      {items.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {items.map((item, idx) => (
              <div
                key={item.preview}
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="h-full w-full object-cover"
                />
                <span
                  role="button"
                  tabIndex={0}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive/90 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFile(idx);
                    }
                  }}
                >
                  <XIcon className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>

          {/* Upload action */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpload}
              disabled={uploading || items.length === 0}
              size="sm"
            >
              {uploading
                ? "Uploading..."
                : `Upload ${items.length} photo${items.length > 1 ? "s" : ""}`}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => {
                items.forEach((item) => URL.revokeObjectURL(item.preview));
                setItems([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Clear
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
