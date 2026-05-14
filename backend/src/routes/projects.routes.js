const express = require("express");

const { requireAuth, requireRole } = require("../middleware/auth");
const { Role } = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { validateProjectPayload } = require("../utils/validate");
const projectsService = require("../services/projects.service");

const router = express.Router();

// All authenticated users may list/read projects.
// Only managers may create/update/delete.

router.post(
  "/projects",
  requireAuth,
  requireRole(Role.MANAGER),
  async (req, res, next) => {
    try {
      const payload = validateProjectPayload(req.body);
      const project = await projectsService.createProject({
        ...payload,
        createdBy: req.user.sub,
      });
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/projects", requireAuth, async (req, res, next) => {
  try {
    const projects = await projectsService.listProjects();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await projectsService.getProjectById(req.params.id);
    if (!project) throw ApiError.notFound("Project not found");
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/projects/:id",
  requireAuth,
  requireRole(Role.MANAGER),
  async (req, res, next) => {
    try {
      const patch = validateProjectPayload(req.body, { partial: true });
      const project = await projectsService.updateProject(req.params.id, patch);
      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/projects/:id",
  requireAuth,
  requireRole(Role.MANAGER),
  async (req, res, next) => {
    try {
      await projectsService.deleteProject(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
