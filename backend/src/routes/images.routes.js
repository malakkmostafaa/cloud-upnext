const express = require("express");
const {
  generateTaskImageUploadUrl,
  saveTaskImage,
  removeTaskImage,
} = require("../services/images.service");
const { getTaskById } = require("../services/tasks.service");
const { canAccessTask } = require("../utils/taskAccess");
const mockAuth = require("../middleware/mockAuth");

const router = express.Router();

router.post("/tasks/:taskId/image-url", mockAuth, async (req, res, next) => {
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

    res.json({
      message: "Upload URL generated successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/tasks/:taskId/image", mockAuth, async (req, res, next) => {
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

    res.json({
      message: "Task image updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/tasks/:taskId/image", mockAuth, async (req, res, next) => {
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

    res.json({
      message: "Task image reference removed successfully. Previous image retained in S3 version history.",
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;