import { ApiError } from "./errors.js";
const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

const TaskStatus = {
  TO_DO: "TO_DO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
};
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
    imageOriginalKey,
    imageResizedKey,
  } = body || {};

  if (!isNonEmptyString(title, 200)) {
    errors.push("title is required (1-200 chars)");
  }

  if (!isOptionalString(description, 5000)) {
    errors.push("description must be a string up to 5000 chars");
  }

  if (!Object.values(TaskPriority).includes(priority)) {
    errors.push(
      `priority must be one of ${Object.values(TaskPriority).join(", ")}`
    );
  }

  if (!isIsoDate(deadline)) {
    errors.push("deadline must be a valid ISO date string");
  }

  if (!isNonEmptyString(assigneeId)) {
    errors.push("assigneeId is required");
  }

  if (!isNonEmptyString(teamId)) {
    errors.push("teamId is required");
  }

  if (!isNonEmptyString(projectId)) {
    errors.push("projectId is required");
  }

  if (!isOptionalString(imageOriginalKey, 1024)) {
    errors.push("imageOriginalKey must be a string up to 1024 chars");
  }

  if (!isOptionalString(imageResizedKey, 1024)) {
    errors.push("imageResizedKey must be a string up to 1024 chars");
  }

  if (errors.length) {
    throw ApiError.badRequest("Invalid task payload", errors);
  }

  return {
    title: title.trim(),
    description: description ?? null,
    priority,
    deadline: new Date(deadline).toISOString(),
    assigneeId,
    teamId,
    projectId,
    imageOriginalKey: imageOriginalKey ?? "",
    imageResizedKey: imageResizedKey ?? "",
  };
}

/**
 * Validates a task EDIT payload. Every field is optional; only the supplied
 * fields are returned, normalized. Throws ApiError(400) on any invalid field.
 */
export function validateTaskUpdatePayload(body) {
  const errors = [];
  const b = body || {};
  const patch = {};

  if (b.title !== undefined) {
    if (!isNonEmptyString(b.title, 200)) {
      errors.push("title must be a non-empty string up to 200 chars");
    } else {
      patch.title = b.title.trim();
    }
  }

  if (b.description !== undefined) {
    if (!isOptionalString(b.description, 5000)) {
      errors.push("description must be a string up to 5000 chars");
    } else {
      patch.description = b.description ?? null;
    }
  }

  if (b.priority !== undefined) {
    if (!Object.values(TaskPriority).includes(b.priority)) {
      errors.push(`priority must be one of ${Object.values(TaskPriority).join(", ")}`);
    } else {
      patch.priority = b.priority;
    }
  }

  if (b.status !== undefined) {
    if (!Object.values(TaskStatus).includes(b.status)) {
      errors.push(`status must be one of ${Object.values(TaskStatus).join(", ")}`);
    } else {
      patch.status = b.status;
    }
  }

  if (b.deadline !== undefined) {
    if (!isIsoDate(b.deadline)) {
      errors.push("deadline must be a valid ISO date string");
    } else {
      patch.deadline = new Date(b.deadline).toISOString();
    }
  }

  if (b.assigneeId !== undefined) {
    if (!isNonEmptyString(b.assigneeId)) {
      errors.push("assigneeId must be a non-empty string");
    } else {
      patch.assigneeId = b.assigneeId;
    }
  }

  if (b.teamId !== undefined) {
    if (!isNonEmptyString(b.teamId)) {
      errors.push("teamId must be a non-empty string");
    } else {
      patch.teamId = b.teamId;
    }
  }

  if (b.projectId !== undefined) {
    if (!isNonEmptyString(b.projectId)) {
      errors.push("projectId must be a non-empty string");
    } else {
      patch.projectId = b.projectId;
    }
  }

  if (errors.length) throw ApiError.badRequest("Invalid task update payload", errors);

  return patch;
}

export { TaskStatus };
