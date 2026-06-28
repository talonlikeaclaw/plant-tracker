import { format } from "date-fns";
import {
  PencilIcon,
  Trash2Icon,
  ClockIcon,
  HistoryIcon,
  MapPinIcon,
  CalendarIcon,
} from "lucide-react";
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
import { parseLocalDate } from "@/lib/utils";
import type { Plant, PlantWithCareData } from "@/types";

interface PlantCardProps {
  plant: PlantWithCareData;
  speciesName: string;
  onNavigatePlant: (plantId: number) => void;
  onEdit: (plant: Plant) => void;
  onDelete: (plant: Plant) => void;
  onLogCare: (plantId: number) => void;
  onAddPlan: (plantId: number) => void;
}

/**
 * A plant summary card for the grid on the "My Plants" page: cover photo,
 * title, urgency badge, location/date meta, recent + upcoming care dots, and
 * quick action buttons.
 */
export function PlantCard({
  plant,
  speciesName,
  onNavigatePlant,
  onEdit,
  onDelete,
  onLogCare,
  onAddPlan,
}: PlantCardProps) {
  return (
    <Card key={plant.id} className="overflow-hidden">
      <button
        type="button"
        onClick={() => onNavigatePlant(plant.id)}
        className="group block w-full"
      >
        <PlantThumbnail
          photoId={plant.cover_photo_id}
          thumb
          className="h-64 w-full object-cover transition-transform group-hover:scale-105"
          iconClassName="h-16 w-16 text-muted-foreground/50"
        />
      </button>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 truncate">
              <button
                type="button"
                onClick={() => onNavigatePlant(plant.id)}
                className="hover:underline text-left"
              >
                {plant.nickname}
              </button>
            </CardTitle>
            <CardDescription className="mb-2">{speciesName}</CardDescription>
            <div className="flex items-center gap-2 flex-wrap">
              {plant.urgencyStatus === "overdue" && (
                <Badge variant="destructive">Overdue</Badge>
              )}
              {plant.urgencyStatus === "due_today" && (
                <Badge variant="warning">Due Today</Badge>
              )}
              {plant.urgencyStatus === "due_soon" && (
                <Badge variant="success">Due Soon</Badge>
              )}
              {plant.urgencyStatus === "up_to_date" &&
                plant.recentCareHistory.length > 0 && (
                  <Badge variant="secondary">All Set</Badge>
                )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {/* Edit */}
            <Button variant="ghost" size="icon" onClick={() => onEdit(plant)}>
              <PencilIcon className="h-4 w-4" />
            </Button>
            {/* Delete */}
            <Button variant="ghost" size="icon" onClick={() => onDelete(plant)}>
              <Trash2Icon className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Location & Date Info */}
        {(plant.location || plant.date_added) && (
          <div className="rounded-lg bg-muted/20 p-3 space-y-2">
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
          </div>
        )}

        {/* Recent Care History */}
        {plant.recentCareHistory.length > 0 && (
          <div className="rounded-lg bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <HistoryIcon className="h-4 w-4 text-muted-foreground" />
              <span>Recent Care</span>
            </div>
            <div className="space-y-1.5">
              {plant.recentCareHistory.slice(0, 1).map((care, idx) => (
                <div key={idx} className="flex items-baseline gap-1.5 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-medium text-foreground">
                      {care.careTypeName}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      ·{" "}
                      {care.daysAgo === 0
                        ? "today"
                        : care.daysAgo === 1
                          ? "yesterday"
                          : `${care.daysAgo}d ago`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Care */}
        {plant.upcomingCare.length > 0 && (
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <ClockIcon className="h-4 w-4 text-primary" />
              <span>Upcoming Care</span>
            </div>
            <div className="space-y-1.5">
              {plant.upcomingCare.slice(0, 1).map((care, idx) => {
                const isPending = care.days_until_due > 7;
                return (
                  <div
                    key={idx}
                    className="flex items-baseline gap-1.5 text-sm"
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${
                        care.days_until_due < 0
                          ? "bg-destructive"
                          : care.days_until_due === 0
                            ? "bg-yellow-500"
                            : isPending
                              ? "bg-muted-foreground/40"
                              : "bg-green-500"
                      }`}
                    />
                    <div>
                      <span className="font-medium text-foreground">
                        {care.care_type}
                      </span>
                      <span
                        className={`${
                          care.days_until_due < 0
                            ? "text-destructive"
                            : care.days_until_due === 0
                              ? "text-yellow-600 dark:text-yellow-500"
                              : isPending
                                ? "text-muted-foreground/70"
                                : "text-muted-foreground"
                        }`}
                      >
                        {" "}
                        ·{" "}
                        {care.days_until_due < 0
                          ? `${Math.abs(care.days_until_due)}d overdue`
                          : care.days_until_due === 0
                            ? "due today"
                            : `in ${care.days_until_due}d`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No care data message */}
        {plant.recentCareHistory.length === 0 &&
          plant.upcomingCare.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No care logs or plans yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Add a care plan to get started
              </p>
            </div>
          )}

        {/* Quick Actions */}
        <div className="pt-3 border-t flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onLogCare(plant.id)}
          >
            Log Care
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onAddPlan(plant.id)}
          >
            Add Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
