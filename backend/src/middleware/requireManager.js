import { requireRole } from "./requireRole.js";

export const requireManager = requireRole(["ADMIN", "MANAGER"]);