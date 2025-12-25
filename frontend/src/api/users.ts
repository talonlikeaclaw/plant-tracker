import api from "./axios";

export const getCurrentUser = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const changePassword = async (
  email: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  const response = await api.patch("/users/password", {
    email,
    old_password: oldPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return response.data;
};
