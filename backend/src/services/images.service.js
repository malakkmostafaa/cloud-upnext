const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require("../aws/s3");
const docClient = require("../db/dynamo");

const TASKS_TABLE = process.env.TASKS_TABLE || "upnext-tasks";
const ORIGINAL_IMAGES_BUCKET = process.env.ORIGINAL_IMAGES_BUCKET;

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getExtension(filename = "") {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "jpg";
}

function isAllowedImageType(contentType) {
  return ["image/jpeg", "image/png", "image/webp"].includes(contentType);
}

async function generateTaskImageUploadUrl({ taskId, filename, contentType }) {
  if (!ORIGINAL_IMAGES_BUCKET) {
    const error = new Error("ORIGINAL_IMAGES_BUCKET is not configured");
    error.statusCode = 500;
    throw error;
  }

  if (!filename) {
    const error = new Error("filename is required");
    error.statusCode = 400;
    throw error;
  }

  if (!contentType || !isAllowedImageType(contentType)) {
    const error = new Error("Only JPEG, PNG, and WEBP images are allowed");
    error.statusCode = 400;
    throw error;
  }

  const safeFilename = sanitizeFilename(filename);
  const extension = getExtension(safeFilename);
  const timestamp = Date.now();

  const key = `tasks/${taskId}/original/${timestamp}-${safeFilename || `image.${extension}`}`;

  const command = new PutObjectCommand({
    Bucket: ORIGINAL_IMAGES_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 5, // 5 minutes
  });

  return {
    uploadUrl,
    key,
    bucket: ORIGINAL_IMAGES_BUCKET,
    expiresIn: 300,
  };
}

async function getTaskById(taskId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
    })
  );

  return result.Item || null;
}

async function saveTaskImage({ taskId, imageOriginalKey }) {
  if (!imageOriginalKey) {
    const error = new Error("imageOriginalKey is required");
    error.statusCode = 400;
    throw error;
  }

  const task = await getTaskById(taskId);

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  const previousImageKey = task.imageOriginalKey || null;
  const previousVersions = Array.isArray(task.imageVersions) ? task.imageVersions : [];

  const newImageVersions = previousImageKey
    ? [
        ...previousVersions,
        {
          key: previousImageKey,
          replacedAt: new Date().toISOString(),
        },
      ]
    : previousVersions;

  const updatedAt = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression:
        "SET imageOriginalKey = :imageOriginalKey, imageVersions = :imageVersions, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":imageOriginalKey": imageOriginalKey,
        ":imageVersions": newImageVersions,
        ":updatedAt": updatedAt,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

async function removeTaskImage(taskId) {
  const task = await getTaskById(taskId);

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  const previousImageKey = task.imageOriginalKey || null;
  const previousVersions = Array.isArray(task.imageVersions) ? task.imageVersions : [];

  const newImageVersions = previousImageKey
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
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression:
        "SET imageOriginalKey = :emptyImage, imageResizedKey = :emptyResized, imageVersions = :imageVersions, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":emptyImage": "",
        ":emptyResized": "",
        ":imageVersions": newImageVersions,
        ":updatedAt": updatedAt,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

module.exports = {
  generateTaskImageUploadUrl,
  saveTaskImage,
  removeTaskImage,
};