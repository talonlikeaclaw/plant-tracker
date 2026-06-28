import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { PageLayout } from "@/components/layout/page-layout";
import { StatusAlerts } from "@/components/feedback/status-alerts";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingCareCard } from "@/components/dashboard/upcoming-care-card";
import { MarkAsDoneDialog } from "@/components/dashboard/mark-as-done-dialog";
import {
  getUserPlants,
  getUpcomingCareLogs,
  getPastCareLogs,
} from "@/api/dashboard";
import { createCareLog } from "@/api/careLogs";
import { useAlerts } from "@/hooks/use-alerts";
import type { Plant, CareLog, UpcomingCareLog } from "@/types";
import { getTodayLocal, getErrorMessage } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { success, error, setSuccess, setError } = useAlerts();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [upcomingLogs, setUpcomingLogs] = useState<UpcomingCareLog[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [logToComplete, setLogToComplete] = useState<UpcomingCareLog | null>(
    null,
  );
  const [completing, setCompleting] = useState(false);

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

    try {
      await createCareLog({
        plant_id: logToComplete.plant_id,
        care_type_id: logToComplete.care_type_id,
        care_date: getTodayLocal(),
        note: logToComplete.note || undefined,
      });

      setSuccess(
        `Marked "${logToComplete.care_type}" as done for ${logToComplete.plant_nickname}!`,
      );
      setConfirmDialogOpen(false);
      setLogToComplete(null);

      // Reload dashboard data
      loadDashboard();
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err, "Failed to mark as done. Please try again."),
      );
    } finally {
      setCompleting(false);
    }
  };

  const speciesCount = new Set(plants.map((p) => p.species_id)).size;
  const dueSoonLogs = upcomingLogs.filter((log) => log.days_until_due <= 3);

  return (
    <PageLayout
      title="Plant Tracker"
      subtitle="Welcome back! Here's what's happening with your plants."
      titleClassName="text-2xl sm:text-3xl font-bold text-foreground truncate"
      subtitleClassName="text-sm text-muted-foreground mt-1"
      maxWidth="none"
      contentClassName="space-y-8"
      actionsClassName="flex gap-2 shrink-0"
      headerActions={
        <>
          <ModeToggle />
          <UserMenu />
        </>
      }
    >
      {/* Success/Error Messages */}
      <StatusAlerts success={success} error={error} />

      <QuickActions onNavigate={navigate} />

      {/* Upcoming Care */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Upcoming Care (Next 3 Days)
        </h2>
        {isLoading ? (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">Loading care schedule...</p>
            </CardContent>
          </Card>
        ) : dueSoonLogs.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                No upcoming care tasks in the next 3 days. Your plants are all
                set!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {dueSoonLogs.map((log) => (
              <UpcomingCareCard
                key={`${log.plant_id}-${log.care_type}-${log.due_date}`}
                log={log}
                onNavigatePlant={(plantId) => navigate(`/plants/${plantId}`)}
                onMarkDone={openConfirmDialog}
              />
            ))}
          </div>
        )}
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">At a Glance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Plants"
            description="Plants in your collection"
            value={plants.length}
            loading={isLoading}
          />
          <StatCard
            title="Species Tracked"
            description="Unique species varieties"
            value={speciesCount}
            loading={isLoading}
          />
          <StatCard
            title="Upcoming Tasks"
            description="Care activities due soon"
            value={upcomingLogs.length}
            loading={isLoading}
          />
          <StatCard
            title="Care History"
            description="Total logged activities"
            value={careLogs.length}
            loading={isLoading}
          />
        </div>
      </section>

      {/* Mark as Done Confirmation Dialog */}
      <MarkAsDoneDialog
        log={logToComplete}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        loading={completing}
        error={error}
        onConfirm={handleMarkAsDone}
      />
    </PageLayout>
  );
}
