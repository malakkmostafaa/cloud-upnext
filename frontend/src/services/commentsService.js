import api from "../api/api";

function extractComments(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.comments)) return data.comments;
  return [];
}

export async function listTaskComments(taskId) {
  const { data } = await api.get(`/api/tasks/${taskId}/comments`);
  return extractComments(data);
}

export async function createTaskComment(taskId, text) {
  const { data } = await api.post(`/api/tasks/${taskId}/comments`, {
    text,
  });

  return data.comment || data;
}