import api from "./axios";
import type { Plant, CareLog, CareType } from "@/types";

export async function getUserPlants(): Promise<Plant[]> {
  const res = await api.get<{ plants: Plant[] }>("/plants");
  return res.data.plants;
}

export async function getUserCareLogs(): Promise<CareLog[]> {
  const plants = await getUserPlants();
  if (plants.length === 0) return [];

  const careLogPromises = plants.map((plant) =>
    api.get<CareLog[]>(`/plant-care/plant/${plant.id}`),
  );

  const careLogsPerPlant = await Promise.all(careLogPromises);

  const allCareLogs = careLogsPerPlant.flatMap((res) => res.data);
  return allCareLogs;
}

export async function getCareTypes(): Promise<CareType[]> {
  const [defaultRes, userRes] = await Promise.all([
    api.get<{ care_types: CareType[] }>("/care-types/default"),
    api.get<{ care_types: CareType[] }>("/care-types/user"),
  ]);

  return [...defaultRes.data.care_types, ...userRes.data.care_types];
}
