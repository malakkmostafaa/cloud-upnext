import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireManager } from "../middleware/requireManager.js";
import { requireEmployeeOrManager } from "../middleware/requireEmployeeOrManager.js";
import { Role } from "../config/constants.js";
import { ApiError } from "../utils/errors.js";
import {
  validateTaskPayload,
  validateTaskUpdatePayload,
} from "../utils/validate.js";
import {
  createTask,
  getTaskById,
  listTasks,
  updateTask,
  deleteTask,
} from "../services/tasks.service.js";

const router = express.Router();

function isManager(user) {
  return user.role === Role.MANAGER || user.role === Role.ADMIN;
}

// CREATE TASK — manager only.
router.post("/tasks", requireAuth, requireManager, async (req, res, next) => {
  try {
    const payload = validateTaskPayload(req.body);
    const task = await createTask(payload, req.user.userId);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// LIST TASKS — TASK-03 / TASK-04 / TASK-05.
// Managers see all tasks (or one team via ?teamId=). Employees see only
// their own team's tasks; the query param is ignored for them.
router.get(
  "/tasks",
  requireAuth,
  requireEmployeeOrManager,
  async (req, res, next) => {
    try {
      const tasks = await listTasks({
        role: req.user.role,
        teamId: req.user.teamId,
        filterTeamId: req.query.teamId,
      });
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }
);

// GET ONE TASK — TASK-07.
// Team isolation: an employee cannot fetch another team's task by ID.
router.get(
  "/tasks/:id",
  requireAuth,
  requireEmployeeOrManager,
  async (req, res, next) => {
    try {
      const task = await getTaskById(req.params.id);

      if (!task) {
        throw ApiError.notFound("Task not found");
      }

      if (!isManager(req.user) && task.teamId !== req.user.teamId) {
        throw ApiError.forbidden("You cannot view tasks from another team");
      }

      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

// EDIT TASK — TASK-08, manager only.
router.put(
  "/tasks/:id",
  requireAuth,
  requireManager,
  async (req, res, next) => {
    try {
      const patch = validateTaskUpdatePayload(req.body);
      const task = await updateTask(req.params.id, patch, req.user.userId);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE TASK STATUS — managers, or the employee the task is assigned to.
// Spec: "Employees ... can update status of tasks assigned to them."
router.patch(
  "/tasks/:id/status",
  requireAuth,
  requireEmployeeOrManager,
  async (req, res, next) => {
    try {
      const patch = validateTaskUpdatePayload({ status: req.body?.status });

      if (patch.status === undefined) {
        throw ApiError.badRequest("status is required");
      }

      const task = await getTaskById(req.params.id);

      if (!task) {
        throw ApiError.notFound("Task not found");
      }

      // Managers may move any task; an employee only their own assigned task.
      // Tasks store the assignee's email as `assigneeId`.
      const assignedToMe =
        (task.assigneeId || "").toLowerCase() ===
        (req.user.email || "").toLowerCase();

      if (!isManager(req.user) && !assignedToMe) {
        throw ApiError.forbidden(
          "You can only update the status of tasks assigned to you"
        );
      }

      const updated = await updateTask(
        req.params.id,
        { status: patch.status },
        req.user.userId
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE TASK — TASK-09, manager only.
router.delete(
  "/tasks/:id",
  requireAuth,
  requireManager,
  async (req, res, next) => {
    try {
      await deleteTask(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;