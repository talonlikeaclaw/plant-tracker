import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Species } from "@/types";

interface SpeciesInfoCardProps {
  species: Species;
  plantLocation?: string;
  onAutoSuggest?: () => void;
}

/**
 * Info card for the species of a selected plant, shown on the add-care-plan
 * form. Optionally offers an "Auto-suggest watering" action.
 */
export function SpeciesInfoCard({
  species,
  plantLocation,
  onAutoSuggest,
}: SpeciesInfoCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{species.common_name}</CardTitle>
            {species.scientific_name && (
              <CardDescription className="text-sm italic">
                {species.scientific_name}
              </CardDescription>
            )}
          </div>
          {species.water_requirements && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAutoSuggest}
            >
              Auto-suggest watering
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {species.water_requirements && (
          <div className="text-sm">
            <span className="font-medium">Water:</span>{" "}
            {species.water_requirements}
          </div>
        )}
        {species.sunlight && (
          <div className="text-sm">
            <span className="font-medium">Sunlight:</span> {species.sunlight}
          </div>
        )}
        {plantLocation && (
          <div className="text-sm">
            <span className="font-medium">Current location:</span>{" "}
            {plantLocation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
