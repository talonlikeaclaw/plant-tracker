import api from "./axios";

export async function createPlant(data: {
  nickname: string;
  species_id?: number;
  location?: string;
  date_added?: string;
  last_watered?: string;
}) {
  const res = await api.post("/plants", data);
  return res.data;
}

export async function getAllPlants() {
  const res = await api.get("/plants");
  return res.data;
}
