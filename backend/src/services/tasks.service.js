const { randomUUID } = require("crypto");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");

const docClient = require("../db/dynamo");
const { Tables } = require("../config/tables");
const { TaskStatus } = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { getProjectById } = require("./projects.service");

/**
 * Creates a task. Caller must have already validated the payload and
 * authorized the request (manager-only).
 *
 * @param {object} input  - validated task fields
 * @param {string} createdBy - cognito sub of the manager creating the task
 */
async function createTask(input, createdBy) {
  const project = await getProjectById(input.projectId);
  if (!project) throw ApiError.badRequest("projectId does not reference an existing project");

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
    imageKey: input.imageKey,
    createdBy,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      { status: TaskStatus.TO_DO, by: createdBy, at: now },
    ],
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.TASKS,
      Item: task,
      ConditionExpression: "attribute_not_exists(taskId)",
    })
  );

  // TODO(notifications-member): publish a TaskAssigned event to SNS here so
  // the assignee gets emailed and the worker Lambda records the metric.
  // Expected payload: { taskId, projectId, assigneeId, teamId, createdBy, createdAt }.

  return task;
}

module.exports = { createTask };
