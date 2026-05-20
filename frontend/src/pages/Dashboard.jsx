import { mockTasks } from "../data/mockData";

export default function Dashboard() {

  const { user } =
    useAuth();

  const [tasks, setTasks] =
    useState([]);

  /**
   * LOAD TASKS
   */
  useEffect(() => {

    async function fetchTasks() {

      try {

        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await fetch(
            "http://localhost:5000/api/tasks",
            {

              headers: {

                Authorization:
                  `Bearer ${token}`,

              },

            }
          );

        const data =
          await response.json();

        setTasks(

  Array.isArray(data)
    ? data
    : []

);

      } catch (error) {

        console.error(
          "Dashboard fetch error:",
          error
        );

      }

    }

    fetchTasks();

  }, []);

  /**
   * RBAC FILTER
   */
  const validStatuses = [

  "To Do",
  "In Progress",
  "In Review",
  "Done",

];

const visibleTasks =

  (
    user?.role === "manager"
    ||

    user?.role === "admin"
  )

    ? tasks.filter(

        (task) =>

          validStatuses.includes(
            task.status
          )

      )

    : tasks.filter(

        (task) =>

          task.teamName
            ?.toLowerCase()
            .trim() ===

          user?.team
            ?.toLowerCase()
            .trim()

          &&

          validStatuses.includes(
            task.status
          )

      );

  /**
   * COUNTS
   */
  const total =
    visibleTasks.length;

  const todo =
    visibleTasks.filter(

      (t) =>
        t.status ===
        "To Do"

    ).length;

  const progress =
    visibleTasks.filter(

      (t) =>
        t.status ===
        "In Progress"

    ).length;

  const review =
    visibleTasks.filter(

      (t) =>
        t.status ===
        "In Review"

    ).length;

  const done =
    visibleTasks.filter(

      (t) =>
        t.status ===
        "Done"

    ).length;

  const cards = [
    { label: "Total Tasks", value: total },
    { label: "To Do", value: todo },
    { label: "In Progress", value: progress },
    { label: "Done", value: done },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-950">Dashboard</h2>
        <p className="mt-2 text-slate-500">
          Overview of your team work and progress.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-950">Recent Tasks</h3>

        <div className="mt-4 space-y-3">
          {mockTasks.map((task) => (
            <div
              key={task.taskId}
              className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="text-sm text-slate-500">
                  {task.teamName} · {task.assigneeName}
                </p>
              </div>

              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}