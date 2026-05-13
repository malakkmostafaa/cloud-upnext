const commentsRoutes = require("./routes/comments.routes");
const imagesRoutes = require("./routes/images.routes");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "UpNext Backend",
    timestamp: new Date().toISOString(),
  });
});

// API test route
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to UpNext API",
  });
});

app.use("/api", commentsRoutes);
app.use("/api", imagesRoutes);

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
  });
});

module.exports = app;