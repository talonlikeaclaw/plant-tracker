import api from "./axios";
import type { Photo, PhotoWithSource } from "@/types";

// Shape returned by upload endpoints
export interface UploadPhotosResponse {
  message: string;
  photos: Photo[];
  errors: { filename: string; error: string }[];
}

// Get aggregated gallery for a plant (plant photos + all care log photos)
export async function getPlantPhotos(
  plantId: number,
): Promise<{ photos: PhotoWithSource[] }> {
  const res = await api.get(`/photos/plant/${plantId}`);
  return res.data;
}

// Upload one or more photos to a plant (multipart/form-data)
export async function uploadPlantPhotos(
  plantId: number,
  files: File[],
): Promise<UploadPhotosResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const res = await api.post(`/photos/plant/${plantId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Get photos for a single care log
export async function getCareLogPhotos(
  careLogId: number,
): Promise<{ photos: PhotoWithSource[] }> {
  const res = await api.get(`/photos/care-log/${careLogId}`);
  return res.data;
}

// Upload one or more photos to a care log
export async function uploadCareLogPhotos(
  careLogId: number,
  files: File[],
): Promise<UploadPhotosResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const res = await api.post(`/photos/care-log/${careLogId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Update a photo's position (reorder / cover selection)
export async function updatePhotoPosition(photoId: number, position: number) {
  const res = await api.patch(`/photos/${photoId}`, { position });
  return res.data;
}

// Delete a photo (DB row + on-disk files)
export async function deletePhoto(photoId: number) {
  const res = await api.delete(`/photos/${photoId}`);
  return res.data;
}

// Fetch a photo's binary file as a Blob for AuthImage rendering.
// Pass thumb=true for the 400px thumbnail variant.
export async function fetchPhotoFile(
  photoId: number,
  thumb = false,
): Promise<Blob> {
  const res = await api.get(`/photos/${photoId}/file`, {
    params: thumb ? { thumb: 1 } : {},
    responseType: "blob",
  });
  return res.data;
}
