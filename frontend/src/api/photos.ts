import api from "./axios";
import type { Photo, PhotoWithSource } from "@/types";

// Shape returned by upload endpoints
export interface UploadPhotosResponse {
  message: string;
  photos: Photo[];
  errors: { index: number; filename: string; error: string }[];
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
  featuredIndex?: number,
  takenAts?: (string | undefined)[],
): Promise<UploadPhotosResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (featuredIndex !== undefined && featuredIndex >= 0) {
    formData.append("featured_index", String(featuredIndex));
  }
  takenAts?.forEach((takenAt) => formData.append("taken_at", takenAt ?? ""));
  const res = await api.post(`/photos/plant/${plantId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Convert a prospective HEIC/HEIF upload to a temporary JPEG preview.
export async function fetchPhotoPreview(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/photos/preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });
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

// Make a plant photo the featured cover photo.
export async function makePhotoFeatured(photoId: number) {
  const res = await api.patch(`/photos/${photoId}`, { featured: true });
  return res.data;
}

// Correct the date a photo was taken for chronological gallery ordering.
export async function updatePhotoTakenAt(photoId: number, takenAt: string) {
  const res = await api.patch(`/photos/${photoId}`, { taken_at: takenAt });
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
