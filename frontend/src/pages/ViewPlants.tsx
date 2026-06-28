import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/page-layout";
import { StatusAlerts } from "@/components/feedback/status-alerts";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PlantCard } from "@/components/plants/plant-card";
import { EditPlantDialog } from "@/components/plants/edit-plant-dialog";
import { getAllPlants, deletePlant } from "@/api/plants";
import { getAllSpecies } from "@/api/species";
import { getCareLogsByPlant } from "@/api/careLogs";
import { getUpcomingCareLogs } from "@/api/dashboard";
import { getDefaultCareTypes, getUserCareTypes } from "@/api/careTypes";
import type {
  Plant,
  Species,
  PlantWithCareData,
  CareType,
  UpcomingCareLog,
  CareLog,
} from "@/types";
import { getSpeciesName, getErrorMessage } from "@/lib/utils";

export default function ViewPlants() {
  const navigate = useNavigate();
  const [enrichedPlants, setEnrichedPlants] = useState<PlantWithCareData[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      // Fetch all basic data
      const [plantsRes, speciesRes, defaultCareTypesRes, userCareTypesRes] =
        await Promise.all([
          getAllPlants(),
          getAllSpecies(),
          getDefaultCareTypes(),
          getUserCareTypes(),
        ]);

      const plantsData = plantsRes.plants ?? [];
      const allCareTypes = [
        ...(defaultCareTypesRes.care_types ?? []),
        ...(userCareTypesRes.care_types ?? []),
      ];

      setSpecies(speciesRes.species ?? []);

      // Fetch care data for all plants
      const [upcomingCareData, ...careLogsData] = await Promise.all([
        getUpcomingCareLogs(),
        ...plantsData.map((plant: Plant) => getCareLogsByPlant(plant.id)),
      ]);

      // Enrich each plant with care data
      const enriched: PlantWithCareData[] = plantsData.map(
        (plant: Plant, index: number) => {
          const careLogs = careLogsData[index].care_logs ?? [];
          const upcomingCare = upcomingCareData.filter(
            (care: UpcomingCareLog) => care.plant_id === plant.id,
          );

          // Calculate urgency status
          let urgencyStatus:
            | "overdue"
            | "due_today"
            | "due_soon"
            | "up_to_date" = "up_to_date";
          if (upcomingCare.length > 0) {
            const mostUrgent = upcomingCare.reduce(
              (prev: UpcomingCareLog, curr: UpcomingCareLog) =>
                curr.days_until_due < prev.days_until_due ? curr : prev,
            );

            if (mostUrgent.days_until_due < 0) {
              urgencyStatus = "overdue";
            } else if (mostUrgent.days_until_due === 0) {
              urgencyStatus = "due_today";
            } else if (mostUrgent.days_until_due <= 3) {
              urgencyStatus = "due_soon";
            }
          }

          // Group care logs by care type and get most recent for each
          const careTypeMap = new Map<number, CareLog>();
          careLogs.forEach((log: CareLog) => {
            const existing = careTypeMap.get(log.care_type_id);
            if (
              !existing ||
              new Date(log.care_date) > new Date(existing.care_date)
            ) {
              careTypeMap.set(log.care_type_id, log);
            }
          });

          // Create care history summary
          const recentCareHistory = Array.from(careTypeMap.values())
            .map((log: CareLog) => {
              const careType = allCareTypes.find(
                (ct: CareType) => ct.id === log.care_type_id,
              );
              const careDate = new Date(log.care_date);
              const now = new Date();
              const daysAgo = Math.floor(
                (now.getTime() - careDate.getTime()) / (1000 * 60 * 60 * 24),
              );

              return {
                careTypeName: careType?.name || "Unknown",
                lastCareDate: log.care_date,
                daysAgo,
              };
            })
            .sort((a, b) => a.daysAgo - b.daysAgo)
            .slice(0, 5); // Show only top 5 most recent care types

          return {
            ...plant,
            recentCareHistory,
            upcomingCare,
            urgencyStatus,
          };
        },
      );

      setEnrichedPlants(enriched);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load plants");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditDialog = (plant: Plant) => {
    setEditingPlant(plant);
  };

  const handleDelete = async () => {
    if (!plantToDelete) return;

    setFormLoading(true);
    setError("");
    try {
      await deletePlant(plantToDelete.id);
      setSuccess(`${plantToDelete.nickname} deleted successfully!`);
      setDeleteDialogOpen(false);
      setPlantToDelete(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete plant"));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <PageLayout
      title="My Plants"
      subtitle="View and manage your plant collection"
      maxWidth="6xl"
      headerActions={
        <>
          <Button
            onClick={() => navigate("/plants/add")}
            className="w-full sm:w-auto"
          >
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Add Plant
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
      <StatusAlerts success={success} error={error} successIcon={false} />

      {/* Plants Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          All Plants ({enrichedPlants.length})
        </h2>
        {isLoading ? (
          <LoadingState message="Loading plants..." />
        ) : enrichedPlants.length === 0 ? (
          <EmptyState
            message="No plants yet. Start your collection!"
            action={
              <Button onClick={() => navigate("/plants/add")}>
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Add Your First Plant
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                speciesName={getSpeciesName(species, plant.species_id)}
                onNavigatePlant={(plantId) => navigate(`/plants/${plantId}`)}
                onEdit={openEditDialog}
                onDelete={(p) => {
                  setPlantToDelete(p);
                  setDeleteDialogOpen(true);
                }}
                onLogCare={(plantId) => navigate(`/log-care?plant=${plantId}`)}
                onAddPlan={(plantId) =>
                  navigate(`/care-plans/add?plant=${plantId}`)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditPlantDialog
        plant={editingPlant}
        open={editingPlant !== null}
        onOpenChange={(open) => {
          if (!open) setEditingPlant(null);
        }}
        species={species}
        onSuccess={() => {
          setSuccess("Plant updated successfully!");
          loadData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Plant"
        description={
          <>
            Are you sure you want to delete &quot;{plantToDelete?.nickname}
            &quot;? This will also delete all associated care logs and care
            plans. This action cannot be undone.
          </>
        }
        confirmLabel="Delete Plant"
        loading={formLoading}
        onConfirm={handleDelete}
        error={error}
      />
    </PageLayout>
  );
}
