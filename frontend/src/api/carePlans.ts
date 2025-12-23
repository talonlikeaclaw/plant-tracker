import api from "./axios";
import type { CarePlan } from "@/types";

export async function getAllCarePlans(): Promise<CarePlan[]> {
  const res = await api.get("/plant-care/care-plans");
  return res.data;
}

export async function getActiveCarePlans(): Promise<CarePlan[]> {
  const res = await api.get("/plant-care/care-plans/active");
  return res.data;
}

export async function createCarePlan(data: {
  plant_id: number;
  care_type_id: number;
  start_date?: string;
  frequency_days?: number;
  note?: string;
  active?: boolean;
}) {
  const res = await api.post("/plant-care/care-plans", data);
  return res.data;
}
