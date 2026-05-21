import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import commentsRoutes from "./routes/comments.routes.js";
import imagesRoutes from "./routes/images.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import teamsRoutes from "./routes/teams.routes.js";
import usersRoutes from "./routes/users.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// Global middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check route - public
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "UpNext Backend",
    timestamp: new Date().toISOString(),
  });
});

// API test route - public
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to UpNext API",
  });
});

// Public auth routes
// Example: login/signup routes if your team implemented them here
app.use("/api", authRoutes);

// Protected routes
// These should use requireAuth inside their own route files
app.use("/api", projectsRoutes);
app.use("/api", tasksRoutes);
app.use("/api", commentsRoutes);
app.use("/api", imagesRoutes);
app.use("/api", teamsRoutes);
app.use("/api", usersRoutes);
app.use("/api", analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
    ...(err.details ? { details: err.details } : {}),
  });
});

export default app;