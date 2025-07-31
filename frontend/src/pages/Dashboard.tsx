import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, isPast, isToday, isWithinInterval, addDays } from "date-fns";
import { getUserPlants, getUserCareLogs, getCareTypes } from "@/api/dashboard";
import type { Plant, CareLog, CareType } from "@/types";

export default function Dashboard() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [careTypes, setCareTypes] = useState<CareType[]>([]);

  const today = new Date();

  useEffect(() => {
    async function loadDashboard() {
      const [plantsRes, logsRes, typesRes] = await Promise.all([
        getUserPlants(),
        getUserCareLogs(),
        getCareTypes(),
      ]);
      setPlants(plantsRes);
      setCareLogs(logsRes);
      setCareTypes(typesRes);
    }
    loadDashboard();
  }, []);

  const speciesCount = new Set(plants.map((p) => p.species_id)).size;

  // TODO: Update backend to add care plans because care logs are in the past
  const upcomingLogs = careLogs.filter((log) => {
    const date = new Date(log.care_date);
    return isWithinInterval(date, { start: today, end: addDays(today, 7) });
  });

  // TODO: Updata to care plans after implementation
  const overdueLogs = careLogs.filter((log) => {
    const date = new Date(log.care_date);
    return isPast(date) && !isToday(date);
  });

  const recentLogs = [...careLogs]
    .sort(
      (a, b) =>
        new Date(b.care_date).getTime() - new Date(a.care_date).getTime(),
    )
    .slice(0, 5);

  const getCareTypeName = (id: number) =>
    careTypes.find((t) => t.id === id)?.name || "Unknown";

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
        <Card>
          <CardContent>Overdue: {overdueLogs.length}</CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Upcoming Care</h2>
        <div className="space-y-2">
          {upcomingLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming tasks</p>
          ) : (
            upcomingLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {plants.find((p) => p.id === log.plant_id)?.nickname ||
                        "Unknown Plant"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getCareTypeName(log.care_type_id)} — Due{" "}
                      {format(new Date(log.care_date), "PPP")}
                    </p>
                  </div>
                  <Button size="sm">Mark as Done</Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Recently Logged Care</h2>
        <div className="space-y-1">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent care logged
            </p>
          ) : (
            recentLogs.map((log) => (
              <p key={log.id} className="text-sm">
                You {getCareTypeName(log.care_type_id).toLowerCase()}ed{" "}
                <strong>
                  {plants.find((p) => p.id === log.plant_id)?.nickname ||
                    "Unknown Plant"}
                </strong>{" "}
                on {format(new Date(log.care_date), "PPPp")}
              </p>
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
