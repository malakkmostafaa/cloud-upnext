const { randomUUID } = require("crypto");
const {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const docClient = require("../db/dynamo");
const { Tables } = require("../config/tables");
const { ApiError } = require("../utils/errors");

async function createProject({ name, description, createdBy }) {
  const now = new Date().toISOString();
  const project = {
    projectId: randomUUID(),
    name,
    description: description ?? null,
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

async function getProjectById(projectId) {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: Tables.PROJECTS,
      Key: { projectId },
    })
  );
  return Item || null;
}

async function listProjects() {
  // Projects are company-wide (managers create them, all roles can read).
  // Volume is low, so a Scan is acceptable here.
  const { Items } = await docClient.send(
    new ScanCommand({ TableName: Tables.PROJECTS })
  );
  return Items || [];
}

async function updateProject(projectId, patch) {
  const fields = Object.keys(patch);
  if (fields.length === 0) {
    const existing = await getProjectById(projectId);
    if (!existing) throw ApiError.notFound("Project not found");
    return existing;
  }

  const ExpressionAttributeNames = { "#updatedAt": "updatedAt" };
  const ExpressionAttributeValues = { ":updatedAt": new Date().toISOString() };
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

module.exports = {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
};
