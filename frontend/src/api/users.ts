import api from "./axios";

export const getCurrentUser = async () => {
  const response = await api.get("/users");
  return response.data;
};
