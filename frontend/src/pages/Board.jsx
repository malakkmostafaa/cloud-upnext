import { useMemo, useState } from "react";
import Select from "react-select";
import { mockTasks } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import TaskCreateModal from "../components/tasks/TaskCreateModal";

const columns = ["To Do", "In Progress", "In Review", "Done"];

const STATUS_TO_COLUMN = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

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

function priorityClass(priority) {
  if (priority === "Critical") return "bg-red-50 text-red-600";
  if (priority === "High") return "bg-orange-50 text-orange-600";
  if (priority === "Medium") return "bg-yellow-50 text-yellow-700";
  return "bg-[#dff7f5] text-[#159c96]";
}

export default function Board() {
  const { user } = useAuth();
  const canCreateTask = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [tasks, setTasks] = useState(mockTasks);
  const [createOpen, setCreateOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const teams = useMemo(() => {
    return ["all", ...new Set(tasks.map((task) => task.teamName).filter(Boolean))];
  }, [tasks]);

  const teamOptions = useMemo(() => {
    return teams.map((team) => ({
      value: team,
      label: team === "all" ? "All teams" : team,
    }));
  }, [teams]);

  const priorityOptions = [
    { value: "all", label: "All priorities" },
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ];

  const statusOptions = columns.map((status) => ({
    value: status,
    label: status,
  }));

  const filteredTasks = tasks.filter((task) => {
    const matchesTeam = teamFilter === "all" || task.teamName === teamFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());

    return matchesTeam && matchesPriority && matchesSearch;
  });

  function moveTask(taskId, nextStatus) {
    setTasks((prev) =>
      prev.map((task) =>
        task.taskId === taskId
          ? { ...task, status: nextStatus, updatedAt: new Date().toISOString() }
          : task
      )
    );
  }

  function handleTaskCreated(task) {
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
  }

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

        {canCreateTask && (
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

      <div className="mb-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm shadow-slate-200 md:grid-cols-3">
        <input
          className="rounded-2xl border border-[#ccebed] bg-[#f7fbfc] px-4 py-3 text-sm outline-none transition focus:border-[#22b8b0] focus:ring-4 focus:ring-[#dff7f5]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
        />

        <Select
          options={teamOptions}
          value={teamOptions.find((option) => option.value === teamFilter)}
          onChange={(option) => setTeamFilter(option?.value || "all")}
          styles={selectStyles}
          isSearchable={false}
        />

        <Select
          options={priorityOptions}
          value={priorityOptions.find((option) => option.value === priorityFilter)}
          onChange={(option) => setPriorityFilter(option?.value || "all")}
          styles={selectStyles}
          isSearchable={false}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter((task) => task.status === column);

          return (
            <div
              key={column}
              className="min-h-[600px] rounded-3xl bg-white p-4 shadow-sm shadow-slate-200"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{column}</h3>
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
                  columnTasks.map((task) => (
                    <div key={task.taskId} className="rounded-3xl bg-[#f7fbfc] p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h4 className="font-bold text-slate-950">{task.title}</h4>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm text-slate-500">
                        {task.description}
                      </p>

                      <div className="mt-4 space-y-1 text-xs text-slate-400">
                        <p>Team: {task.teamName}</p>
                        <p>Assignee: {task.assigneeName}</p>
                        <p>Deadline: {task.deadline}</p>
                      </div>

                      <div className="mt-4">
                        <Select
                          options={statusOptions}
                          value={statusOptions.find(
                            (option) => option.value === task.status
                          )}
                          onChange={(option) =>
                            moveTask(task.taskId, option?.value || task.status)
                          }
                          styles={smallSelectStyles}
                          isSearchable={false}
                        />
                      </div>
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