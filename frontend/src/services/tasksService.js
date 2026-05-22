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

/**
 * Lists tasks. The backend enforces team isolation: managers get every task
 * (or one team when `teamId` is passed), employees only ever get their own.
 *
 * @param {string} [teamId] - optional team filter (managers only). "all" / falsy = no filter.
 */
export async function listTasks(teamId) {
  const params = teamId && teamId !== "all" ? { teamId } : undefined;
  const { data } = await api.get("/api/tasks", { params });
  return data;
}

/** Fetches a single task with full details. */
export async function getTask(taskId) {
  const { data } = await api.get(`/api/tasks/${taskId}`);
  return data;
}

/** Updates a task (manager only). `patch` is any subset of mutable fields. */
export async function updateTask(taskId, patch) {
  const { data } = await api.put(`/api/tasks/${taskId}`, patch);
  return data;
}

/**
 * Updates only a task's status. Allowed for managers and for the employee
 * the task is assigned to.
 */
export async function updateTaskStatus(taskId, status) {
  const { data } = await api.patch(`/api/tasks/${taskId}/status`, { status });
  return data;
}

/** Permanently deletes a task (manager only). */
export async function deleteTask(taskId) {
  await api.delete(`/api/tasks/${taskId}`);
}
