import axios from "axios";
import api from "./axios";
import type { AuthResponse } from "@/types";

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
}

export async function refreshToken(): Promise<{ access_token: string }> {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) {
    throw new Error("No refresh token available");
  }
  const res = await axios.post<{ access_token: string }>(
    `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
    {},
    { headers: { Authorization: `Bearer ${refresh_token}` } },
  );
  return res.data;
}
