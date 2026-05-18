import express from "express";

import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
} from "../services/tasks.service.js";

const router = express.Router();

/**
 * GET ALL TASKS
 */
router.get("/", async (req, res) => {

  try {

    const tasks =
      await listTasks();

    res.json(tasks);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

});

/**
 * CREATE TASK
 */
router.post("/", async (req, res) => {

  try {

    const task =
      await createTask(
        req.body,
        "manager-demo"
      );

    res.status(201).json(task);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

});

/**
 * UPDATE TASK
 */
router.put("/:taskId", async (req, res) => {

  try {

    const updatedTask =
      await updateTask(
        req.params.taskId,
        req.body
      );

    res.json(updatedTask);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

});

/**
 * DELETE TASK
 */
router.delete("/:taskId", async (req, res) => {

  try {

    await deleteTask(
      req.params.taskId
    );

    res.json({
      message:
        "Task deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

});

export default router;