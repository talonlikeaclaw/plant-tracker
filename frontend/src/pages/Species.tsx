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
import SpeciesForm from "@/components/SpeciesForm";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Plant Species
              </h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Browse and add plant species to the community database
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="shrink-0 w-full sm:w-auto"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
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
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    Loading species...
                  </p>
                </CardContent>
              </Card>
            ) : species.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    No species yet. Be the first to add one!
                  </p>
                </CardContent>
              </Card>
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
        </div>
      </main>
    </div>
  );
}
