import { requireRole } from "./requireRole.js";

export const requireEmployeeOrManager = requireRole([
  "ADMIN",
  "MANAGER",
  "EMPLOYEE",
]);