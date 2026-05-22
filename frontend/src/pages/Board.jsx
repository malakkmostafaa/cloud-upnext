/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { listTasks, updateTaskStatus } from "../services/tasksService";
import TaskCreateModal from "../components/tasks/TaskCreateModal";
import TaskDetailModal from "../components/tasks/TaskDetailModal";

const COLUMNS = [
  { key: "TO_DO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "DONE", label: "Done" },
];

const PRIORITY_LABEL = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "48px",
    borderRadius: "18px",
    borderColor: state.isFocused ? "#22b8b0" : "#ccebed",
    backgroundColor: "#f7fbfc",
    boxShadow: state.isFocused ? "0 0 0 4px #dff7f5" : "none",
    cursor: "pointer",
    "&:hover": {
      borderColor: "#22b8b0",
    },
  }),

  menu: (base) => ({
    ...base,
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #d9eef2",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
    zIndex: 50,
  }),

  menuList: (base) => ({
    ...base,
    padding: "6px",
  }),

  option: (base, state) => ({
    ...base,
    borderRadius: "12px",
    backgroundColor: state.isSelected
      ? "#22b8b0"
      : state.isFocused
        ? "#dff7f5"
        : "white",
    color: state.isSelected ? "white" : "#0f172a",
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: "14px",
  }),

  placeholder: (base) => ({
    ...base,
    color: "#64748b",
    fontSize: "14px",
  }),

  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#159c96" : "#94a3b8",
    "&:hover": {
      color: "#159c96",
    },
  }),
};

