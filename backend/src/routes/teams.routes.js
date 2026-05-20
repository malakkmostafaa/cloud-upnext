import express from "express";
import { randomUUID } from "crypto";
import {
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import { docClient } from "../db/dynamo.js";
import { Tables } from "../config/tables.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireManager } from "../middleware/requireManager.js";

const router = express.Router();

// GET TEAMS FROM DYNAMODB
router.get("/teams", requireAuth, requireManager, async (req, res, next) => {
  try {
    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: Tables.TEAMS,
      })
    );

    res.json(Items || []);
  } catch (err) {
    next(err);
  }
});

// CREATE TEAM IN DYNAMODB
router.post("/teams", requireAuth, requireManager, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Team name is required",
      });
    }

    const now = new Date().toISOString();

    const newTeam = {
      teamId: name.toLowerCase().trim().replace(/\s+/g, "-"),
      name,
      createdBy: req.user.email,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: Tables.TEAMS,
        Item: newTeam,
        ConditionExpression: "attribute_not_exists(teamId)",
      })
    );

    res.status(201).json(newTeam);
  } catch (err) {
    next(err);
  }
});

export default router;