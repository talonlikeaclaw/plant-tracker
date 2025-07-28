import api from "./axios";

interface AuthResponse {
  access_token: string;
  message?: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/login", data);
  return res.data;
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/register", data);
  return res.data;
}
