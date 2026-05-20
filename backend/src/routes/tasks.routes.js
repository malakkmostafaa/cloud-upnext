import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireManager } from "../middleware/requireManager.js";
import { validateTaskPayload } from "../utils/validate.js";
import { createTask } from "../services/tasks.service.js";

const router = express.Router();

// Member 2 owns task CREATION only.
// GET / PUT / DELETE on tasks belong to other team members.
router.post(
  "/tasks",
  requireAuth,
  requireManager,
  async (req, res, next) => {
    try {
      const payload = validateTaskPayload(req.body);
      const task = await createTask(payload, req.user.userId);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
