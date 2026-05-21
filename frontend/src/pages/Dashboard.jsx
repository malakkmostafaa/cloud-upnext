import { mockTasks } from "../data/mockData";

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function Dashboard() {
  const total = mockTasks.length;
  const todo = mockTasks.filter((t) => t.status === "To Do").length;
  const progress = mockTasks.filter((t) => t.status === "In Progress").length;
  const review = mockTasks.filter((t) => t.status === "In Review").length;
  const done = mockTasks.filter((t) => t.status === "Done").length;

  const cards = [
    { label: "Total Tasks", value: total },
    { label: "To Do", value: todo },
    { label: "In Progress", value: progress },
    { label: "Done", value: done },
  ];

  const statusData = [
    { label: "To Do", value: todo },
    { label: "In Progress", value: progress },
    { label: "In Review", value: review },
    { label: "Done", value: done },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#159c96]">Overview</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Dashboard</h2>
          <p className="mt-2 text-slate-500">
            Track team workload, task progress, and delivery health.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-500 shadow-sm">
          Cloud Computing Project
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-3 text-4xl font-bold text-slate-950">{card.value}</p>
            <div className="mt-4 h-2 rounded-full bg-[#e8f4f5]">
              <div
                className="h-2 rounded-full bg-[#22b8b0]"
                style={{ width: `${pct(card.value, total)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <h3 className="text-lg font-bold text-slate-950">Status Breakdown</h3>

          <div className="mt-5 space-y-4">
            {statusData.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-semibold text-[#159c96]">{item.value}</span>
                </div>

                <div className="h-3 rounded-full bg-[#edf7f8]">
                  <div
                    className="h-3 rounded-full bg-[#22b8b0]"
                    style={{ width: `${pct(item.value, total)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <h3 className="text-lg font-bold text-slate-950">Delivery Snapshot</h3>

          <div className="mt-6 flex items-center justify-center">
            <div className="flex h-44 w-44 items-center justify-center rounded-full bg-[#dff7f5]">
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                <p className="text-4xl font-bold text-[#159c96]">{pct(done, total)}%</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h3 className="text-lg font-bold text-slate-950">Recent Tasks</h3>

        <div className="mt-4 space-y-3">
          {mockTasks.slice(0, 6).map((task) => (
            <div
              key={task.taskId}
              className="flex items-center justify-between rounded-2xl bg-[#f7fbfc] px-4 py-3"
            >
              <div>
                <p className="font-semibold text-slate-900">{task.title}</p>
                <p className="text-sm text-slate-400">
                  {task.teamName} · {task.assigneeName}
                </p>
              </div>

              <span className="rounded-full bg-[#dff7f5] px-3 py-1 text-xs font-semibold text-[#159c96]">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}