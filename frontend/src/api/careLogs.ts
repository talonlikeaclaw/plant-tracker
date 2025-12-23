import api from "./axios";

export async function createCareLog(data: {
  plant_id: number;
  care_type_id: number;
  care_date?: string;
  note?: string;
}) {
  const res = await api.post("/plant-care", data);
  return res.data;
}

export async function getCareLogsByPlant(plantId: number) {
  const res = await api.get(`/plant-care/plant/${plantId}`);
  return res.data;
}
