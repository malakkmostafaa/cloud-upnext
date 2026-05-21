import { useState } from "react";
import { mockTasks } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import TaskCreateModal from "../components/tasks/TaskCreateModal";

const columns = ["To Do", "In Progress", "In Review", "Done"];

// Maps backend task status enum to the UI column label.
// TODO(tasks-list-member): drop this once GET /api/tasks returns the column
// labels directly or the board switches to enum-based columns.
const STATUS_TO_COLUMN = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

// Maps backend priority enum to the UI label that priorityClass() expects.
const PRIORITY_LABEL = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function priorityClass(priority) {
  if (priority === "Critical") return "bg-red-100 text-red-700";
  if (priority === "High") return "bg-orange-100 text-orange-700";
  if (priority === "Medium") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-700";
}

export default function Board() {
  const { user } = useAuth();
  const canCreateTask = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [tasks, setTasks] = useState(mockTasks);
  const [createOpen, setCreateOpen] = useState(false);

  const moveTask = (taskId, nextStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.taskId === taskId
          ? { ...task, status: nextStatus, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  // When a task is created via the API, drop it into the local board so the
  // manager sees instant feedback. Once the live GET /api/tasks endpoint lands
  // the board will re-fetch and this becomes redundant.
  const handleTaskCreated = (task) => {
    setTasks((prev) => [
      {
        ...task,
        status: STATUS_TO_COLUMN[task.status] ?? task.status,
        priority: PRIORITY_LABEL[task.priority] ?? task.priority,
        teamName: task.teamId,
        assigneeName: task.assigneeId,
        deadline: task.deadline?.slice(0, 10),
      },
      ...prev,
    ]);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">Task Board</h2>
          <p className="mt-2 text-slate-500">
            Track work across To Do, In Progress, In Review, and Done.
          </p>
        </div>

        {canCreateTask && (
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New Task
          </button>
        )}
      </div>

      <TaskCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleTaskCreated}
      />

      <div className="grid gap-5 lg:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column);

          return (
            <div
              key={column}
              className="min-h-[600px] rounded-3xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{column}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">
                    No tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.taskId}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-slate-950">{task.title}</h4>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm text-slate-500">
                        {task.description}
                      </p>

                      <div className="mt-4 space-y-1 text-xs text-slate-500">
                        <p>Team: {task.teamName}</p>
                        <p>Assignee: {task.assigneeName}</p>
                        <p>Deadline: {task.deadline}</p>
                      </div>

                      <select
                        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={task.status}
                        onChange={(e) => moveTask(task.taskId, e.target.value)}
                      >
                        {columns.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}