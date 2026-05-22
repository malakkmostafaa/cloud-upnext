import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Search, AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { listTasks } from "../services/tasksService";

const STATUS_LABEL = {
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
    minHeight: "46px",
    borderRadius: "16px",
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
    padding: "11px 13px",
    cursor: "pointer",
    fontSize: "14px",
  }),

  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
  }),

  indicatorSeparator: () => ({ display: "none" }),
};

function normalizeStatus(raw) {
  const key = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  return STATUS_LABEL[key] ? key : "TO_DO";
}

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function isOverdue(task) {
  if (!task.deadline || normalizeStatus(task.status) === "DONE") return false;

  const due = new Date(task.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today;
}

function isDueSoon(task) {
  if (!task.deadline || normalizeStatus(task.status) === "DONE") return false;

  const due = new Date(task.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due - today) / 86400000);
  return diffDays >= 0 && diffDays <= 2;
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

function priorityClass(priority) {
  if (priority === "CRITICAL") return "bg-red-50 text-red-600";
  if (priority === "HIGH") return "bg-orange-50 text-orange-600";
  if (priority === "MEDIUM") return "bg-amber-50 text-amber-700";
  return "bg-[#dff7f5] text-[#159c96]";
}

function formatDate(date) {
  if (!date) return "No deadline";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Invalid date";

  return d.toLocaleDateString();
}

function sortTasks(tasks, sortBy) {
  const copy = [...tasks];

  if (sortBy === "deadline_asc") {
    return copy.sort(
      (a, b) =>
        new Date(a.deadline || "9999-12-31").getTime() -
        new Date(b.deadline || "9999-12-31").getTime()
    );
  }

  if (sortBy === "deadline_desc") {
    return copy.sort(
      (a, b) =>
        new Date(b.deadline || 0).getTime() - new Date(a.deadline || 0).getTime()
    );
  }

  if (sortBy === "priority") {
    const weight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return copy.sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0));
  }

  return copy.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [tasks, setTasks] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await listTasks();
        if (!cancelled) setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load dashboard data."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const teamOptions = useMemo(() => {
    const teams = [...new Set(tasks.map((task) => task.teamId).filter(Boolean))];

    return [
      { value: "all", label: "All teams" },
      ...teams.map((team) => ({
        value: team,
        label: team,
      })),
    ];
  }, [tasks]);

  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "TO_DO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "DONE", label: "Done" },
  ];

  const priorityOptions = [
    { value: "all", label: "All priorities" },
    { value: "CRITICAL", label: "Critical" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];

  const sortOptions = [
    { value: "recent", label: "Newest first" },
    { value: "deadline_asc", label: "Deadline soonest" },
    { value: "deadline_desc", label: "Deadline latest" },
    { value: "priority", label: "Priority highest" },
  ];

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      const status = normalizeStatus(task.status);

      const matchesTeam =
        selectedTeam === "all" || task.teamId === selectedTeam;

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      const matchesSearch =
        !term ||
        task.title?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term) ||
        task.assigneeId?.toLowerCase().includes(term) ||
        task.teamId?.toLowerCase().includes(term);

      return matchesTeam && matchesStatus && matchesPriority && matchesSearch;
    });

    return sortTasks(filtered, sortBy);
  }, [tasks, selectedTeam, statusFilter, priorityFilter, search, sortBy]);

  const stats = useMemo(() => {
    const counts = { TO_DO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };

    for (const task of filteredTasks) {
      counts[normalizeStatus(task.status)] += 1;
    }

    const total = filteredTasks.length;
    const overdue = filteredTasks.filter(isOverdue).length;
    const dueSoon = filteredTasks.filter(isDueSoon).length;
    const completedPercent = pct(counts.DONE, total);

    return {
      total,
      overdue,
      dueSoon,
      completedPercent,
      ...counts,
    };
  }, [filteredTasks]);


  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      helper: "Matching current filters",
      icon: CheckCircle2,
    },
    {
      label: "In Progress",
      value: stats.IN_PROGRESS,
      helper: `${pct(stats.IN_PROGRESS, stats.total)}% of visible work`,
      icon: CalendarClock,
    },
    {
      label: "Due Soon",
      value: stats.dueSoon,
      helper: "Due in the next 2 days",
      icon: CalendarClock,
    },
    {
      label: "Overdue",
      value: stats.overdue,
      helper: "Needs attention",
      icon: AlertTriangle,
      danger: true,
    },
  ];

  const statusData = [
    { key: "TO_DO", label: "To Do", value: stats.TO_DO },
    { key: "IN_PROGRESS", label: "In Progress", value: stats.IN_PROGRESS },
    { key: "IN_REVIEW", label: "In Review", value: stats.IN_REVIEW },
    { key: "DONE", label: "Done", value: stats.DONE },
  ];

  const recentTasks = filteredTasks.slice(0, 8);

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold text-[#159c96]">Overview</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Dashboard</h2>
          <p className="mt-2 text-slate-500">
            Monitor task progress, team workload, deadlines, and delivery health.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-500 shadow-sm shadow-slate-200">
          {isManager ? "Manager View" : `${user?.teamName || user?.teamId || "Team"} View`}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-sm shadow-slate-200">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div
            className={`mb-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm shadow-slate-200 ${
              isManager ? "lg:grid-cols-5" : "lg:grid-cols-4"
            }`}
          >
            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-[46px] w-full rounded-2xl border border-[#ccebed] bg-[#f7fbfc] pl-11 pr-4 text-sm outline-none transition focus:border-[#22b8b0] focus:ring-4 focus:ring-[#dff7f5]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
              />
            </div>

            {isManager && (
              <Select
                options={teamOptions}
                value={teamOptions.find((option) => option.value === selectedTeam)}
                onChange={(option) => setSelectedTeam(option?.value || "all")}
                styles={selectStyles}
                isSearchable={false}
              />
            )}

            <Select
              options={statusOptions}
              value={statusOptions.find((option) => option.value === statusFilter)}
              onChange={(option) => setStatusFilter(option?.value || "all")}
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

            <Select
              options={sortOptions}
              value={sortOptions.find((option) => option.value === sortBy)}
              onChange={(option) => setSortBy(option?.value || "recent")}
              styles={selectStyles}
              isSearchable={false}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{card.label}</p>
                      <p className="mt-3 text-4xl font-bold text-slate-950">
                        {card.value}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-3 ${
                        card.danger
                          ? "bg-red-50 text-red-600"
                          : "bg-[#dff7f5] text-[#159c96]"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">{card.helper}</p>
                </div>
              );
            })}
          </div>

          {/* {isManager && (
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <div className="mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Team Dashboard
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Compare workload and completion across teams.
                  </p>
                </div>
              </div>

              {teamStats.length === 0 ? (
                <p className="text-sm text-slate-400">No teams found.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {teamStats.map((team) => (
                    <button
                      key={team.teamId}
                      type="button"
                      onClick={() => setSelectedTeam(team.teamId)}
                      className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                        selectedTeam === team.teamId
                          ? "border-[#22b8b0] bg-[#effaf9]"
                          : "border-slate-100 bg-[#f7fbfc]"
                      }`}
                    >
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${teamClass(
                          team.teamId
                        )}`}
                      >
                        {team.teamId}
                      </span>

                      <p className="mt-4 text-3xl font-bold text-slate-950">
                        {team.total}
                      </p>
                      <p className="text-sm text-slate-400">Total tasks</p>

                      <div className="mt-4 space-y-2 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Completed</span>
                          <span className="font-semibold text-[#159c96]">
                            {pct(team.done, team.total)}%
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-white">
                          <div
                            className="h-2 rounded-full bg-[#22b8b0]"
                            style={{ width: `${pct(team.done, team.total)}%` }}
                          />
                        </div>

                        <div className="flex justify-between">
                          <span>In progress</span>
                          <span>{team.inProgress}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Overdue</span>
                          <span
                            className={
                              team.overdue > 0
                                ? "font-semibold text-red-600"
                                : "text-slate-400"
                            }
                          >
                            {team.overdue}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedTeam !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedTeam("all")}
                  className="mt-4 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Clear team dashboard filter
                </button>
              )}
            </div>
          )} */}=

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <h3 className="text-lg font-bold text-slate-950">
                Status Breakdown
              </h3>

              <div className="mt-5 space-y-4">
                {statusData.map((item) => (
                  <div key={item.key}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="font-semibold text-[#159c96]">
                        {item.value}
                      </span>
                    </div>

                    <div className="h-3 rounded-full bg-[#edf7f8]">
                      <div
                        className="h-3 rounded-full bg-[#22b8b0]"
                        style={{ width: `${pct(item.value, stats.total)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <h3 className="text-lg font-bold text-slate-950">
                Delivery Snapshot
              </h3>

              <div className="mt-6 flex items-center justify-center">
                <div className="flex h-44 w-44 items-center justify-center rounded-full bg-[#dff7f5]">
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                    <p className="text-4xl font-bold text-[#159c96]">
                      {stats.completedPercent}%
                    </p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-[#f7fbfc] p-3">
                  <p className="text-slate-400">Due Soon</p>
                  <p className="mt-1 font-bold text-orange-600">
                    {stats.dueSoon}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7fbfc] p-3">
                  <p className="text-slate-400">Overdue</p>
                  <p className="mt-1 font-bold text-red-600">
                    {stats.overdue}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  Task List
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Showing {recentTasks.length} of {filteredTasks.length} matching tasks.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No tasks match the current filters.
                </p>
              ) : (
                recentTasks.map((task) => {
                  const status = normalizeStatus(task.status);

                  return (
                    <div
                      key={task.taskId}
                      className="flex flex-col justify-between gap-3 rounded-2xl bg-[#f7fbfc] px-4 py-3 md:flex-row md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {task.title}
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityClass(
                              task.priority
                            )}`}
                          >
                            {PRIORITY_LABEL[task.priority] || task.priority}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {task.assigneeId || "Unassigned"} · Due{" "}
                          {formatDate(task.deadline)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${teamClass(
                            task.teamId
                          )}`}
                        >
                          {task.teamId || "No team"}
                        </span>

                        <span className="rounded-full bg-[#dff7f5] px-3 py-1 text-xs font-semibold text-[#159c96]">
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}