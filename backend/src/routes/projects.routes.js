import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireManager } from "../middleware/requireManager.js";

import {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
} from "../services/projects.service.js";

const router = express.Router();

// CREATE PROJECT
router.post(
  "/projects",
  requireAuth,
  requireManager,
  async (req, res, next) => {
    try {
      const { name, description, teamId } = req.body;

      if (!name) {
        return res.status(400).json({
          message: "Project name is required",
        });
      }

      const project = await createProject({
        name,
        description,
        teamId,
        createdBy: req.user.email,
      });

      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  }
);

// LIST PROJECTS
router.get("/projects", requireAuth, async (req, res, next) => {
  try {
    const projects = await listProjects();

    // Managers/Admins see all projects
    if (
      req.user.role === "MANAGER" ||
      req.user.role === "ADMIN"
    ) {
      return res.json(projects);
    }

    // Employees only see projects from their own team
    const filteredProjects = projects.filter(
      (project) => project.teamId === req.user.teamId
    );

    res.json(filteredProjects);
  } catch (err) {
    next(err);
  }
});

// GET PROJECT BY ID
router.get("/projects/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Employees cannot access projects from other teams
    if (
      req.user.role === "EMPLOYEE" &&
      project.teamId !== req.user.teamId
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
});

// UPDATE PROJECT
router.put(
  "/projects/:id",
  requireAuth,
  requireManager,
  async (req, res, next) => {
    try {
      const { name, description, teamId } = req.body;

      const patch = {};

      if (name !== undefined) {
        patch.name = name;
      }

      if (description !== undefined) {
        patch.description = description;
      }

      if (teamId !== undefined) {
        patch.teamId = teamId;
      }

      const project = await updateProject(
        req.params.id,
        patch
      );

      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE PROJECT
router.delete(
  "/projects/:id",
  requireAuth,
  requireManager,
  async (req, res, next) => {
    try {
      await deleteProject(req.params.id);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;