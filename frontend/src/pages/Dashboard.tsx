import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  getUserPlants,
  getUpcomingCareLogs,
  getPastCareLogs,
} from "@/api/dashboard";
import type { Plant, CareLog, UpcomingCareLog } from "@/types";

export default function Dashboard() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [upcomingLogs, setUpcomingLogs] = useState<UpcomingCareLog[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [plantsRes, upcomingRes, careLogs] = await Promise.all([
          getUserPlants(),
          getUpcomingCareLogs(),
          getPastCareLogs(),
        ]);

        setPlants(plantsRes ?? []);
        setUpcomingLogs(upcomingRes ?? []);
        setCareLogs(careLogs ?? []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      }
    }

    loadDashboard();
  }, []);

  const speciesCount = new Set(plants.map((p) => p.species_id)).size;

  return (
    <div className="min-h-screen w-full bg-background p-6 space-y-8 flex flex-col">
      {/* Header */}
      <h1 className="text-2xl font-bold">Welcome back!</h1>
      {/* Quick Actions */}
      <h2 className="text-xl font-semibold">Quick Actions</h2>
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <Button className="w-full">Add New Plant</Button>
          <Button className="w-full">Log Care Entry</Button>
          <Button className="w-full">Setup Care Plan</Button>
          <Button className="w-full">Browse Species</Button>
          <Button className="w-full">Settings</Button>
        </div>
      </div>

      {/* Stats */}
      <h2 className="text-xl font-semibold">At a Glance</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Total Plants</CardTitle>
          </CardHeader>
          <CardContent>
            {plants.length === 0
              ? "No plants to care for."
              : `${plants.length} plant${plants.length > 1 ? "s" : ""} to care for!`}
          </CardContent>
        </Card>

        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Species Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            {speciesCount === 0
              ? "No species tracked yet."
              : `${speciesCount} unique species.`}
          </CardContent>
        </Card>

        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingLogs.length === 0
              ? "No upcoming tasks."
              : `${upcomingLogs.length} upcoming care entr${
                  upcomingLogs.length === 1 ? "y" : "ies"
                }.`}
          </CardContent>
        </Card>

        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Care Log History</CardTitle>
          </CardHeader>
          <CardContent>
            {careLogs.length === 0
              ? "No care logs yet."
              : `${careLogs.length} care log${careLogs.length > 1 ? "s" : ""}.`}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Care */}
      <h2 className="text-xl font-semibold">Upcoming Care</h2>
      <div className="space-y-2">
        {upcomingLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming tasks</p>
        ) : (
          <div className="space-y-2">
            {upcomingLogs.map((log) => (
              <Card
                className="bg-muted"
                key={`${log.plant_id}-${log.due_date}`}
              >
                <CardContent className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{log.plant_nickname}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.care_type} – Due{" "}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
