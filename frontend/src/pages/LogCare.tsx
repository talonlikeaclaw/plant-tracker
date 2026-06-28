import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/page-layout";
import { StatusAlerts } from "@/components/feedback/status-alerts";
import { SinglePlantForm } from "@/components/log-care/single-plant-form";
import { MultiPlantForm } from "@/components/log-care/multi-plant-form";
import { RecentCareLogs } from "@/components/log-care/recent-care-logs";
import { getAllPlants } from "@/api/plants";
import { getPastCareLogs } from "@/api/dashboard";
import { useCareTypes } from "@/hooks/use-care-types";
import type { Plant, CareLog } from "@/types";

export default function LogCare() {
  const navigate = useNavigate();
  const { careTypes, loading: careTypesLoading } = useCareTypes();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [recentLogs, setRecentLogs] = useState<CareLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [multiMode, setMultiMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [plantsRes, logsRes] = await Promise.all([
        getAllPlants(),
        getPastCareLogs().catch(() => []),
      ]);

      setPlants(plantsRes.plants ?? []);
      setRecentLogs(logsRes ?? []);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSuccess = (message: string) => {
    setSuccess(message);
    loadData();
  };

  const handleError = (message: string) => {
    setError(message);
  };

  const loading = dataLoading || careTypesLoading;

  return (
    <PageLayout
      title="Log Care"
      subtitle="Record care activities for your plants"
      maxWidth="4xl"
      headerActions={
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="shrink-0 w-full sm:w-auto"
        >
          Back to Dashboard
        </Button>
      }
    >
      <StatusAlerts success={success} error={error} />

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={!multiMode ? "default" : "outline"}
          onClick={() => setMultiMode(false)}
        >
          Single Plant
        </Button>
        <Button
          variant={multiMode ? "default" : "outline"}
          onClick={() => setMultiMode(true)}
        >
          Multiple Plants
        </Button>
      </div>

      {/* Single Plant Logging */}
      {!multiMode && (
        <SinglePlantForm
          plants={plants}
          careTypes={careTypes}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      {/* Multi Plant Logging */}
      {multiMode && (
        <MultiPlantForm
          plants={plants}
          careTypes={careTypes}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      {/* Recent Logs */}
      <RecentCareLogs logs={recentLogs} plants={plants} careTypes={careTypes} />
    </PageLayout>
  );
}
