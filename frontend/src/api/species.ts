import api from "./axios";
import type { Species } from "@/types";

export async function getAllSpecies(): Promise<{ species: Species[] }> {
  const res = await api.get("/species");
  return res.data;
}
