import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  PlusCircleIcon,
  CameraIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageLayout } from "@/components/layout/page-layout";
import { SuccessAlert, ErrorAlert } from "@/components/feedback/status-alerts";
import { SpeciesSelect } from "@/components/forms/species-select";
import { createPlant } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import { uploadPlantPhotos } from "@/api/photos";
import SpeciesForm from "@/components/species/species-form";
import type { Species } from "@/types";
import { cn, getErrorMessage } from "@/lib/utils";

export default function AddPlant() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nickname: "",
    species_id: "",
    location: "",
    date_added: "",
    last_watered: "",
  });

  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Photo upload state
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; preview: string }[]
  >([]);
  const filesRef = useRef(selectedFiles);
  filesRef.current = selectedFiles;

  const loadSpecies = async () => {
    try {
      const data = await getAllSpecies();
      setSpecies(data.species ?? []);
    } catch (err) {
      console.error("Failed to load species:", err);
      setError("Failed to load species list");
    }
  };

  useEffect(() => {
    loadSpecies();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () =>
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
  }, []);

  const handleSpeciesAdded = (newSpecies: Species) => {
    setDialogOpen(false);
    loadSpecies();
    // Auto-select the newly added species
    if (newSpecies?.id) {
      setForm({ ...form, species_id: newSpecies.id.toString() });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Photo upload handlers
  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    const newItems: { file: File; preview: string }[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: unsupported format`);
        return;
      }
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: exceeds 10MB limit`);
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
      setSelectedFiles((prev) => [...prev, ...newItems]);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.nickname) {
      setError("Plant nickname is required");
      return;
    }

    setLoading(true);
    let createdPlantId: number | null = null;

    try {
      // Phase 1: Create plant
      const plantData: {
        nickname: string;
        species_id?: number;
        location?: string;
        date_added?: string;
        last_watered?: string;
      } = {
        nickname: form.nickname,
      };

      // Only include optional fields if they have values
      if (form.species_id) plantData.species_id = parseInt(form.species_id);
      if (form.location) plantData.location = form.location;
      if (form.date_added) plantData.date_added = form.date_added;
      if (form.last_watered) plantData.last_watered = form.last_watered;

      const plantRes = await createPlant(plantData);
      createdPlantId = plantRes.plant.id;

      // Phase 2: Upload photos if any selected
      if (selectedFiles.length > 0) {
        try {
          await uploadPlantPhotos(
            createdPlantId!,
            selectedFiles.map((f) => f.file),
          );
          const photoMsg =
            selectedFiles.length === 1
              ? "1 photo"
              : `${selectedFiles.length} photos`;
          setSuccess(`Plant added successfully with ${photoMsg}!`);

          // Cleanup previews
          selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
          setSelectedFiles([]);
        } catch (photoErr) {
          // Plant created but photos failed - redirect to detail page
          console.error("Photo upload failed:", photoErr);
          setError(
            `Plant added but photo upload failed. You can add photos on the plant detail page.`,
          );

          // Redirect after delay
          setTimeout(() => {
            navigate(`/plants/${createdPlantId!}`);
          }, 3000);
          return;
        }
      } else {
        setSuccess("Plant added successfully!");
      }

      // Reset form
      setForm({
        nickname: "",
        species_id: "",
        location: "",
        date_added: "",
        last_watered: "",
      });

      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to add plant. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Add New Plant"
      subtitle="Add a new plant to your collection"
      maxWidth="2xl"
      contentClassName=""
      headerActions={
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="shrink-0 w-full sm:w-auto"
        >
          Back to Dashboard
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Plant Information</CardTitle>
          <CardDescription>
            Fill in the details about your new plant. Only the nickname is
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">
                Nickname <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="e.g., My Favorite Monstera"
                value={form.nickname}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label htmlFor="species_id">Species (Optional)</Label>
              <SpeciesSelect
                value={form.species_id}
                onValueChange={(value) =>
                  setForm({ ...form, species_id: value })
                }
                species={species}
                disabled={loading}
                showScientificName
              />
              <div className="flex items-center gap-2 pt-1">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-sm"
                    >
                      <PlusCircleIcon className="h-3 w-3 mr-1" />
                      Quick add species
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Species</DialogTitle>
                      <DialogDescription>
                        Add a new species to the community database
                      </DialogDescription>
                    </DialogHeader>
                    <SpeciesForm
                      onSuccess={handleSpeciesAdded}
                      onCancel={() => setDialogOpen(false)}
                      compact
                    />
                  </DialogContent>
                </Dialog>
                <span className="text-sm text-muted-foreground">or</span>
                <Link
                  to="/species"
                  target="_blank"
                  className="text-sm text-primary hover:underline"
                >
                  Browse all species
                </Link>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                type="text"
                placeholder="e.g., Living room window"
                value={form.location}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Date Added */}
            <div className="space-y-2">
              <Label htmlFor="date_added">Date Added (Optional)</Label>
              <Input
                id="date_added"
                name="date_added"
                type="date"
                value={form.date_added}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Last Watered */}
            <div className="space-y-2">
              <Label htmlFor="last_watered">Last Watered (Optional)</Label>
              <Input
                id="last_watered"
                name="last_watered"
                type="date"
                value={form.last_watered}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CameraIcon className="h-5 w-5 text-muted-foreground" />
                <Label>Plant Photos (Optional)</Label>
              </div>

              {/* Dropzone */}
              <div
                onClick={() =>
                  !loading && document.getElementById("photo-input")?.click()
                }
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                  loading
                    ? "pointer-events-none opacity-50"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40",
                )}
              >
                <UploadCloudIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">
                  Drag photos here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG, WebP, HEIC · max 10MB each
                </p>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  className="hidden"
                  disabled={loading}
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {/* Preview Grid */}
              {selectedFiles.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {selectedFiles.map((item, idx) => (
                      <div
                        key={item.preview}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                      >
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          disabled={loading}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive/90 group-hover:opacity-100 focus:opacity-100 focus:outline-none disabled:opacity-50"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFiles}
                    disabled={loading}
                  >
                    Clear all photos
                  </Button>
                </>
              )}
            </div>

            {/* Success / Error Messages */}
            {success && <SuccessAlert message={success} withIcon />}
            {error && <ErrorAlert message={error} />}

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Adding Plant..." : "Add Plant"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
