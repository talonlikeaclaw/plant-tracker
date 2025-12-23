import api from "./axios";
import type { CareType } from "@/types";

export async function getDefaultCareTypes(): Promise<{ care_types: CareType[] }> {
  const res = await api.get("/care-types/default");
  return res.data;
}

export async function getUserCareTypes(): Promise<{ care_types: CareType[] }> {
  const res = await api.get("/care-types/user");
  return res.data;
}

export async function createCareType(data: {
  name: string;
  description?: string;
}) {
  const res = await api.post("/care-types", data);
  return res.data;
}

export async function updateCareType(
  id: number,
  data: {
    name?: string;
    description?: string;
  }
) {
  const res = await api.patch(`/care-types/${id}`, data);
  return res.data;
}

export async function deleteCareType(id: number) {
  const res = await api.delete(`/care-types/${id}`);
  return res.data;
}
