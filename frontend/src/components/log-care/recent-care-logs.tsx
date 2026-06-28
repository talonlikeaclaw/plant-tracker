import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { parseLocalDate, getPlantName, getCareTypeName } from "@/lib/utils";
import type { CareLog, Plant, CareType } from "@/types";

interface RecentCareLogsProps {
  logs: CareLog[];
  plants: Plant[];
  careTypes: CareType[];
}

/**
 * The "Recent Care Logs" list shown beneath the Log Care forms.
 */
export function RecentCareLogs({
  logs,
  plants,
  careTypes,
}: RecentCareLogsProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Recent Care Logs ({logs.length})
      </h2>
      {logs.length === 0 ? (
        <EmptyState message="No care logs yet. Start logging care activities above!" />
      ) : (
        <div className="space-y-3">
          {logs.slice(0, 10).map((log, index) => (
            <Card
              key={log.id || `log-${log.plant_id}-${log.care_type_id}-${index}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {getPlantName(plants, log.plant_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getCareTypeName(careTypes, log.care_type_id)}
                      {log.care_date &&
                        ` • ${format(parseLocalDate(log.care_date), "PPP")}`}
                    </p>
                    {log.note && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        {log.note}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
