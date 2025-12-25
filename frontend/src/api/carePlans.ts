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

export async function updateCarePlan(id: number, data: {
  plant_id?: number;
  care_type_id?: number;
  start_date?: string;
  frequency_days?: number;
  note?: string;
  active?: boolean;
}) {
  const res = await api.patch(`/plant-care/care-plans/${id}`, data);
  return res.data;
}

export async function deleteCarePlan(id: number) {
  const res = await api.delete(`/plant-care/care-plans/${id}`);
  return res.data;
}
