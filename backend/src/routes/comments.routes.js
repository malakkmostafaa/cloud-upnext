const express = require("express");
const { createComment, getCommentsByTaskId } = require("../services/comments.service");
const { getTaskById } = require("../services/tasks.service");
const { canAccessTask } = require("../utils/taskAccess");
const mockAuth = require("../middleware/mockAuth");

const router = express.Router();

router.get("/tasks/:taskId/comments", mockAuth, async (req, res, next) => {
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
        message: "Forbidden: you cannot view comments for this task",
      });
    }

    const comments = await getCommentsByTaskId(taskId);

    res.json({
      comments,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/tasks/:taskId/comments", mockAuth, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({
        message: "Forbidden: you cannot comment on this task",
      });
    }

    const comment = await createComment({
      taskId,
      user: req.user,
      text,
    });

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;