import { format } from "date-fns";
import { DropletIcon, HistoryIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthImage } from "@/components/photos/auth-image";
import { parseLocalDate } from "@/lib/utils";
import type { CareLog, CareType, PhotoWithSource } from "@/types";

interface CareTimelineProps {
  careLogs: CareLog[];
  careTypes: CareType[];
  photos: PhotoWithSource[];
  onLogCare: () => void;
}

/**
 * Vertical timeline of a plant's care logs, shown on the plant detail page.
 * Each entry shows the care type, date, optional note, and any attached photos.
 */
export function CareTimeline({
  careLogs,
  careTypes,
  photos,
  onLogCare,
}: CareTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Care History
            <Badge variant="secondary">{careLogs.length}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onLogCare}>
            <DropletIcon className="h-4 w-4 mr-1.5" />
            Log Care
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {careLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No care logs yet. Click &quot;Log Care&quot; to add one.
          </p>
        ) : (
          <div className="border-l-2 border-muted space-y-4 ml-1">
            {[...careLogs]
              .sort(
                (a, b) =>
                  new Date(b.care_date).getTime() -
                  new Date(a.care_date).getTime(),
              )
              .map((log) => {
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
  );
}
