import api from "./axios";
import type { Species } from "@/types";

export async function getAllSpecies(): Promise<{ species: Species[] }> {
  const res = await api.get("/species");
  return res.data;
}

export async function createSpecies(data: {
  common_name: string;
  scientific_name?: string;
  sunlight?: string;
  water_requirements?: string;
}) {
  const res = await api.post("/species", data);
  return res.data;
}
