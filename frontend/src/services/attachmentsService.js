import api from "../api/api";

export async function getAttachmentUploadUrl(taskId, file) {
  const { data } = await api.post(
    `/api/tasks/${taskId}/attachments/upload-url`,
    {
      filename: file.name,
      contentType: file.type,
    }
  );

  return data;
}

export async function uploadAttachmentToS3(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Attachment upload to S3 failed.");
  }
}

export async function saveTaskAttachment(taskId, file, key) {
  const { data } = await api.post(`/api/tasks/${taskId}/attachments`, {
    key,
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });

  return data;
}

export async function uploadTaskAttachment(taskId, file) {
  const { uploadUrl, key } = await getAttachmentUploadUrl(taskId, file);

  await uploadAttachmentToS3(uploadUrl, file);

  const result = await saveTaskAttachment(taskId, file, key);

  return result;
}

export async function getAttachmentViewUrl(taskId, attachmentId) {
  const { data } = await api.get(
    `/api/tasks/${taskId}/attachments/${attachmentId}/url`
  );

  return data;
}

export async function deleteTaskAttachment(taskId, attachmentId) {
  const { data } = await api.delete(
    `/api/tasks/${taskId}/attachments/${attachmentId}`
  );

  return data;
}