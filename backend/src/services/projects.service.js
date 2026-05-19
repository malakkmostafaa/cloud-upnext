import { randomUUID } from "crypto";

import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import { docClient } from "../db/dynamo.js";
import { Tables } from "../config/tables.js";
import { ApiError } from "../utils/errors.js";

// CREATE PROJECT
async function createProject({
  name,
  description,
  teamId,
  createdBy,
}) {
  const now = new Date().toISOString();

  const project = {
    projectId: randomUUID(),
    name,
    description: description ?? null,
    teamId: teamId || "all",
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.PROJECTS,
      Item: project,
      ConditionExpression: "attribute_not_exists(projectId)",
    })
  );

  return project;
}

// GET PROJECT BY ID
async function getProjectById(projectId) {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: Tables.PROJECTS,
      Key: { projectId },
    })
  );

  return Item || null;
}

// LIST PROJECTS
async function listProjects() {
  const { Items } = await docClient.send(
    new ScanCommand({
      TableName: Tables.PROJECTS,
    })
  );

  return Items || [];
}

// UPDATE PROJECT
async function updateProject(projectId, patch) {
  const fields = Object.keys(patch);

  if (fields.length === 0) {
    const existing = await getProjectById(projectId);

    if (!existing) {
      throw ApiError.notFound("Project not found");
    }

    return existing;
  }

  const ExpressionAttributeNames = {
    "#updatedAt": "updatedAt",
  };

  const ExpressionAttributeValues = {
    ":updatedAt": new Date().toISOString(),
  };

  const sets = ["#updatedAt = :updatedAt"];

  fields.forEach((field, i) => {
    const nameKey = `#f${i}`;
    const valueKey = `:v${i}`;

    ExpressionAttributeNames[nameKey] = field;
    ExpressionAttributeValues[valueKey] = patch[field];

    sets.push(`${nameKey} = ${valueKey}`);
  });

  try {
    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: Tables.PROJECTS,
        Key: { projectId },

        UpdateExpression: `SET ${sets.join(", ")}`,

        ConditionExpression: "attribute_exists(projectId)",

        ExpressionAttributeNames,
        ExpressionAttributeValues,

        ReturnValues: "ALL_NEW",
      })
    );

    return Attributes;
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      throw ApiError.notFound("Project not found");
    }

    throw err;
  }
}

// DELETE PROJECT
async function deleteProject(projectId) {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: Tables.PROJECTS,
        Key: { projectId },

        ConditionExpression: "attribute_exists(projectId)",
      })
    );
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      throw ApiError.notFound("Project not found");
    }

    throw err;
  }
}

export {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
};