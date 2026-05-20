import { ApiError } from "./errors.js";
import { TaskStatus, TaskPriority } from "../config/constants.js";

function isNonEmptyString(v, max = Infinity) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

function isOptionalString(v, max = Infinity) {
  return v === undefined || v === null || (typeof v === "string" && v.length <= max);
}

function isIsoDate(v) {
  if (typeof v !== "string") return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

export function validateProjectPayload(body, { partial = false } = {}) {
  const errors = [];
  const { name, description } = body || {};

  if (partial) {
    if (name !== undefined && !isNonEmptyString(name, 200)) {
      errors.push("name must be a non-empty string up to 200 chars");
    }
    if (!isOptionalString(description, 5000)) {
      errors.push("description must be a string up to 5000 chars");
    }
  } else {
    if (!isNonEmptyString(name, 200)) {
      errors.push("name is required (1-200 chars)");
    }
    if (!isOptionalString(description, 5000)) {
      errors.push("description must be a string up to 5000 chars");
    }
  }

  if (errors.length) throw ApiError.badRequest("Invalid project payload", errors);

  const result = {};
  if (name !== undefined) result.name = name.trim();
  if (description !== undefined) result.description = description ?? null;
  return result;
}

export function validateTaskPayload(body) {
  const errors = [];
  const {
    title,
    description,
    priority,
    deadline,
    assigneeId,
    teamId,
    projectId,
    imageKey,
  } = body || {};

  if (!isNonEmptyString(title, 200)) errors.push("title is required (1-200 chars)");
  if (!isOptionalString(description, 5000))
    errors.push("description must be a string up to 5000 chars");

  if (!Object.values(TaskPriority).includes(priority))
    errors.push(`priority must be one of ${Object.values(TaskPriority).join(", ")}`);

  if (!isIsoDate(deadline)) errors.push("deadline must be a valid ISO date string");

  if (!isNonEmptyString(assigneeId)) errors.push("assigneeId is required");
  if (!isNonEmptyString(teamId)) errors.push("teamId is required");
  if (!isNonEmptyString(projectId)) errors.push("projectId is required");
  if (!isOptionalString(imageKey, 1024))
    errors.push("imageKey must be a string up to 1024 chars");

  if (errors.length) throw ApiError.badRequest("Invalid task payload", errors);

  return {
    title: title.trim(),
    description: description ?? null,
    priority,
    deadline: new Date(deadline).toISOString(),
    assigneeId,
    teamId,
    projectId,
    imageKey: imageKey ?? null,
  };
}

export { TaskStatus };
