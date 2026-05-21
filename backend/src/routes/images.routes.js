import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import {
  generateTaskImageUploadUrl,
  saveTaskImage,
  removeTaskImage,
} from "../services/images.service.js";
import { getTaskById } from "../services/tasks.service.js";
import { canAccessTask } from "../utils/canAccessTask.js";

const router = express.Router();

/**
 * Step 1:
 * Frontend asks backend for a presigned S3 upload URL.
 */
router.post("/tasks/:taskId/image-url", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { filename, contentType } = req.body;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({
        message: "Forbidden: you cannot upload an image for this task",
      });
    }

    const result = await generateTaskImageUploadUrl({
      taskId,
      filename,
      contentType,
    });

    return res.json({
      message: "Upload URL generated successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Step 2:
 * After frontend uploads to S3, it tells backend which S3 key was uploaded.
 */
router.patch("/tasks/:taskId/image", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { imageOriginalKey } = req.body;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({
        message: "Forbidden: you cannot update this task image",
      });
    }

    const updatedTask = await saveTaskImage({
      taskId,
      imageOriginalKey,
    });

    return res.json({
      message: "Task image saved successfully",
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Removes the image reference from the task.
 * The old image key is kept in imageVersions for history.
 */
router.delete("/tasks/:taskId/image", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({
        message: "Forbidden: you cannot delete this task image",
      });
    }

    const updatedTask = await removeTaskImage(taskId);

    return res.json({
      message: "Task image reference removed successfully",
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
});

export default router;