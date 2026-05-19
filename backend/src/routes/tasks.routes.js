const express = require("express");

const { requireAuth, requireRole } = require("../middleware/auth");
const { Role } = require("../config/constants");
const { validateTaskPayload } = require("../utils/validate");
const tasksService = require("../services/tasks.service");

const router = express.Router();

// Member 2 owns task CREATION only.
// GET / PUT / DELETE on tasks belong to other team members.
router.post(
  "/tasks",
  requireAuth,
  requireRole(Role.MANAGER),
  async (req, res, next) => {
    try {
      const payload = validateTaskPayload(req.body);
      const task = await tasksService.createTask(payload, req.user.sub);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
