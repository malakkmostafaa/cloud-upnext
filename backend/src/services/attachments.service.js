import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

import { s3Client } from "../aws/s3.js";
import { docClient } from "../db/dynamo.js";
import { Tables } from "../config/tables.js";

const ORIGINAL_IMAGES_BUCKET = process.env.ORIGINAL_IMAGES_BUCKET;
const RESIZED_IMAGES_BUCKET = process.env.RESIZED_IMAGES_BUCKET;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeFilename(filename = "") {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function isImageContentType(contentType = "") {
  return ["image/jpeg", "image/png", "image/webp"].includes(contentType);
}

function isAllowedFileType(contentType = "") {
  return ALLOWED_FILE_TYPES.includes(contentType);
}

function buildResizedKey(originalKey) {
  if (!originalKey) return "";
  return originalKey.replace("/attachments/", "/attachments-resized/");
}

async function getTaskByIdForAttachment(taskId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.TASKS,
      Key: { taskId },
    })
  );

  return result.Item || null;
}

function assertAttachmentKeyBelongsToTask(taskId, key) {
  const expectedPrefix = `tasks/${taskId}/attachments/`;

  if (!key.startsWith(expectedPrefix)) {
    throw createError("Attachment key does not belong to this task.", 400);
  }
}

async function assertObjectExists(bucket, key) {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch {
    throw createError(
      "Attachment was not found in S3. Upload the file before saving it.",
      400
    );
  }
}

async function objectExists(bucket, key) {
  if (!bucket || !key) return false;

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return true;
  } catch {
    return false;
  }
}

export async function generateAttachmentUploadUrl({
  taskId,
  filename,
  contentType,
}) {
  if (!ORIGINAL_IMAGES_BUCKET) {
    throw createError("ORIGINAL_IMAGES_BUCKET is not configured.", 500);
  }

  if (!taskId) {
    throw createError("taskId is required.", 400);
  }

  if (!filename) {
    throw createError("filename is required.", 400);
  }

  if (!contentType || !isAllowedFileType(contentType)) {
    throw createError(
      "Unsupported file type. Allowed: images, PDF, Word, Excel, and text files.",
      400
    );
  }

  const attachmentId = randomUUID();
  const safeFilename = sanitizeFilename(filename);
  const timestamp = Date.now();

  const key = `tasks/${taskId}/attachments/${timestamp}-${attachmentId}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: ORIGINAL_IMAGES_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 5,
  });

  return {
    uploadUrl,
    key,
    bucket: ORIGINAL_IMAGES_BUCKET,
    attachmentId,
    expiresIn: 300,
  };
}

export async function saveTaskAttachment({
  taskId,
  key,
  filename,
  contentType,
  size,
  uploadedBy,
}) {
  if (!taskId) {
    throw createError("taskId is required.", 400);
  }

  if (!key) {
    throw createError("key is required.", 400);
  }

  if (!filename) {
    throw createError("filename is required.", 400);
  }

  if (!contentType || !isAllowedFileType(contentType)) {
    throw createError("Unsupported file type.", 400);
  }

  assertAttachmentKeyBelongsToTask(taskId, key);
  await assertObjectExists(ORIGINAL_IMAGES_BUCKET, key);

  const task = await getTaskByIdForAttachment(taskId);

  if (!task) {
    throw createError("Task not found.", 404);
  }

  const now = new Date().toISOString();
  const isImage = isImageContentType(contentType);

  const attachment = {
    attachmentId: randomUUID(),
    originalKey: key,
    resizedKey: isImage ? buildResizedKey(key) : "",
    bucket: ORIGINAL_IMAGES_BUCKET,
    resizedBucket: isImage ? RESIZED_IMAGES_BUCKET || "" : "",
    filename,
    contentType,
    size: Number(size) || 0,
    type: isImage ? "IMAGE" : "FILE",
    uploadedBy: uploadedBy?.userId || "",
    uploadedByEmail: uploadedBy?.email || "",
    uploadedAt: now,
    deletedAt: null,
  };

  const previousAttachments = Array.isArray(task.attachments)
    ? task.attachments
    : [];

  const attachments = [attachment, ...previousAttachments];

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.TASKS,
      Key: { taskId },
      UpdateExpression:
        "SET attachments = :attachments, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":attachments": attachments,
        ":updatedAt": now,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return {
    task: result.Attributes,
    attachment,
  };
}

export async function generateAttachmentViewUrl({ task, attachmentId }) {
  if (!task) {
    throw createError("Task is required.", 400);
  }

  const attachments = Array.isArray(task.attachments) ? task.attachments : [];

  const attachment = attachments.find(
    (item) => item.attachmentId === attachmentId && !item.deletedAt
  );

  if (!attachment) {
    throw createError("Attachment not found.", 404);
  }

  let bucket = ORIGINAL_IMAGES_BUCKET;
  let key = attachment.originalKey;
  let source = "original";
  let resizedExists = false;

  if (
    attachment.type === "IMAGE" &&
    attachment.resizedKey &&
    RESIZED_IMAGES_BUCKET
  ) {
    resizedExists = await objectExists(
      RESIZED_IMAGES_BUCKET,
      attachment.resizedKey
    );

    if (resizedExists) {
      bucket = RESIZED_IMAGES_BUCKET;
      key = attachment.resizedKey;
      source = "resized";
    }
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 10,
  });

  return {
    url,
    bucket,
    key,
    source,
    resizedExists,
    expiresIn: 600,
    attachment,
  };
}

export async function removeTaskAttachment({ taskId, attachmentId }) {
  if (!taskId) {
    throw createError("taskId is required.", 400);
  }

  if (!attachmentId) {
    throw createError("attachmentId is required.", 400);
  }

  const task = await getTaskByIdForAttachment(taskId);

  if (!task) {
    throw createError("Task not found.", 404);
  }

  const now = new Date().toISOString();

  const attachments = Array.isArray(task.attachments) ? task.attachments : [];

  const target = attachments.find((item) => item.attachmentId === attachmentId);

  if (!target) {
    throw createError("Attachment not found.", 404);
  }

  const updatedAttachments = attachments.map((item) =>
    item.attachmentId === attachmentId
      ? {
          ...item,
          deletedAt: now,
        }
      : item
  );

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.TASKS,
      Key: { taskId },
      UpdateExpression:
        "SET attachments = :attachments, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":attachments": updatedAttachments,
        ":updatedAt": now,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

export async function hardDeleteAttachmentFromS3(attachment) {
  if (!attachment?.originalKey) return;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: ORIGINAL_IMAGES_BUCKET,
      Key: attachment.originalKey,
    })
  );

  if (attachment.resizedKey && RESIZED_IMAGES_BUCKET) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: RESIZED_IMAGES_BUCKET,
        Key: attachment.resizedKey,
      })
    );
  }
}