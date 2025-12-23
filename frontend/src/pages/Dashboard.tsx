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
import { ModeToggle } from "@/components/mode-toggle";
import { format } from "date-fns";
import {
  getUserPlants,
  getUpcomingCareLogs,
  getPastCareLogs,
} from "@/api/dashboard";
import type { Plant, CareLog, UpcomingCareLog } from "@/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [upcomingLogs, setUpcomingLogs] = useState<UpcomingCareLog[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [plantsRes, upcomingRes, careLogsRes] = await Promise.all([
          getUserPlants(),
          getUpcomingCareLogs(),
          getPastCareLogs(),
        ]);

        setPlants(plantsRes ?? []);
        setUpcomingLogs(upcomingRes ?? []);
        setCareLogs(careLogsRes ?? []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const speciesCount = new Set(plants.map((p) => p.species_id)).size;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Plant Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your plants.
            </p>
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button
              variant="default"
              className="w-full"
              onClick={() => alert("View Plants - Coming soon!")}
            >
              View Plants
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/plants/add")}
            >
              Add Plant
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => alert("Log Care - Coming soon!")}
            >
              Log Care
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => alert("Care Plans - Coming soon!")}
            >
              Care Plans
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => alert("Species - Coming soon!")}
            >
              Species
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => alert("Settings - Coming soon!")}
            >
              Settings
            </Button>
          </div>
        </section>

        {/* Stats Grid */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">At a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Plants</CardTitle>
                <CardDescription>Plants in your collection</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-2xl font-bold text-muted-foreground">
                    Loading...
                  </p>
                ) : (
                  <p className="text-3xl font-bold">{plants.length}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Species Tracked</CardTitle>
                <CardDescription>Unique species varieties</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-2xl font-bold text-muted-foreground">
                    Loading...
                  </p>
                ) : (
                  <p className="text-3xl font-bold">{speciesCount}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Care activities due soon</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-2xl font-bold text-muted-foreground">
                    Loading...
                  </p>
                ) : (
                  <p className="text-3xl font-bold">{upcomingLogs.length}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Care History</CardTitle>
                <CardDescription>Total logged activities</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-2xl font-bold text-muted-foreground">
                    Loading...
                  </p>
                ) : (
                  <p className="text-3xl font-bold">{careLogs.length}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Upcoming Care */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Care</h2>
          {isLoading ? (
            <Card>
              <CardContent>
                <p className="text-muted-foreground">Loading care schedule...</p>
              </CardContent>
            </Card>
          ) : upcomingLogs.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-muted-foreground">
                  No upcoming care tasks. Your plants are all set!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingLogs.map((log) => (
                <Card
                  key={`${log.plant_id}-${log.care_type}-${log.due_date}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {log.plant_nickname}
                        </CardTitle>
                        <CardDescription>
                          {log.care_type} &middot; Due{" "}
                          {isNaN(new Date(log.due_date).getTime())
                            ? "Invalid date"
                            : format(new Date(log.due_date), "PPP")}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => alert("Mark as done - Coming soon!")}
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
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
