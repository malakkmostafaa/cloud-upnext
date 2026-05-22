/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { useAuth } from "../context/AuthContext";
import {
  listTasks,
  updateTaskStatus
} from "../services/tasksService";import TaskCreateModal from "../components/tasks/TaskCreateModal";
import TaskDetailModal from "../components/tasks/TaskDetailModal";

// Kanban columns keyed by the backend status enum.
const COLUMNS = [
  { key: "TO_DO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "DONE", label: "Done" },
];

const STATUS_OPTIONS = COLUMNS.map((c) => ({ value: c.key, label: c.label }));

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

const smallSelectStyles = {
  ...selectStyles,

  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    borderRadius: "16px",
    borderColor: state.isFocused ? "#22b8b0" : "#ccebed",
    backgroundColor: "white",
    boxShadow: state.isFocused ? "0 0 0 4px #dff7f5" : "none",
    cursor: "pointer",
    "&:hover": {
      borderColor: "#22b8b0",
    },
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
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "13px",
  }),

  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 500,
  }),
};

function priorityClass(priorityLabel) {
  if (priorityLabel === "Critical") return "bg-red-50 text-red-600";
  if (priorityLabel === "High") return "bg-orange-50 text-orange-600";
  if (priorityLabel === "Medium") return "bg-yellow-50 text-yellow-700";
  return "bg-[#dff7f5] text-[#159c96]";
}
function teamClass(teamId) {
  const team = (teamId || "").toLowerCase();

  if (team === "frontend") {
    return "bg-blue-50 text-blue-700";
  }

  if (team === "backend") {
    return "bg-purple-50 text-purple-700";
  }

  if (team === "security") {
    return "bg-red-50 text-red-700";
  }

  return "bg-green-50 text-green-700";
}

// TASK-11: surface the deadline and flag overdue / due-soon tasks.
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
    return { label: `${label} · Overdue`, className: "text-red-600 font-semibold" };
  }
  if (diffDays <= 2) {
    return { label: `${label} · Due soon`, className: "text-orange-600 font-semibold" };
  }
  return { label, className: "text-slate-400" };
}

export default function Board() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [tasks, setTasks] = useState([]);
  const [knownTeams, setKnownTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [teamFilter, setTeamFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  // TASK-03 / TASK-04 / TASK-05 — the backend enforces team isolation.
  // Managers may pass ?teamId=; for employees it is ignored server-side.
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
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
      setError(
        err.response?.data?.message || err.message || "Failed to load tasks."
      );
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
      ...knownTeams.map((t) => ({ value: t, label: t })),
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

  // Priority + search are applied client-side; team filtering is server-side.
  const filteredTasks = tasks.filter((task) => {
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      task.title?.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term);
    return matchesPriority && matchesSearch;
  });

  const selectedTask =
    tasks.find((t) => t.taskId === selectedTaskId) || null;

  async function handleStatusChange(task, nextStatus) {
    if (nextStatus === task.status) return;

    const previous = tasks;
    // Optimistic update.
    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === task.taskId ? { ...t, status: nextStatus } : t
      )
    );

    try {
      const updated = await updateTaskStatus(task.taskId, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.taskId === updated.taskId ? updated : t))
      );
    } catch (err) {
      setTasks(previous); // roll back
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update task status."
      );
    }
  }

  function handleTaskCreated(task) {
    setTasks((prev) => [task, ...prev]);
  }

  function handleTaskUpdated(updated) {
    setTasks((prev) =>
      prev.map((t) => (t.taskId === updated.taskId ? updated : t))
    );
  }

  function handleTaskDeleted(taskId) {
    setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
    setSelectedTaskId(null);
  }
  const handleDragEnd = async (result) => {
  if (!result.destination) return;

  const { draggableId, destination, source } = result;

  if (destination.droppableId === source.droppableId) return;

  const task = tasks.find((t) => t.taskId === draggableId);

  if (!task) return;

  const isOwnTask =
    (task.assigneeId || "").toLowerCase() ===
    (user?.email || "").toLowerCase();

  if (!isManager && !isOwnTask) {
    alert("You can only move your own tasks");
    return;
  }

  try {
    await updateTaskStatus(draggableId, destination.droppableId);

    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === draggableId
          ? { ...t, status: destination.droppableId }
          : t
      )
    );
  } catch (error) {
    console.error(error);
    alert("Failed to update task status");
  }
};
  

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#159c96]">Kanban</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Task Board</h2>
          <p className="mt-2 text-slate-500">
            Track work across To Do, In Progress, In Review, and Done.
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
          placeholder="Search tasks..."
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
          value={priorityOptions.find(
            (option) => option.value === priorityFilter
          )}
          onChange={(option) => setPriorityFilter(option?.value || "all")}
          styles={selectStyles}
          isSearchable={false}
        />
      </div>
      <div></div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      
     

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
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-h-[600px] rounded-3xl bg-white p-4 shadow-sm shadow-slate-200"
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
                      No tasks here
                    </div>
                  ) : (
                    columnTasks.map((task, index) => {
                      const priorityLabel =
                        PRIORITY_LABEL[task.priority] ?? task.priority;

                      const deadline = deadlineMeta(task);

                      return (
                        <Draggable
                          draggableId={task.taskId}
                          index={index}
                          key={task.taskId}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() =>
                                setSelectedTaskId(task.taskId)
                              }
                              className="cursor-pointer rounded-3xl bg-[#f7fbfc] p-4 transition hover:ring-2 hover:ring-[#dff7f5]"
                            >
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <h4 className="font-bold text-slate-950">
                                  {task.title}
                                </h4>

                                <div className="flex flex-col items-end gap-1">
  <span
    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(
      priorityLabel
    )}`}
  >
    {priorityLabel}
  </span>

  <span
    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${
      task.teamId === "backend"
        ? "bg-blue-500"
        : task.teamId === "frontend"
        ? "bg-pink-500"
        : task.teamId === "security"
        ? "bg-green-600"
        : "bg-slate-500"
    }`}
  >
    {task.teamId}
  </span>
</div>
                              </div>

                              <p className="line-clamp-2 text-sm text-slate-500">
                                {task.description}
                              </p>

                              <div className="mt-4 space-y-1 text-xs text-slate-400">
                                <p>Team: {task.teamId}</p>

                                <p>Assignee: {task.assigneeId}</p>

                                <p className={deadline.className}>
                                  Deadline: {deadline.label}
                                </p>
                              </div>

                              <div
                                className="mt-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Select
                                  options={STATUS_OPTIONS}
                                  value={STATUS_OPTIONS.find(
                                    (option) =>
                                      option.value === task.status
                                  )}
                                  onChange={(option) =>
                                    handleStatusChange(
                                      task,
                                      option?.value || task.status
                                    )
                                  }
                                  styles={smallSelectStyles}
                                  isSearchable={false}
                                  isDisabled={
                                    !isManager &&
                                    (task.assigneeId || "").toLowerCase() !==
                                      (user?.email || "").toLowerCase()
                                  }
                                />
                              </div>
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