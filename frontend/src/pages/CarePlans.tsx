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
import { getAllCarePlans } from "@/api/carePlans";
import { getAllPlants } from "@/api/plants";
import { getDefaultCareTypes, getUserCareTypes } from "@/api/careTypes";
import type { CarePlan, Plant, CareType } from "@/types";
import { format } from "date-fns";

export default function CarePlans() {
  const navigate = useNavigate();
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [careTypes, setCareTypes] = useState<CareType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, plantsRes, defaultTypes, userTypes] = await Promise.all([
          getAllCarePlans().catch(() => []),
          getAllPlants(),
          getDefaultCareTypes(),
          getUserCareTypes().catch(() => ({ care_types: [] })),
        ]);

        setCarePlans(plansRes);
        setPlants(plantsRes.plants ?? []);

        // Combine default and user care types
        const allCareTypes = [
          ...(defaultTypes.care_types ?? []),
          ...(userTypes.care_types ?? []),
        ];
        setCareTypes(allCareTypes);
      } catch (err) {
        console.error("Failed to load care plans:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Helper functions to get names
  const getPlantName = (plantId: number) => {
    const plant = plants.find((p) => p.id === plantId);
    return plant?.nickname || `Plant #${plantId}`;
  };

  const getCareTypeName = (careTypeId: number) => {
    const careType = careTypes.find((ct) => ct.id === careTypeId);
    return careType?.name || `Care Type #${careTypeId}`;
  };

  const activePlans = carePlans.filter((plan) => plan.active);
  const inactivePlans = carePlans.filter((plan) => !plan.active);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Care Plans</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your plant care schedules
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/care-plans/add")}>
              Create Care Plan
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Active Plans */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Active Plans ({activePlans.length})
            </h2>
            {isLoading ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground py-8 text-center">
                    Loading care plans...
                  </p>
                </CardContent>
              </Card>
            ) : activePlans.length === 0 ? (
              <Card>
                <CardContent>
                  <div className="py-8 text-center space-y-3">
                    <p className="text-muted-foreground">
                      No active care plans yet.
                    </p>
                    <Button onClick={() => navigate("/care-plans/add")}>
                      Create Your First Care Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlans.map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {getPlantName(plan.plant_id)}
                      </CardTitle>
                      <CardDescription>
                        {getCareTypeName(plan.care_type_id)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {plan.start_date && (
                        <div className="text-sm">
                          <span className="font-medium">Start Date:</span>{" "}
                          {format(new Date(plan.start_date), "PPP")}
                        </div>
                      )}
                      {plan.frequency_days && (
                        <div className="text-sm">
                          <span className="font-medium">Frequency:</span> Every{" "}
                          {plan.frequency_days} day
                          {plan.frequency_days !== 1 && "s"}
                        </div>
                      )}
                      {plan.note && (
                        <div className="text-sm">
                          <span className="font-medium">Note:</span> {plan.note}
                        </div>
                      )}
                      <div className="pt-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                          Active
                        </span>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card key={plan.id} className="opacity-60">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {getPlantName(plan.plant_id)}
                      </CardTitle>
                      <CardDescription>
                        {getCareTypeName(plan.care_type_id)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {plan.start_date && (
                        <div className="text-sm">
                          <span className="font-medium">Start Date:</span>{" "}
                          {format(new Date(plan.start_date), "PPP")}
                        </div>
                      )}
                      {plan.frequency_days && (
                        <div className="text-sm">
                          <span className="font-medium">Frequency:</span> Every{" "}
                          {plan.frequency_days} day
                          {plan.frequency_days !== 1 && "s"}
                        </div>
                      )}
                      {plan.note && (
                        <div className="text-sm">
                          <span className="font-medium">Note:</span> {plan.note}
                        </div>
                      )}
                      <div className="pt-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                          Inactive
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
