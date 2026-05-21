import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireManager } from "../middleware/requireManager.js";

import {
  listUsers,
  saveUser,
  assignUserToTeam,
} from "../services/users.service.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// GET USERS FROM DYNAMODB
router.get("/users", requireAuth, requireManager, async (req, res, next) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// SAVE CURRENT LOGGED-IN USER TO DYNAMODB
router.post("/users/sync-me", requireAuth, async (req, res, next) => {
  try {
    const savedUser = await saveUser({
      username: req.user.username || req.user.email,
      email: req.user.email,
      role: req.user.role,
      teamId: req.user.teamId,
      teamName: req.user.teamName,
    });

    res.status(201).json(savedUser);
  } catch (err) {
    next(err);
  }
});

// ASSIGN USER TO TEAM
router.put(
  "/users/:username/team",
  requireAuth,
  requireManager,
  async (req, res, next) => {
    try {
      const { username } = req.params;
      const { teamId, teamName } = req.body;

      if (!teamId || !teamName) {
        return res.status(400).json({
          message: "teamId and teamName are required",
        });
      }

      const updatedUser = await assignUserToTeam(username, teamId, teamName);

      res.json({
        message: "User assigned to team successfully",
        user: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;