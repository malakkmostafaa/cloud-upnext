import api from "../api/api";

function extractTasks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.Items)) return data.Items;
  return [];
}

function extractTask(data) {
  return data?.task || data;
}

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
 *   deadline: string,
 *   assigneeId: string,
 *   teamId: string,
 *   projectId: string,
 *   imageOriginalKey?: string,
 * }} payload
 */
export async function createTask(payload) {
  const { data } = await api.post("/api/tasks", payload);
  return extractTask(data);
}

/**
 * Managers get all tasks, or one team when teamId is passed.
 * Employees only get their own team from backend.
 */
export async function listTasks(teamId) {
  const params = teamId && teamId !== "all" ? { teamId } : undefined;

  const { data } = await api.get("/api/tasks", {
    params,
  });
  console.log("LIST TASKS RAW RESPONSE:", data);

  return extractTasks(data);
}

export async function getTask(taskId) {
  const { data } = await api.get(`/api/tasks/${taskId}`);
  return extractTask(data);
}

export async function updateTask(taskId, patch) {
  const { data } = await api.put(`/api/tasks/${taskId}`, patch);
  return extractTask(data);
}

export async function updateTaskStatus(taskId, status) {
  const { data } = await api.patch(`/api/tasks/${taskId}/status`, { status });
  return extractTask(data);
}

export async function deleteTask(taskId) {
  await api.delete(`/api/tasks/${taskId}`);
}