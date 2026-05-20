import api from "../api/api";

export async function listProjects() {
  const { data } = await api.get("/api/projects");
  return data;
}
