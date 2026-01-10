import api from "./axios";
import type { CareLog } from "@/types";

export async function createCareLog(data: {
  plant_id: number;
  care_type_id: number;
  care_date?: string;
  note?: string;
}) {
  const res = await api.post("/plant-care", data);
  return res.data;
}

export async function getCareLogsByPlant(plantId: number): Promise<{ care_logs: CareLog[] }> {
  const res = await api.get(`/plant-care/plant/${plantId}`);
  return res.data;
}

export async function getUpcomingCareForPlant(plantId: number, allUpcomingCare: any[]) {
  return allUpcomingCare.filter(care => care.plant_id === plantId);
}
