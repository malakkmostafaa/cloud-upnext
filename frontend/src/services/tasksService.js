import api from "../api/api";

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
 *   deadline: string,        // ISO date string
 *   assigneeId: string,
 *   teamId: string,
 *   projectId: string,
 *   imageKey?: string,
 * }} payload
 */
export async function createTask(payload) {
  const { data } = await api.post("/api/tasks", payload);
  return data;
}
