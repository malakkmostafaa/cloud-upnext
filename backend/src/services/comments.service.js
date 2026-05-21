import { randomUUID } from "crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import { docClient } from "../db/dynamo.js";
import { Tables } from "../config/tables.js";

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createComment({ taskId, user, text }) {
  if (!taskId) {
    throw createError("taskId is required", 400);
  }

  if (!user || !user.userId) {
    throw createError("Authenticated user is required", 401);
  }

  if (!text || !text.trim()) {
    throw createError("Comment text is required", 400);
  }

  const now = new Date().toISOString();

  const comment = {
    taskId,
    commentId: randomUUID(),

    authorId: user.userId,
    authorName: user.name || user.email || "Unknown user",
    authorEmail: user.email || "",

    text: text.trim(),

    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.COMMENTS,
      Item: comment,
      ConditionExpression: "attribute_not_exists(commentId)",
    })
  );

  return comment;
}

export async function getCommentsByTaskId(taskId) {
  if (!taskId) {
    throw createError("taskId is required", 400);
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.COMMENTS,
      KeyConditionExpression: "taskId = :taskId",
      ExpressionAttributeValues: {
        ":taskId": taskId,
      },
      ScanIndexForward: true,
    })
  );

  return result.Items || [];
}