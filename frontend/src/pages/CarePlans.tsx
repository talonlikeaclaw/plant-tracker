import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/page-layout";
import { StatusAlerts } from "@/components/feedback/status-alerts";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { CarePlanCard } from "@/components/plants/care-plan-card";
import { EditCarePlanDialog } from "@/components/plants/edit-care-plan-dialog";
import { Button } from "@/components/ui/button";
import { getAllCarePlans, deleteCarePlan } from "@/api/carePlans";
import { getAllPlants } from "@/api/plants";
import { useCareTypes } from "@/hooks/use-care-types";
import type { CarePlan, Plant } from "@/types";
import { getPlantName, getCareTypeName, getErrorMessage } from "@/lib/utils";

export default function CarePlans() {
  const navigate = useNavigate();
  const { careTypes, loading: careTypesLoading } = useCareTypes();
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<CarePlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<CarePlan | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const [plansRes, plantsRes] = await Promise.all([
        getAllCarePlans().catch(() => []),
        getAllPlants(),
      ]);

      setCarePlans(plansRes);
      setPlants(plantsRes.plants ?? []);
    } catch (err) {
      console.error("Failed to load care plans:", err);
      setError("Failed to load care plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!planToDelete) return;

    setFormLoading(true);
    setError("");
    try {
      await deleteCarePlan(planToDelete.id);
      setSuccess("Care plan deleted successfully!");
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete care plan"));
    } finally {
      setFormLoading(false);
    }
  };

  const activePlans = carePlans.filter((plan) => plan.active);
  const inactivePlans = carePlans.filter((plan) => !plan.active);

  return (
    <PageLayout
      title="Care Plans"
      subtitle="Manage your plant care schedules"
      maxWidth="4xl"
      contentClassName="space-y-8"
      headerActions={
        <>
          <Button
            onClick={() => navigate("/care-plans/add")}
            className="w-full sm:w-auto"
          >
            Create Care Plan
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto"
          >
            Back to Dashboard
          </Button>
        </>
      }
    >
      <StatusAlerts success={success} error={error} />

      {/* Active Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Active Plans ({activePlans.length})
        </h2>
        {isLoading || careTypesLoading ? (
          <LoadingState message="Loading care plans..." />
        ) : activePlans.length === 0 ? (
          <EmptyState
            message="No active care plans yet."
            action={
              <Button onClick={() => navigate("/care-plans/add")}>
                Create Your First Care Plan
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlans.map((plan) => (
              <CarePlanCard
                key={plan.id}
                plan={plan}
                plantName={getPlantName(plants, plan.plant_id)}
                careTypeName={getCareTypeName(careTypes, plan.care_type_id)}
                active
                onEdit={setEditingPlan}
                onDelete={(p) => {
                  setPlanToDelete(p);
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inactive Plans */}
      {inactivePlans.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Inactive Plans ({inactivePlans.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactivePlans.map((plan) => (
              <CarePlanCard
                key={plan.id}
                plan={plan}
                plantName={getPlantName(plants, plan.plant_id)}
                careTypeName={getCareTypeName(careTypes, plan.care_type_id)}
                active={false}
                onEdit={setEditingPlan}
                onDelete={(p) => {
                  setPlanToDelete(p);
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <EditCarePlanDialog
        plan={editingPlan}
        open={editingPlan !== null}
        onOpenChange={(open) => {
          if (!open) setEditingPlan(null);
        }}
        plants={plants}
        careTypes={careTypes}
        onSuccess={() => {
          setSuccess("Care plan updated successfully!");
          loadData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Care Plan"
        description={
          <>
            Are you sure you want to delete this care plan for{" "}
            {planToDelete && getPlantName(plants, planToDelete.plant_id)}? This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete Care Plan"
        loading={formLoading}
        onConfirm={handleDelete}
        error={error}
      />
    </PageLayout>
  );
}
