import express from "express";
import { mockTeams } from "../data/mockData.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireManager } from "../middleware/requireManager.js";

const router = express.Router();

router.get("/teams", requireAuth, requireManager, (req, res) => {
  res.json(mockTeams);
});

export default router;