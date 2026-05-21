import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireManager } from "../middleware/requireManager.js";
import { validateTaskPayload } from "../utils/validate.js";
import { createTask } from "../services/tasks.service.js";

const router = express.Router();

router.post("/tasks", requireAuth, requireManager, async (req, res, next) => {
  try {
    const payload = validateTaskPayload(req.body);
    const task = await createTask(payload, req.user.userId);

    return res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

export default router;