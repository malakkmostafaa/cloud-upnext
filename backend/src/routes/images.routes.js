const express = require("express");

const router = express.Router();

// Generate upload URL placeholder
router.post("/tasks/:taskId/image-url", async (req, res, next) => {
  try {
    res.json({
      message: "Generate image upload URL route works",
      taskId: req.params.taskId,
    });
  } catch (error) {
    next(error);
  }
});

// Save/replace image reference placeholder
router.patch("/tasks/:taskId/image", async (req, res, next) => {
  try {
    res.json({
      message: "Update task image route works",
      taskId: req.params.taskId,
    });
  } catch (error) {
    next(error);
  }
});

// Delete image reference placeholder
router.delete("/tasks/:taskId/image", async (req, res, next) => {
  try {
    res.json({
      message: "Delete task image route works",
      taskId: req.params.taskId,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;