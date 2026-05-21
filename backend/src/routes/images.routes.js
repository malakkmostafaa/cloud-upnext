import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireEmployeeOrManager } from "../middleware/requireEmployeeOrManager.js";
import {
  generateTaskImageUploadUrl,
  saveTaskImage,
  removeTaskImage,
  generateTaskImageViewUrl,
} from "../services/images.service.js";
import { getTaskById } from "../services/tasks.service.js";

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

const router = express.Router();

router.get("/image-routes-test", (req, res) => {
  res.json({
    message: "Image routes are mounted",
  });
});

router.post(
  "/tasks/:taskId/image-url",
  requireAuth,
  requireEmployeeOrManager,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { filename, contentType } = req.body;

      const task = await getTaskById(taskId);

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      if (!canUserAccessTask(req.user, task)) {
        return res.status(403).json({
          message: "Forbidden: you cannot upload an image for this task.",
        });
      }

      const result = await generateTaskImageUploadUrl({
        taskId,
        filename,
        contentType,
      });

      return res.status(200).json({
        message: "Upload URL generated successfully.",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/tasks/:taskId/image",
  requireAuth,
  requireEmployeeOrManager,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { imageOriginalKey } = req.body;

      const task = await getTaskById(taskId);

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      if (!canUserAccessTask(req.user, task)) {
        return res.status(403).json({
          message: "Forbidden: you cannot update this task image.",
        });
      }

      const updatedTask = await saveTaskImage({
        taskId,
        imageOriginalKey,
      });

      return res.status(200).json({
        message: "Task image saved successfully.",
        task: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/tasks/:taskId/image-url",
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
          message: "Forbidden: you cannot view this task image.",
        });
      }

      const result = await generateTaskImageViewUrl(task);

      return res.status(200).json({
        message: result.imageUrl
          ? "Image URL generated successfully."
          : "Task has no image.",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/tasks/:taskId/image",
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
          message: "Forbidden: you cannot delete this task image.",
        });
      }

      const updatedTask = await removeTaskImage(taskId);

      return res.status(200).json({
        message: "Task image reference removed successfully.",
        task: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;