import api from "./axios";
import type { Plant, UpcomingCareLog } from "@/types";

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
