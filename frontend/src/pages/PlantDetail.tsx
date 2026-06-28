import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPinIcon,
  CalendarIcon,
  AlertCircleIcon,
  PlusCircleIcon,
  DropletIcon,
  CameraIcon,
} from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageLayout } from "@/components/layout/page-layout";
import { SuccessAlert, ErrorAlert } from "@/components/feedback/status-alerts";
import { LoadingState } from "@/components/feedback/loading-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { PhotoUploader } from "@/components/photos/photo-uploader";
import { CareTimeline } from "@/components/plants/care-timeline";
import { getPlant } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import {
  getPlantPhotos,
  uploadPlantPhotos,
  deletePhoto,
  updatePhotoPosition,
} from "@/api/photos";
import { getCareLogsByPlant } from "@/api/careLogs";
import { useCareTypes } from "@/hooks/use-care-types";
import type { Plant, Species, PhotoWithSource, CareLog } from "@/types";
import { parseLocalDate, getSpeciesName } from "@/lib/utils";

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const plantId = parseInt(id || "0");

  const { careTypes } = useCareTypes();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [photos, setPhotos] = useState<PhotoWithSource[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const refreshPhotos = async () => {
    const res = await getPlantPhotos(plantId);
    setPhotos(res.photos ?? []);
  };

  const loadData = async () => {
    try {
      const [plantRes, speciesRes, photosRes, careLogsRes] = await Promise.all([
        getPlant(plantId),
        getAllSpecies(),
        getPlantPhotos(plantId),
        getCareLogsByPlant(plantId),
      ]);

      setPlant(plantRes.plant);
      setSpecies(speciesRes.species ?? []);
      setPhotos(photosRes.photos ?? []);
      setCareLogs(careLogsRes.care_logs ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load plant";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId]);

  const handleUpload = async (files: File[]) => {
    await uploadPlantPhotos(plantId, files);
    await refreshPhotos();
    setShowUploader(false);
    setSuccess("Photos uploaded successfully!");
    setTimeout(() => setSuccess(""), 5000);
  };

  const handleDeletePhoto = async (photoId: number) => {
    setActionLoading(true);
    setError("");
    try {
      await deletePhoto(photoId);
      await refreshPhotos();
      setPhotoToDelete(null);
      setSuccess("Photo deleted successfully!");
      setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Failed to delete photo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = async (photoId: number, direction: "up" | "down") => {
    // Get plant photos sorted by position
    const plantPhotos = photos
      .filter((p) => p.source.type === "plant")
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const idx = plantPhotos.findIndex((p) => p.id === photoId);
    if (idx === -1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= plantPhotos.length) return;

    const current = plantPhotos[idx];
    const swapWith = plantPhotos[swapIdx];

    setActionLoading(true);
    try {
      await updatePhotoPosition(current.id, swapWith.position ?? 0);
      await updatePhotoPosition(swapWith.id, current.position ?? 0);
      await refreshPhotos();
    } catch {
      setError("Failed to reorder photos");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="" maxWidth="4xl" hideHeader>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/plants")}
          className="mb-4"
        >
          Back to Plants
        </Button>
        <LoadingState message="Loading plant..." />
      </PageLayout>
    );
  }

  if (error || !plant) {
    return (
      <PageLayout title="" maxWidth="4xl" hideHeader>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/plants")}
          className="mb-4"
        >
          Back to Plants
        </Button>
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error || "Plant not found"}</AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Plant Details"
      subtitle="Information about this plant"
      subtitleClassName="text-sm text-muted-foreground mt-1"
      maxWidth="4xl"
      backLink={{ label: "Plants", onClick: () => navigate("/plants") }}
      headerActions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/log-care?plant=${plant.id}`)}
          >
            <DropletIcon className="h-4 w-4 mr-1.5" />
            Log Care
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/plants")}
          >
            <PlusCircleIcon className="h-4 w-4 mr-1.5" />
            Add Plant
          </Button>
        </>
      }
    >
      {/* Success/Error Messages */}
      <SuccessAlert message={success} withIcon={false} />
      <ErrorAlert message={error} />

      {/* Plant Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{plant.nickname}</CardTitle>
          <CardDescription>
            {getSpeciesName(species, plant.species_id)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              {plant.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{plant.location}</span>
                </div>
              )}
              {plant.date_added && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    Added {format(parseLocalDate(plant.date_added), "PP")}
                  </span>
                </div>
              )}
              {plant.last_watered && (
                <div className="flex items-center gap-2 text-sm">
                  <DropletIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    Last watered{" "}
                    {format(parseLocalDate(plant.last_watered), "PP")}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {photos.length} photo{photos.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Gallery Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CameraIcon className="h-5 w-5" />
              Photos
              <Badge variant="secondary">{photos.length}</Badge>
            </CardTitle>
            <Button
              variant={showUploader ? "ghost" : "outline"}
              size="sm"
              onClick={() => setShowUploader(!showUploader)}
            >
              {showUploader ? (
                "Cancel"
              ) : (
                <>
                  <CameraIcon className="h-4 w-4 mr-1.5" />
                  Add Photos
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showUploader && <PhotoUploader onUpload={handleUpload} />}
          <PhotoGallery
            photos={photos}
            onDelete={(photoId) => setPhotoToDelete(photoId)}
            onReorder={handleReorder}
          />
        </CardContent>
      </Card>

      {/* Care Timeline Section */}
      <CareTimeline
        careLogs={careLogs}
        careTypes={careTypes}
        photos={photos}
        onLogCare={() => navigate(`/log-care?plant=${plant.id}`)}
      />

      {/* Delete Photo Confirmation */}
      <ConfirmDialog
        open={photoToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPhotoToDelete(null);
        }}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? This action cannot be undone."
        confirmLabel="Delete Photo"
        loading={actionLoading}
        onConfirm={() => photoToDelete && handleDeletePhoto(photoToDelete)}
      />
    </PageLayout>
  );
}
