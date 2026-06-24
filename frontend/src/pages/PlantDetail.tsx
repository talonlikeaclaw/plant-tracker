import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  AlertCircleIcon,
  PlusCircleIcon,
  DropletIcon,
  CameraIcon,
  HistoryIcon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoGallery } from "@/components/photo-gallery";
import { PhotoUploader } from "@/components/photo-uploader";
import { AuthImage } from "@/components/auth-image";
import { getPlant } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import { getPlantPhotos, uploadPlantPhotos, deletePhoto } from "@/api/photos";
import { getCareLogsByPlant } from "@/api/careLogs";
import { getDefaultCareTypes, getUserCareTypes } from "@/api/careTypes";
import type {
  Plant,
  Species,
  PhotoWithSource,
  CareLog,
  CareType,
} from "@/types";
import { parseLocalDate } from "@/lib/utils";

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const plantId = parseInt(id || "0");

  const [plant, setPlant] = useState<Plant | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [photos, setPhotos] = useState<PhotoWithSource[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [careTypes, setCareTypes] = useState<CareType[]>([]);
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
      const [
        plantRes,
        speciesRes,
        photosRes,
        careLogsRes,
        defaultTypesRes,
        userTypesRes,
      ] = await Promise.all([
        getPlant(plantId),
        getAllSpecies(),
        getPlantPhotos(plantId),
        getCareLogsByPlant(plantId),
        getDefaultCareTypes(),
        getUserCareTypes().catch(() => ({ care_types: [] })),
      ]);

      setPlant(plantRes.plant);
      setSpecies(speciesRes.species ?? []);
      setPhotos(photosRes.photos ?? []);
      setCareLogs(careLogsRes.care_logs ?? []);
      setCareTypes([
        ...(defaultTypesRes.care_types ?? []),
        ...(userTypesRes.care_types ?? []),
      ]);
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

  const getSpeciesName = (speciesId: number | undefined) => {
    if (!speciesId) return "No species";
    const s = species.find((sp) => sp.id === speciesId);
    return s?.common_name || "Unknown species";
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/plants")}
              className="mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
              Back to Plants
            </Button>
            <Card>
              <CardContent>
                <p className="text-muted-foreground py-8 text-center">
                  Loading plant...
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/plants")}
              className="mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
              Back to Plants
            </Button>
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error || "Plant not found"}</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/plants")}
                className="mb-1 p-0 h-auto"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Plants
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {plant.nickname}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {getSpeciesName(plant.species_id)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Plant Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plant Details</CardTitle>
              <CardDescription>Information about this plant</CardDescription>
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
              />
            </CardContent>
          </Card>

          {/* Care Timeline Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5" />
                  Care History
                  <Badge variant="secondary">{careLogs.length}</Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/log-care?plant=${plant.id}`)}
                >
                  <DropletIcon className="h-4 w-4 mr-1.5" />
                  Log Care
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {careLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No care logs yet. Click "Log Care" to add one.
                </p>
              ) : (
                <div className="border-l-2 border-muted space-y-4 ml-1">
                  {careLogs.map((log) => {
                    const careType = careTypes.find(
                      (ct) => ct.id === log.care_type_id,
                    );
                    const logPhotos = photos.filter(
                      (p) => p.source.care_log_id === log.id,
                    );
                    return (
                      <div key={log.id} className="relative pl-4">
                        <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-medium text-foreground text-sm">
                            {careType?.name || "Unknown"}
                          </span>
                          {log.care_date && (
                            <span className="text-xs text-muted-foreground">
                              {format(parseLocalDate(log.care_date), "PP")}
                            </span>
                          )}
                        </div>
                        {log.note && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.note}
                          </p>
                        )}
                        {logPhotos.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {logPhotos.map((photo) => (
                              <AuthImage
                                key={photo.id}
                                photoId={photo.id}
                                thumb
                                className="h-12 w-12 rounded object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Photo Confirmation */}
      <Dialog
        open={photoToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPhotoToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setPhotoToDelete(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => photoToDelete && handleDeletePhoto(photoToDelete)}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete Photo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
