import express from "express";
import { mockUsers } from "../data/mockData.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireManager } from "../middleware/requireManager.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.get("/users", requireAuth, requireManager, (req, res) => {
  res.json(mockUsers);
});

export default router;