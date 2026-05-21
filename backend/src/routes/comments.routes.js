import express from "express";

import {
  createComment,
  getCommentsByTaskId,
} from "../services/comments.service.js";
import { getTaskById } from "../services/tasks.service.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireEmployeeOrManager } from "../middleware/requireEmployeeOrManager.js";

const router = express.Router();

function canUserAccessTask(user, task) {
  if (!user || !task) return false;

  const role = user.role?.toUpperCase();

  if (role === "ADMIN" || role === "MANAGER") {
    return true;
  }

  if (role === "EMPLOYEE") {
    return Boolean(user.teamId && task.teamId && user.teamId === task.teamId);
  }

  return false;
}

router.get(
  "/tasks/:taskId/comments",
  requireAuth,
  requireEmployeeOrManager,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;

      const task = await getTaskById(taskId);

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      if (!canUserAccessTask(req.user, task)) {
        return res.status(403).json({
          message: "Forbidden: you cannot view comments for this task.",
        });
      }

      const comments = await getCommentsByTaskId(taskId);

      return res.status(200).json({
        comments,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/tasks/:taskId/comments",
  requireAuth,
  requireEmployeeOrManager,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { text } = req.body;

      const task = await getTaskById(taskId);

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      if (!canUserAccessTask(req.user, task)) {
        return res.status(403).json({
          message: "Forbidden: you cannot comment on this task.",
        });
      }

      const comment = await createComment({
        taskId,
        user: req.user,
        text,
      });

      return res.status(201).json({
        message: "Comment created successfully.",
        comment,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;