export const mockUsers = [
  {
    userId: "admin",
    name: "Admin",
    email: "admin@upnext.com",
    password: "Password123!",
    role: "ADMIN",
    teamId: "all",
    teamName: "All Teams",
  },
  {
    userId: "ali",
    name: "Ali",
    email: "ali@upnext.com",
    password: "Password123!",
    role: "MANAGER",
    teamId: "all",
    teamName: "All Teams",
  },
  {
    userId: "sara",
    name: "Sara",
    email: "sara@upnext.com",
    password: "Password123!",
    role: "EMPLOYEE",
    teamId: "frontend",
    teamName: "Frontend",
  },
  {
    userId: "omar",
    name: "Omar",
    email: "omar@upnext.com",
    password: "Password123!",
    role: "EMPLOYEE",
    teamId: "backend",
    teamName: "Backend",
  },
];

export const mockUser = mockUsers[1];

export const mockTeams = [
  { teamId: "frontend", name: "Frontend" },
  { teamId: "backend", name: "Backend" },
  { teamId: "qa", name: "QA" },
  { teamId: "devops", name: "DevOps" },
];

export const mockProjects = [
  {
    projectId: "project-1",
    name: "UpNext MVP",
    description: "Main cloud computing project",
  },
];

export const mockTasks = [
  {
    taskId: "task-a",
    projectId: "project-1",
    title: "Task A",
    description: "Build the login page and dashboard shell.",
    status: "To Do",
    priority: "High",
    deadline: "2026-05-20",
    assigneeId: "sara",
    assigneeName: "Sara",
    assigneeEmail: "sara@upnext.com",
    teamId: "frontend",
    teamName: "Frontend",
    imageOriginalKey: "",
    imageResizedKey: "",
    imageVersions: [],
    createdBy: "ali",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closedAt: null,
  },
  {
    taskId: "task-b",
    projectId: "project-1",
    title: "Task B",
    description: "Build backend task APIs.",
    status: "In Progress",
    priority: "Medium",
    deadline: "2026-05-21",
    assigneeId: "omar",
    assigneeName: "Omar",
    assigneeEmail: "omar@upnext.com",
    teamId: "backend",
    teamName: "Backend",
    imageOriginalKey: "",
    imageResizedKey: "",
    imageVersions: [],
    createdBy: "ali",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closedAt: null,
  },
];