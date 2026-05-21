import { randomUUID } from "crypto";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

import { docClient } from "../db/dynamo.js";
import { Tables } from "../config/tables.js";
import { TaskStatus } from "../config/constants.js";
import { ApiError } from "../utils/errors.js";
import { getProjectById } from "./projects.service.js";
import { publishTaskAssignedEvent } from "./notifications.service.js";

/**
 * Gets one task by ID.
 * Used by task routes and image routes.
 *
 * @param {string} taskId
 * @returns {Promise<object|null>}
 */
export async function getTaskById(taskId) {
  if (!taskId) {
    throw ApiError.badRequest("taskId is required");
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.TASKS,
      Key: { taskId },
    })
  );

  return result.Item || null;
}

/**
 * Creates a task.
 * Caller must have already validated the payload and authorized the request.
 *
 * Manager-only route should call this service.
 *
 * @param {object} input - validated task fields
 * @param {string} createdBy - Cognito sub of the manager creating the task
 */
export async function createTask(input, createdBy) {
  const project = await getProjectById(input.projectId);

  if (!project) {
    throw ApiError.badRequest("projectId does not reference an existing project");
  }

  const now = new Date().toISOString();

  const task = {
    taskId: randomUUID(),

    projectId: input.projectId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    deadline: input.deadline,

    status: TaskStatus.TO_DO,

    assigneeId: input.assigneeId,
    teamId: input.teamId,

    imageOriginalKey: input.imageOriginalKey || "",
    imageResizedKey: input.imageResizedKey || "",
    imageVersions: [],

    createdBy,
    createdAt: now,
    updatedAt: now,

    statusHistory: [
      {
        status: TaskStatus.TO_DO,
        by: createdBy,
        at: now,
      },
    ],
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.TASKS,
      Item: task,
      ConditionExpression: "attribute_not_exists(taskId)",
    })
  );

  let notification = null;

  try {
    notification = await publishTaskAssignedEvent({
      taskId: task.taskId,
      projectId: task.projectId,
      title: task.title,
      priority: task.priority,
      deadline: task.deadline,
      assigneeId: task.assigneeId,
      teamId: task.teamId,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
    });
  } catch (error) {
    console.error("Failed to publish TASK_ASSIGNED SNS event:", error);

    notification = {
      published: false,
      error: error.message,
    };
  }

  return {
    ...task,
    notification,
  };
}