function priorityClass(priorityLabel) {
  if (priorityLabel === "Critical") return "bg-red-50 text-red-600";
  if (priorityLabel === "High") return "bg-orange-50 text-orange-600";
  if (priorityLabel === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-[#dff7f5] text-[#159c96]";
}

function teamClass(teamId) {
  const team = (teamId || "").toLowerCase();

  if (team === "frontend") {
    return "bg-[#e0f7f4] text-[#137b76] ring-[#b7ebe6]";
  }

  if (team === "backend") {
    return "bg-[#edf7ef] text-[#3f7a4d] ring-[#cdebd4]";
  }

  if (team === "security") {
    return "bg-[#fff3e6] text-[#a65f00] ring-[#ffe0b8]";
  }

  if (team === "devops") {
    return "bg-[#eef4ff] text-[#4361a8] ring-[#d7e4ff]";
  }

  if (team === "qa") {
    return "bg-[#f4f1ff] text-[#6b55a3] ring-[#e1d9ff]";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function deadlineMeta(task) {
  if (!task.deadline) {
    return { label: "No deadline", className: "text-slate-400" };
  }

  const label = task.deadline.slice(0, 10);

  if (task.status === "DONE") {
    return { label, className: "text-slate-400" };
  }

  const due = new Date(task.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due - today) / 86400000);

  if (diffDays < 0) {
    return {
      label: `${label} · Overdue`,
      className: "text-red-600 font-semibold",
    };
  }

  if (diffDays <= 2) {
    return {
      label: `${label} · Due soon`,
      className: "text-orange-600 font-semibold",
    };
  }

  return { label, className: "text-slate-400" };
}

function getToastMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback ||
    "Something went wrong."
  );
}

export default function Board() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [tasks, setTasks] = useState([]);
  const [knownTeams, setKnownTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [teamFilter, setTeamFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  function showToast(type, message) {
    setToast({ type, message });

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const data = await listTasks(isManager ? teamFilter : undefined);
      const normalizedTasks = Array.isArray(data) ? data : [];

      setTasks(normalizedTasks);

      setKnownTeams((prev) =>
        Array.from(
          new Set([
            ...prev,
            ...normalizedTasks.map((t) => t.teamId).filter(Boolean),
          ])
        )
      );
    } catch (err) {
      showToast("error", getToastMessage(err, "Failed to load tasks."));
    } finally {
      setLoading(false);
    }
  }, [isManager, teamFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const teamOptions = useMemo(
    () => [
      { value: "all", label: "All teams" },
      ...knownTeams.map((team) => ({ value: team, label: team })),
    ],
    [knownTeams]
  );

  const priorityOptions = [
    { value: "all", label: "All priorities" },
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
  ];

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      task.title?.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term) ||
      task.teamId?.toLowerCase().includes(term) ||
      task.assigneeId?.toLowerCase().includes(term);

    return matchesPriority && matchesSearch;
  });

  const selectedTask = tasks.find((task) => task.taskId === selectedTaskId) || null;

  function handleTaskCreated(task) {
    setTasks((prev) => [task, ...prev]);
    showToast("success", "Task created successfully.");
  }

  function handleTaskUpdated(updated) {
    setTasks((prev) =>
      prev.map((task) => (task.taskId === updated.taskId ? updated : task))
    );
  }

  function handleTaskDeleted(taskId) {
    setTasks((prev) => prev.filter((task) => task.taskId !== taskId));
    setSelectedTaskId(null);
    showToast("success", "Task deleted successfully.");
  }

  async function handleDragEnd(result) {
    if (!result.destination) return;

    const { draggableId, destination, source } = result;

    if (destination.droppableId === source.droppableId) return;

    const task = tasks.find((item) => item.taskId === draggableId);

    if (!task) return;

    const isOwnTask =
      (task.assigneeId || "").toLowerCase() === (user?.email || "").toLowerCase();

    if (!isManager && !isOwnTask) {
      showToast("error", "You can only move tasks assigned to you.");
      return;
    }

    const previousTasks = tasks;

    setTasks((prev) =>
      prev.map((item) =>
        item.taskId === draggableId
          ? { ...item, status: destination.droppableId }
          : item
      )
    );

    try {
      const updated = await updateTaskStatus(draggableId, destination.droppableId);

      setTasks((prev) =>
        prev.map((item) => (item.taskId === updated.taskId ? updated : item))
      );

      showToast("success", "Task status updated.");
    } catch (err) {
      setTasks(previousTasks);
      showToast("error", getToastMessage(err, "Failed to update task status."));
    }
  }

  return (
    <div className="relative">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#159c96]">Kanban</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Task Board</h2>
          <p className="mt-2 text-slate-500">
            Drag tasks across columns to update their progress.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-2xl bg-[#22b8b0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#159c96]"
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

      <TaskDetailModal
        open={Boolean(selectedTaskId)}
        task={selectedTask}
        canManage={isManager}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskDeleted}
      />

      <div
        className={`mb-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm shadow-slate-200 ${
          isManager ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <input
          className="rounded-2xl border border-[#ccebed] bg-[#f7fbfc] px-4 py-3 text-sm outline-none transition focus:border-[#22b8b0] focus:ring-4 focus:ring-[#dff7f5]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks, teams, or assignees..."
        />

        {isManager && (
          <Select
            options={teamOptions}
            value={teamOptions.find((option) => option.value === teamFilter)}
            onChange={(option) => setTeamFilter(option?.value || "all")}
            styles={selectStyles}
            isSearchable={false}
          />
        )}

        <Select
          options={priorityOptions}
          value={priorityOptions.find((option) => option.value === priorityFilter)}
          onChange={(option) => setPriorityFilter(option?.value || "all")}
          styles={selectStyles}
          isSearchable={false}
        />
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-sm shadow-slate-200">
          Loading tasks...
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid gap-5 lg:grid-cols-4">
            {COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter(
                (task) => task.status === column.key
              );

              return (
                <Droppable droppableId={column.key} key={column.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[600px] rounded-3xl p-4 shadow-sm shadow-slate-200 transition ${
                        snapshot.isDraggingOver
                          ? "bg-[#eefaf9] ring-2 ring-[#22b8b0]/30"
                          : "bg-white"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">
                          {column.label}
                        </h3>

                        <span className="rounded-full bg-[#dff7f5] px-3 py-1 text-xs font-semibold text-[#159c96]">
                          {columnTasks.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {columnTasks.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">
                            Drop tasks here
                          </div>
                        ) : (
                          columnTasks.map((task, index) => {
                            const priorityLabel =
                              PRIORITY_LABEL[task.priority] ?? task.priority;

                            const deadline = deadlineMeta(task);

                            const isOwnTask =
                              (task.assigneeId || "").toLowerCase() ===
                              (user?.email || "").toLowerCase();

                            const canDrag = isManager || isOwnTask;

                            return (
                              <Draggable
                                draggableId={task.taskId}
                                index={index}
                                key={task.taskId}
                                isDragDisabled={!canDrag}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedTaskId(task.taskId)}
                                    className={`cursor-pointer rounded-3xl border border-transparent bg-[#f7fbfc] p-4 transition ${
                                      snapshot.isDragging
                                        ? "rotate-[1deg] shadow-xl ring-2 ring-[#22b8b0]/30"
                                        : "hover:border-[#dff7f5] hover:bg-white hover:shadow-sm"
                                    } ${!canDrag ? "cursor-not-allowed opacity-80" : ""}`}
                                  >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                      <h4 className="line-clamp-2 font-bold text-slate-950">
                                        {task.title}
                                      </h4>

                                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                                        <span
                                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(
                                            priorityLabel
                                          )}`}
                                        >
                                          {priorityLabel}
                                        </span>

                                        <span
                                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${teamClass(
                                            task.teamId
                                          )}`}
                                        >
                                          {task.teamId || "No team"}
                                        </span>
                                      </div>
                                    </div>

                                    <p className="line-clamp-2 text-sm text-slate-500">
                                      {task.description || "No description provided."}
                                    </p>

                                    <div className="mt-4 space-y-1 text-xs text-slate-400">
                                      <p>
                                        <span className="font-semibold text-slate-500">
                                          Assignee:
                                        </span>{" "}
                                        {task.assigneeId || "Unassigned"}
                                      </p>

                                      <p className={deadline.className}>
                                        <span className="font-semibold">
                                          Deadline:
                                        </span>{" "}
                                        {deadline.label}
                                      </p>
                                    </div>

                                    <p className="mt-4 text-[11px] font-medium text-slate-400">
                                      {canDrag
                                        ? "Drag to update progress"
                                        : "Only the assignee can move this task"}
                                    </p>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })
                        )}

                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

function Toast({ type, message, onClose }) {
  const isError = type === "error";

  return (
    <div className="fixed right-6 top-6 z-[80] w-[min(420px,calc(100vw-2rem))]">
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${
          isError
            ? "border-red-100 bg-red-50/95 text-red-700"
            : "border-[#cdeeea] bg-[#effaf9]/95 text-[#137b76]"
        }`}
      >
        {isError ? (
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
        ) : (
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {isError ? "Action failed" : "Success"}
          </p>
          <p className="mt-0.5 text-sm">{message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 opacity-70 hover:bg-white/70 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}