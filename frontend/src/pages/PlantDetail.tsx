import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  AlertCircleIcon,
  PlusCircleIcon,
  DropletIcon,
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
import { getPlant } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import { getPlantPhotos } from "@/api/photos";
import type { Plant, Species, PhotoWithSource } from "@/types";
import { parseLocalDate } from "@/lib/utils";

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const plantId = parseInt(id || "0");

  const [plant, setPlant] = useState<Plant | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [photos, setPhotos] = useState<PhotoWithSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [plantRes, speciesRes, photosRes] = await Promise.all([
        getPlant(plantId),
        getAllSpecies(),
        getPlantPhotos(plantId),
      ]);

      setPlant(plantRes.plant);
      setSpecies(speciesRes.species ?? []);
      setPhotos(photosRes.photos ?? []);
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
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center text-sm text-muted-foreground">
            Photo gallery section
          </div>

          {/* Care Timeline Section */}
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center text-sm text-muted-foreground">
            Care timeline section
          </div>
        </div>
      </main>
    </div>
  );
}
