import { mockUsers } from "../data/mockData.js";

export function requireAuth(req, res, next) {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ message: "Missing user identity." });
  }

  const user = mockUsers.find((u) => u.userId === userId);

  if (!user) {
    return res.status(401).json({ message: "Invalid user." });
  }

  req.user = user;
  next();
}