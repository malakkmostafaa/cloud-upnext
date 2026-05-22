import api from "../api/api";

export async function fetchCurrentUser() {
  const response = await api.get("/api/me");
  return response.data;
}