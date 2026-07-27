import { useEffect, useRef, useState } from "react";
import { AlertCircleIcon, FileImageIcon, StarIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchPhotoPreview } from "@/api/photos";

export interface SelectedPhoto {
  id: string;
  file: File;
  preview?: string;
  previewError?: boolean;
  takenAt: string;
  isFeatured: boolean;
  uploadError?: string;
}

interface PhotoPickerProps {
  items: SelectedPhoto[];
  onChange: (items: SelectedPhoto[]) => void;
  allowDates?: boolean;
  allowFeatured?: boolean;
  defaultFirstFeatured?: boolean;
  disabled?: boolean;
  maxSizeMB?: number;
  className?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

function isAllowedType(file: File): boolean {
  if (file.type && ALLOWED_TYPES.includes(file.type)) return true;
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false;
}

function isHeic(file: File): boolean {
  return file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/i.test(file.name);
}

export function PhotoPicker({
  items,
  onChange,
  allowDates = false,
  allowFeatured = false,
  defaultFirstFeatured = false,
  disabled = false,
  maxSizeMB = 10,
  className,
}: PhotoPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [batchDate, setBatchDate] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const maxBytes = maxSizeMB * 1024 * 1024;

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const activeUrls = new Set(items.flatMap((item) => item.preview ? [item.preview] : []));
    objectUrls.current.forEach((url) => {
      if (!activeUrls.has(url)) {
        URL.revokeObjectURL(url);
        objectUrls.current.delete(url);
      }
    });
  }, [items]);

  const revoke = (preview?: string) => {
    if (preview) {
      URL.revokeObjectURL(preview);
      objectUrls.current.delete(preview);
    }
  };

  const makePreview = async (file: File) => {
    try {
      const preview = URL.createObjectURL(isHeic(file) ? await fetchPhotoPreview(file) : file);
      objectUrls.current.add(preview);
      return { preview, previewError: false };
    } catch {
      return { preview: undefined, previewError: true };
    }
  };

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    setError("");
    const validFiles = Array.from(fileList).filter((file) => {
      if (!isAllowedType(file)) {
        setError((current) => `${current}${current ? "; " : ""}${file.name}: unsupported format`);
        return false;
      }
      if (file.size > maxBytes) {
        setError((current) => `${current}${current ? "; " : ""}${file.name}: exceeds ${maxSizeMB}MB limit`);
        return false;
      }
      return true;
    });
    const previews = await Promise.all(validFiles.map(makePreview));
    onChange([
      ...items,
      ...validFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
        file,
        ...previews[index],
        takenAt: "",
        isFeatured: defaultFirstFeatured && items.length === 0 && index === 0,
      })),
    ]);
  };

  const update = (id: string, changes: Partial<SelectedPhoto>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  const remove = (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    revoke(item?.preview);
    onChange(items.filter((candidate) => candidate.id !== id));
  };

  const clear = () => {
    items.forEach((item) => revoke(item.preview));
    onChange([]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          disabled && "pointer-events-none opacity-50",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-muted-foreground/40",
        )}
      >
        <UploadCloudIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Drag photos here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, HEIC · max {maxSizeMB}MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.concat(ALLOWED_EXTENSIONS).join(",")}
          multiple
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error && <Alert variant="destructive"><AlertCircleIcon className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {items.length > 0 && (
        <>
          {allowDates && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="photo-batch-date">Date for all photos</Label>
                <Input id="photo-batch-date" type="date" value={batchDate} disabled={disabled} onChange={(event) => setBatchDate(event.target.value)} />
              </div>
              <Button type="button" variant="outline" size="sm" className="h-9" disabled={disabled || !batchDate} onClick={() => onChange(items.map((item) => ({ ...item, takenAt: batchDate, uploadError: undefined })))}>
                Apply to all
              </Button>
              <p className="max-w-md text-sm text-muted-foreground">
                Leave blank to use camera metadata.<br />
                Files without a date stay here for correction.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {item.preview ? (
                    <img src={item.preview} alt={item.file.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted-foreground">
                      <FileImageIcon className="h-7 w-7" />
                      <span>HEIC will be converted after upload</span>
                    </div>
                  )}
                  {allowFeatured && (
                    <Button
                      type="button"
                      variant={item.isFeatured ? "default" : "secondary"}
                      size="icon"
                      className="absolute bottom-1 left-1 h-7 w-7"
                      aria-label={item.isFeatured ? `${item.file.name} is the cover photo` : `Set ${item.file.name} as cover photo`}
                      onClick={() => onChange(items.map((candidate) => ({ ...candidate, isFeatured: candidate.id === item.id && !item.isFeatured })))}
                    >
                      <StarIcon className={cn("h-3.5 w-3.5", item.isFeatured && "fill-current")} />
                    </Button>
                  )}
                  <Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 h-7 w-7" aria-label={`Remove ${item.file.name}`} onClick={() => remove(item.id)}>
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="truncate text-xs text-muted-foreground" title={item.file.name}>{item.file.name}</p>
                  {item.isFeatured && <span className="sr-only">Selected as cover photo</span>}
                {allowDates && <><Label htmlFor={`photo-date-${item.id}`} className="sr-only">Date for {item.file.name}</Label><Input id={`photo-date-${item.id}`} type="date" value={item.takenAt} disabled={disabled} onChange={(event) => update(item.id, { takenAt: event.target.value, uploadError: undefined })} /></>}
                {item.uploadError && <p className="text-xs text-destructive">{item.uploadError}</p>}
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={clear}>Clear photos</Button>
        </>
      )}
    </div>
  );
}
