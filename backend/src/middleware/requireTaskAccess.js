import { getTaskById } from "../services/tasks.service.js";

export async function requireTaskAccess(req, res, next) {
  try {
    const { taskId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const role = req.user.role?.toUpperCase();

    const canAccess =
      role === "ADMIN" ||
      role === "MANAGER" ||
      (role === "EMPLOYEE" &&
        req.user.teamId &&
        task.teamId &&
        req.user.teamId === task.teamId);

    if (!canAccess) {
      return res.status(403).json({
        message: "Forbidden: you cannot access this task.",
      });
    }

    req.task = task;
    next();
  } catch (error) {
    next(error);
  }
}