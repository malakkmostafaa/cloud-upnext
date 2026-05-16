export function canAccessTask(user, task) {
  if (!user || !task) return false;

  if (user.role === "ADMIN" || user.role === "MANAGER") {
    return true;
  }

  return user.teamId === task.teamId;
}