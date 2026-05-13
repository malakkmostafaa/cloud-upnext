import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import usersRoutes from "./routes/users.routes.js";
import teamsRoutes from "./routes/teams.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "UpNext backend is running" });
});

app.use("/api", usersRoutes);
app.use("/api", teamsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});