import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3Client } from "../aws/s3.js";
import { docClient } from "../db/dynamo.js";
import { Tables } from "../config/tables.js";

const ORIGINAL_IMAGES_BUCKET = process.env.ORIGINAL_IMAGES_BUCKET;
const RESIZED_IMAGES_BUCKET = process.env.RESIZED_IMAGES_BUCKET;


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
function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeFilename(filename = "") {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getExtension(filename = "") {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "jpg";
}

function isAllowedImageType(contentType) {
  return ["image/jpeg", "image/png", "image/webp"].includes(contentType);
}

function buildResizedKey(originalKey) {
  if (!originalKey) return "";

  return originalKey.replace("/original/", "/resized/");
}

function assertImageKeyBelongsToTask(taskId, imageOriginalKey) {
  const expectedPrefix = `tasks/${taskId}/original/`;

  if (!imageOriginalKey.startsWith(expectedPrefix)) {
    throw createError("imageOriginalKey does not belong to this task", 400);
  }
}

async function getTaskByIdForImage(taskId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.TASKS,
      Key: { taskId },
    })
  );

  return result.Item || null;
}

async function assertOriginalImageExists(imageOriginalKey) {
  if (!ORIGINAL_IMAGES_BUCKET) {
    throw createError("ORIGINAL_IMAGES_BUCKET is not configured", 500);
  }

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: ORIGINAL_IMAGES_BUCKET,
        Key: imageOriginalKey,
      })
    );
  } catch (error) {
    throw createError(
      "Image was not found in S3. Upload the image before saving the key.",
      400
    );
  }
}

export async function generateTaskImageUploadUrl({
  taskId,
  filename,
  contentType,
}) {
  if (!ORIGINAL_IMAGES_BUCKET) {
    throw createError("ORIGINAL_IMAGES_BUCKET is not configured", 500);
  }

  if (!taskId) {
    throw createError("taskId is required", 400);
  }

  if (!filename) {
    throw createError("filename is required", 400);
  }

  if (!contentType || !isAllowedImageType(contentType)) {
    throw createError("Only JPEG, PNG, and WEBP images are allowed", 400);
  }

  const safeFilename = sanitizeFilename(filename);
  const extension = getExtension(safeFilename);
  const timestamp = Date.now();

  const finalFilename = safeFilename || `image.${extension}`;
  const key = `tasks/${taskId}/original/${timestamp}-${finalFilename}`;

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
    expiresIn: 300,
  };
}

export async function saveTaskImage({ taskId, imageOriginalKey }) {
  if (!taskId) {
    throw createError("taskId is required", 400);
  }

  if (!imageOriginalKey) {
    throw createError("imageOriginalKey is required", 400);
  }

  assertImageKeyBelongsToTask(taskId, imageOriginalKey);
  await assertOriginalImageExists(imageOriginalKey);

  const task = await getTaskByIdForImage(taskId);

  if (!task) {
    throw createError("Task not found", 404);
  }

  const previousImageKey = task.imageOriginalKey || null;

  const previousVersions = Array.isArray(task.imageVersions)
    ? task.imageVersions
    : [];

  const imageVersions = previousImageKey
    ? [
        ...previousVersions,
        {
          key: previousImageKey,
          replacedAt: new Date().toISOString(),
        },
      ]
    : previousVersions;

  const imageResizedKey = buildResizedKey(imageOriginalKey);
  const updatedAt = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.TASKS,
      Key: { taskId },
      UpdateExpression:
        "SET imageOriginalKey = :imageOriginalKey, imageResizedKey = :imageResizedKey, imageVersions = :imageVersions, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":imageOriginalKey": imageOriginalKey,
        ":imageResizedKey": imageResizedKey,
        ":imageVersions": imageVersions,
        ":updatedAt": updatedAt,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

export async function removeTaskImage(taskId) {
  if (!taskId) {
    throw createError("taskId is required", 400);
  }

  const task = await getTaskByIdForImage(taskId);

  if (!task) {
    throw createError("Task not found", 404);
  }

  const previousImageKey = task.imageOriginalKey || null;

  const previousVersions = Array.isArray(task.imageVersions)
    ? task.imageVersions
    : [];

  const imageVersions = previousImageKey
    ? [
        ...previousVersions,
        {
          key: previousImageKey,
          removedAt: new Date().toISOString(),
        },
      ]
    : previousVersions;

  const updatedAt = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.TASKS,
      Key: { taskId },
      UpdateExpression:
        "SET imageOriginalKey = :emptyImage, imageResizedKey = :emptyResized, imageVersions = :imageVersions, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":emptyImage": "",
        ":emptyResized": "",
        ":imageVersions": imageVersions,
        ":updatedAt": updatedAt,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

export async function generateTaskImageViewUrl(task) {
  if (!task) {
    throw createError("Task is required", 400);
  }

  if (!task.imageOriginalKey && !task.imageResizedKey) {
    return {
      imageUrl: null,
      key: null,
      bucket: null,
      source: null,
      resizedExists: false,
      expiresIn: 0,
    };
  }

  let bucket = ORIGINAL_IMAGES_BUCKET;
  let key = task.imageOriginalKey;
  let source = "original";
  let resizedExists = false;

  if (task.imageResizedKey && RESIZED_IMAGES_BUCKET) {
    resizedExists = await objectExists(
      RESIZED_IMAGES_BUCKET,
      task.imageResizedKey
    );

    if (resizedExists) {
      bucket = RESIZED_IMAGES_BUCKET;
      key = task.imageResizedKey;
      source = "resized";
    }
  }

  if (!key) {
    return {
      imageUrl: null,
      key: null,
      bucket: null,
      source: null,
      resizedExists,
      expiresIn: 0,
    };
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const imageUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 10,
  });

  return {
    imageUrl,
    key,
    bucket,
    source,
    resizedExists,
    expiresIn: 600,
  };
}