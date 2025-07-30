import api from "./axios";
import { Plant, CareLog, CareType } from "../types";

export async function getUserPlants(): Promise<Plant[]> {
  const res = await api.get<Plant[]>("/api/plants");
  return res.data;
}

export async function getUserCareLogs(): Promise<CareLog[]> {
  const plants = await getUserPlants();

  const careLogPromises = plants.map((plant) =>
    api.get<CareLog[]>(`/api/plant-care/plant/${plant.id}`),
  );

  const careLogsPerPlant = await Promise.all(careLogPromises);

  const allCareLogs = careLogsPerPlant.flatMap((res) => res.data);
  return allCareLogs;
}

export async function getCareTypes(): Promise<CareType[]> {
  const [defaultRes, userRes] = await Promise.all([
    api.get<CareType[]>("/api/care-types/default"),
    api.get<CareType[]>("/api/care-types/user"),
  ]);

  return [...defaultRes.data, ...userRes.data];
}
