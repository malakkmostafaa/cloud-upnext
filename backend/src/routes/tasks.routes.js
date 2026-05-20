import express from "express";
import crypto from "crypto";

import {
  authenticateToken,
} from "../middleware/auth.middleware.js";

import {
  createAuditLog,
} from "../services/audit.service.js";

const { requireAuth, requireRole } = require("../middleware/auth");
const { Role } = require("../config/constants");
const { validateTaskPayload } = require("../utils/validate");
const tasksService = require("../services/tasks.service");

const router =
  express.Router();

/**
 * GET TASKS
 */
router.get(
  "/",
  authenticateToken,
  async (req, res) => {

    try {

      const tasks =
        await listTasks();

      console.log(
        "USER:",
        req.user
      );

      console.log(
        "TASKS:",
        tasks
      );

      return res.json(tasks);

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message:
          error.message,

      });

    }

  }
);

/**
 * CREATE TASK
 */
router.post(
  "/",
  authenticateToken,
  async (req, res) => {

    try {

      if (

        req.user.role
          ?.toLowerCase() !==
          "manager"

        &&

        req.user.role
          ?.toLowerCase() !==
          "admin"

      ) {

        return res.status(403).json({

          message:
            "Only managers can create tasks",

        });

      }

      const task =
        await createTask(
          req.body,
          req.user.email
        );

      res.status(201).json(
        task
      );

    } catch (error) {

      console.error(
        "CREATE TASK ERROR:",
        error
      );

      res.status(500).json({
        message:
          error.message,
      });

    }

  }
);

/**
 * UPDATE TASK
 */
router.put(
  "/:taskId",
  authenticateToken,
  async (req, res) => {

    try {

      const isManager =

        req.user.role
          ?.toLowerCase() ===
          "manager"

        ||

        req.user.role
          ?.toLowerCase() ===
          "admin";

      /**
       * GET ALL TASKS
       */
      const tasks =
        await listTasks();

      /**
       * FIND TASK
       */
      const existingTask =
        tasks.find(

          (task) =>

            task.taskId ===
            req.params.taskId

        );

      if (!existingTask) {

        return res.status(404).json({

          message:
            "Task not found",

        });

      }

      /**
       * EMPLOYEE RULES
       */
      if (!isManager) {

        /**
         * ONLY OWN TASKS
         */
        const isOwnTask =

          existingTask.assigneeName
            ?.toLowerCase()
            .trim()

          ===

          req.user.name
            ?.toLowerCase()
            .trim();

        if (!isOwnTask) {

          return res.status(403).json({

            message:
              "You can only update your own tasks",

          });

        }

        /**
         * EMPLOYEE CAN ONLY
         * CHANGE STATUS
         */
        req.body = {

          ...existingTask,

          status:
            req.body.status,

        };

      }

      /**
       * SAVE OLD STATUS
       */
      const oldStatus =
        existingTask.status;

      /**
       * UPDATE TASK
       */
      const updatedTask =
        await updateTask(
          req.params.taskId,
          req.body
        );

      /**
       * CREATE AUDIT LOG
       */
      if (

        oldStatus !==
        updatedTask?.status

      ) {

        await createAuditLog({

          logId:
            crypto.randomUUID(),

          taskId:
            updatedTask.taskId,

          taskTitle:
            updatedTask.title,

          changedBy:
            req.user.name,

          oldStatus:
            oldStatus,

          newStatus:
            updatedTask.status,

          timestamp:
            new Date().toISOString(),

        });

      }

      res.json(
        updatedTask
      );

    } catch (error) {

      console.error(
        "UPDATE TASK ERROR:",
        error
      );

      res.status(500).json({

        message:
          error.message,

      });

    }

  }
);

/**
 * DELETE TASK
 */
router.delete(
  "/:taskId",
  authenticateToken,
  async (req, res) => {

    try {

      if (

        req.user.role
          ?.toLowerCase() !==
          "manager"

        &&

        req.user.role
          ?.toLowerCase() !==
          "admin"

      ) {

        return res.status(403).json({

          message:
            "Only managers can delete tasks",

        });

      }

      await deleteTask(
        req.params.taskId
      );

      res.json({

        message:
          "Task deleted successfully",

      });

    } catch (error) {

      console.error(
        "DELETE TASK ERROR:",
        error
      );

      res.status(500).json({
        message:
          error.message,
      });

    }

  }
);

export default router;
