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

export async function listTasks(teamId) {
  const params = teamId && teamId !== "all" ? { teamId } : undefined;

  const { data } = await api.get("/api/tasks", {
    params,
  });

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

/**
 * Step 1: Ask backend for a presigned S3 upload URL.
 */
export async function getTaskImageUploadUrl(taskId, file) {
  const { data } = await api.post(`/api/tasks/${taskId}/image-url`, {
    filename: file.name,
    contentType: file.type,
  });

  return data;
}

/**
 * Step 2: Upload the actual file directly to S3.
 * Do not use axios here because this URL is an external S3 presigned URL.
 */
export async function uploadImageFileToS3(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Image upload to S3 failed.");
  }
}

/**
 * Step 3: Tell backend which S3 key was uploaded.
 */
export async function saveTaskImageKey(taskId, imageOriginalKey) {
  const { data } = await api.patch(`/api/tasks/${taskId}/image`, {
    imageOriginalKey,
  });

  return extractTask(data);
}

/**
 * Full flow used by Create Task modal.
 */
export async function uploadTaskImage(taskId, file) {
  const { uploadUrl, key } = await getTaskImageUploadUrl(taskId, file);

  await uploadImageFileToS3(uploadUrl, file);

  const updatedTask = await saveTaskImageKey(taskId, key);

  return updatedTask;
}

export async function getTaskImageViewUrl(taskId) {
  const { data } = await api.get(`/api/tasks/${taskId}/image-url`);
  return data;
}