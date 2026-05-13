const express = require("express");

const router = express.Router();

// GET comments for a task
router.get("/tasks/:taskId/comments", async (req, res, next) => {
  try {
    res.json({
      message: "Get comments route works",
      taskId: req.params.taskId,
      comments: [],
    });
  } catch (error) {
    next(error);
  }
});

// POST comment on a task
router.post("/tasks/:taskId/comments", async (req, res, next) => {
  try {
    const { text } = req.body;

    res.status(201).json({
      message: "Create comment route works",
      taskId: req.params.taskId,
      comment: {
        text,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;