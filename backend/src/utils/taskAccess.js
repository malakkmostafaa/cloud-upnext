function canAccessTask(user, task) {
  if (!user || !task) return false;

  if (user.role === "MANAGER" || user.role === "ADMIN") {
    return true;
  }

  return user.teamId === task.teamId;
}

module.exports = {
  canAccessTask,
};