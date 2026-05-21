import api from "./api";

export async function fetchCurrentUser() {
  const response = await api.get("/me");
  return response.data;
}