import api from "./axios";
import type { Plant, CareLog, UpcomingCareLog } from "@/types";

// Get user's plants for dashboard display
export async function getUserPlants(): Promise<Plant[]> {
  const res = await api.get<{ plants: Plant[] }>("/plants");
  return res.data.plants;
}

// Get a user's upcoming care plans/logs
export async function getUpcomingCareLogs(): Promise<UpcomingCareLog[]> {
  const res = await api.get<{ care_logs: UpcomingCareLog[] }>(
    "/plant-care/care-plans/upcoming",
  );
  return res.data.care_logs;
}

// Get all of a user's care logs
export async function getPastCareLogs(): Promise<CareLog[]> {
  const plants = await getUserPlants();
  if (plants.length == 0) return [];

  const careLogPromises = plants.map((plant) =>
    api.get<CareLog[]>(`/plant-care/plant/${plant.id}`),
  );
  const careLogsPerPlant = await Promise.all(careLogPromises);
  const allCareLogs = careLogsPerPlant.flatMap((res) => res.data);
  return allCareLogs;
}
