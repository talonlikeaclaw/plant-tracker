import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllSpecies } from "@/api/species";
import SpeciesForm from "@/components/species/species-form";
import { PageLayout } from "@/components/layout/page-layout";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Species as SpeciesType } from "@/types";

export default function Species() {
  const navigate = useNavigate();
  const [species, setSpecies] = useState<SpeciesType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadSpecies = async () => {
    try {
      const data = await getAllSpecies();
      setSpecies(data.species ?? []);
    } catch (err) {
      console.error("Failed to load species:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSpecies();
  }, []);

  const handleSpeciesAdded = () => {
    setShowForm(false);
    loadSpecies();
  };

  return (
    <PageLayout
      title="Plant Species"
      subtitle="Browse and add plant species to the community database"
      maxWidth="4xl"
      contentClassName="space-y-8"
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
      {/* Add Species Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">Add New Species</CardTitle>
              <CardDescription className="hidden sm:block">
                Contribute to the community database
              </CardDescription>
            </div>
            <Button
              variant={showForm ? "outline" : "default"}
              onClick={() => setShowForm(!showForm)}
              className="shrink-0 w-full sm:w-auto"
            >
              {showForm ? "Hide Form" : "Add Species"}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent>
            <SpeciesForm
              onSuccess={handleSpeciesAdded}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        )}
      </Card>

      {/* Species List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          All Species ({species.length})
        </h2>
        {isLoading ? (
          <LoadingState message="Loading species..." />
        ) : species.length === 0 ? (
          <EmptyState message="No species yet. Be the first to add one!" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {species.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{s.common_name}</CardTitle>
                  {s.scientific_name && (
                    <CardDescription className="italic">
                      {s.scientific_name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {s.sunlight && (
                    <div className="text-sm">
                      <span className="font-medium">Sunlight:</span>{" "}
                      {s.sunlight}
                    </div>
                  )}
                  {s.water_requirements && (
                    <div className="text-sm">
                      <span className="font-medium">Water:</span>{" "}
                      {s.water_requirements}
                    </div>
                  )}
                  {!s.sunlight && !s.water_requirements && (
                    <p className="text-sm text-muted-foreground">
                      No additional details available
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
