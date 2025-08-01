import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { getUserPlants, getUpcomingCareLogs } from "@/api/dashboard";
import type { Plant, UpcomingCareLog } from "@/types";

export default function Dashboard() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [upcomingLogs, setUpcomingLogs] = useState<UpcomingCareLog[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [plantsRes, upcomingRes] = await Promise.all([
          getUserPlants(),
          getUpcomingCareLogs(),
        ]);

        console.log("plantsRes:", plantsRes);
        console.log("upcomingRes:", upcomingRes);

        setPlants(plantsRes ?? []);
        setUpcomingLogs(upcomingRes ?? []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      }
    }

    loadDashboard();
  }, []);

  const speciesCount = new Set(plants.map((p) => p.species_id)).size;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Welcome back!</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>Total Plants: {plants.length}</CardContent>
        </Card>
        <Card>
          <CardContent>Species Tracked: {speciesCount}</CardContent>
        </Card>
        <Card>
          <CardContent>Upcoming Tasks: {upcomingLogs.length}</CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Upcoming Care</h2>
        <div className="space-y-2">
          {upcomingLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming tasks</p>
          ) : (
            upcomingLogs.map((log) => (
              <Card key={`${log.plant_id}-${log.due_date}`}>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{log.plant_nickname}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.care_type} - Due{" "}
                      {isNaN(new Date(log.due_date).getTime())
                        ? "Invalid date"
                        : format(new Date(log.due_date), "PPP")}
                    </p>
                    {log.note && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        {log.note}
                      </p>
                    )}
                  </div>
                  <Button size="sm">Mark as Done</Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Add New Plant</Button>
          <Button variant="secondary">Log Care Entry</Button>
          <Button variant="secondary">Browse Species</Button>
          <Button variant="ghost">Settings</Button>
        </div>
      </div>
    </div>
  );
}
