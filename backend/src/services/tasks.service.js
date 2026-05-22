import { randomUUID } from "crypto";
import { ApiError } from "../utils/errors.js";
import { getProjectById } from "./projects.service.js";
import { publishTaskAssignedEvent } from "./notifications.service.js";

import { docClient } from "../db/dynamo.js";
import { Tables, TaskIndexes } from "../config/tables.js";

import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const TaskStatus = {
  TO_DO: "TO_DO",
};

const Role = {
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
};

/**
 * Gets one task by ID.
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
 */
export async function createTask(input, createdBy) {
  const project = await getProjectById(input.projectId);

  if (!project) {
    throw ApiError.badRequest(
      "projectId does not reference an existing project"
    );
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

    attachments: [],

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

async function queryTasksByTeam(teamId) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.TASKS,
      IndexName: TaskIndexes.BY_TEAM,
      KeyConditionExpression: "teamId = :teamId",
      ExpressionAttributeValues: {
        ":teamId": teamId,
      },
    })
  );

  return result.Items || [];
}

/**
 * Lists tasks with server-side team isolation.
 */
export async function listTasks({ role, teamId, filterTeamId }) {
  const normalizedRole = role?.toUpperCase();
  const normalizedTeamId = teamId?.trim();
  const normalizedFilterTeamId = filterTeamId?.trim();

  const isManager =
    normalizedRole === "MANAGER" || normalizedRole === "ADMIN";


  // EMPLOYEE
  if (!isManager) {
    if (!normalizedTeamId) return [];
    return queryTasksByTeam(normalizedTeamId);
  }

  if (normalizedFilterTeamId && normalizedFilterTeamId !== "all") {
    return queryTasksByTeam(normalizedFilterTeamId);
  }

  // MANAGER GET ALL TASKS
  const result = await docClient.send(
    new ScanCommand({
      TableName: Tables.TASKS,
    })
  );

  console.log("SCAN RESULT:", result.Items);

  return result.Items || [];
}

/**
 * Updates a task.
 */
export async function updateTask(
  taskId,
  patch,
  actor,
  actorEmail
) {
  const current = await getTaskById(taskId);

  if (!current) {
    throw ApiError.notFound("Task not found");
  }

  if (Object.keys(patch).length === 0) {
    return current;
  }

  if (
    patch.projectId &&
    patch.projectId !== current.projectId
  ) {
    const project =
      await getProjectById(
        patch.projectId
      );

    if (!project) {
      throw ApiError.badRequest(
        "projectId does not reference an existing project"
      );
    }
  }

  const now = new Date().toISOString();

  const updated = {
    ...current,
    ...patch,
    updatedAt: now,
  };

  // STATUS HISTORY
  if (
    patch.status &&
    patch.status !== current.status
  ) {
    updated.statusHistory = [
      ...(current.statusHistory || []),
      {
        status: patch.status,
        by: actor,
        at: now,
      },
    ];
  }

  // UPDATE TASK
  await docClient.send(
    new PutCommand({
      TableName: Tables.TASKS,
      Item: updated,
      ConditionExpression:
        "attribute_exists(taskId)",
    })
  );

  // AUDIT LOG
 // AUDIT LOG
if (
  patch.status &&
  patch.status !== current.status
) {
  await docClient.send(
    new PutCommand({
      TableName: Tables.AUDIT_LOG,
      Item: {
        logId: randomUUID(),
        taskId,
        taskTitle: current.title,
        changedBy: actorEmail || actor,
        oldStatus: current.status,
        newStatus: patch.status,
        timestamp: now,
      },
    })
  );
}

  return updated;
}

/**
 * Permanently deletes a task.
 */
export async function deleteTask(taskId) {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: Tables.TASKS,
        Key: { taskId },
        ConditionExpression:
          "attribute_exists(taskId)",
      })
    );
  } catch (error) {
    if (
      error.name ===
      "ConditionalCheckFailedException"
    ) {
      throw ApiError.notFound(
        "Task not found"
      );
    }

    throw error;
  }
}