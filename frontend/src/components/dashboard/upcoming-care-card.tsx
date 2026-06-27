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
import { PlantThumbnail } from "@/components/plants/plant-thumbnail";
import { cn, getUrgencyInfo, parseLocalDate } from "@/lib/utils";
import type { UpcomingCareLog } from "@/types";

interface UpcomingCareCardProps {
  log: UpcomingCareLog;
  onNavigatePlant: (plantId: number) => void;
  onMarkDone: (log: UpcomingCareLog) => void;
}

/**
 * Upcoming-care task card for dashboard: thumbnail, urgency badge,
 * plant name, due date, and a "Mark Done" button.
 */
export function UpcomingCareCard({
  log,
  onNavigatePlant,
  onMarkDone,
}: UpcomingCareCardProps) {
  const urgency = getUrgencyInfo(log.days_until_due);

  return (
    <Card
      className={cn(
        "transition-all",
        log.days_until_due < 0 && "border-destructive/50 bg-destructive/5",
        log.days_until_due === 0 && "border-yellow-600/50 bg-yellow-500/5",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          {/* Thumbnail on the left */}
          <button
            type="button"
            onClick={() => onNavigatePlant(log.plant_id)}
            className="shrink-0"
            aria-label={`View ${log.plant_nickname}`}
          >
            <PlantThumbnail
              photoId={log.cover_photo_id}
              thumb
              className="h-20 w-20 rounded-lg object-cover hover:opacity-80 transition-opacity"
            />
          </button>

          {/* Plant info and urgency badge on the right */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              {/* Urgency badge */}
              <Badge variant={urgency.variant}>{urgency.label}</Badge>
            </div>

            {/* Clickable plant name */}
            <button
              type="button"
              onClick={() => onNavigatePlant(log.plant_id)}
              className="text-left w-full"
            >
              <CardTitle className="text-lg hover:text-primary transition-colors">
                {log.plant_nickname}
              </CardTitle>
            </button>
            <CardDescription>
              {log.care_type} &middot; Due{" "}
              {isNaN(new Date(log.due_date).getTime())
                ? "Invalid date"
                : format(parseLocalDate(log.due_date), "PPP")}
            </CardDescription>
          </div>

          {/* Mark Done button */}
          <Button
            size="sm"
            onClick={() => onMarkDone(log)}
            variant={
              log.days_until_due < 0
                ? "destructive"
                : log.days_until_due === 0
                  ? "warning"
                  : "default"
            }
          >
            Mark Done
          </Button>
        </div>
      </CardHeader>
      {log.note && (
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Note: {log.note}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
