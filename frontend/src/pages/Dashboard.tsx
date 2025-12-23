import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import {
  getUserPlants,
  getUpcomingCareLogs,
  getPastCareLogs,
} from "@/api/dashboard";
import { createCareLog } from "@/api/careLogs";
import type { Plant, CareLog, UpcomingCareLog } from "@/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [upcomingLogs, setUpcomingLogs] = useState<UpcomingCareLog[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [logToComplete, setLogToComplete] = useState<UpcomingCareLog | null>(null);
  const [completing, setCompleting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = async () => {
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
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const openConfirmDialog = (log: UpcomingCareLog) => {
    setLogToComplete(log);
    setConfirmDialogOpen(true);
  };

  const handleMarkAsDone = async () => {
    if (!logToComplete) return;

    setCompleting(true);
    setError("");
    setSuccess("");

    try {
      // Create the care log with today's date
      await createCareLog({
        plant_id: logToComplete.plant_id,
        care_type_id: logToComplete.care_type_id,
        care_date: new Date().toISOString().split("T")[0],
        note: logToComplete.note || undefined,
      });

      setSuccess(`Marked "${logToComplete.care_type}" as done for ${logToComplete.plant_nickname}!`);
      setConfirmDialogOpen(false);
      setLogToComplete(null);

      // Reload dashboard data
      loadDashboard();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to mark as done. Please try again."
      );
    } finally {
      setCompleting(false);
    }
  };

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
        {/* Success/Error Messages */}
        {success && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/plants")}
            >
              Your Plants
            </Button>
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/plants/add")}
            >
              Add Plant
            </Button>
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/species")}
            >
              Species
            </Button>
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/log-care")}
            >
              Log Care
            </Button>
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/care-plans")}
            >
              Care Plans
            </Button>
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/care-types")}
            >
              Care Types
            </Button>
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
                        onClick={() => openConfirmDialog(log)}
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

        {/* Mark as Done Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Care as Complete</DialogTitle>
              <DialogDescription>
                Are you sure you want to mark this care activity as done?
              </DialogDescription>
            </DialogHeader>
            {logToComplete && (
              <div className="space-y-2 py-4">
                <div className="text-sm">
                  <span className="font-medium">Plant:</span>{" "}
                  {logToComplete.plant_nickname}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Care Type:</span>{" "}
                  {logToComplete.care_type}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Due Date:</span>{" "}
                  {format(new Date(logToComplete.due_date), "PPP")}
                </div>
                {logToComplete.note && (
                  <div className="text-sm">
                    <span className="font-medium">Note:</span>{" "}
                    {logToComplete.note}
                  </div>
                )}
                <div className="text-sm text-muted-foreground pt-2">
                  This will be logged as completed today.
                </div>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={completing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkAsDone}
                disabled={completing}
              >
                {completing ? "Marking..." : "Mark as Done"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
