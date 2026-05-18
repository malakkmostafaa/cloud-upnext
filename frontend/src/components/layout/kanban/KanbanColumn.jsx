export default function KanbanColumn({
  title,
  tasks,
  onTaskClick,
}) {
  return (
    <div
      className="
        rounded-3xl border
        border-slate-200
        bg-white/60 p-5
        shadow-sm
      "
    >

      <div className="mb-5 flex items-center justify-between">

        <h2
          className="
            text-2xl font-bold
            text-slate-950
          "
        >
          {title}
        </h2>

        <div
          className="
            flex h-8 w-8
            items-center justify-center
            rounded-full
            bg-slate-100
            text-sm font-semibold
            text-slate-500
          "
        >
          {tasks.length}
        </div>

      </div>

      <div className="space-y-4">

        {tasks.length === 0 ? (
          <div
            className="
              rounded-2xl border
              border-dashed
              border-slate-200
              p-8 text-center
              text-slate-400
            "
          >
            No tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.taskId}
              onClick={() =>
                onTaskClick(task)
              }
              className="
                cursor-pointer
                rounded-3xl border
                border-slate-200
                bg-white p-5
                shadow-sm transition
                hover:-translate-y-1
                hover:shadow-lg
              "
            >

              <div className="mb-3 flex items-start justify-between">

                <h3
                  className="
                    text-xl font-bold
                    text-slate-950
                  "
                >
                  {task.title}
                </h3>

                <span
                  className={`
                    rounded-full
                    px-3 py-1
                    text-xs font-bold

                    ${
                      task.priority === "High"
                        ? "bg-red-100 text-red-600"
                        : task.priority ===
                          "Medium"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-green-100 text-green-600"
                    }
                  `}
                >
                  {task.priority}
                </span>

              </div>

              <p className="mb-4 text-slate-500">
                {task.description}
              </p>

              <div className="space-y-1 text-sm text-slate-500">

                <p>
                  Team: {task.teamName}
                </p>

                <p>
                  Assignee:
                  {" "}
                  {task.assigneeName}
                </p>

                <p>
                  Deadline:
                  {" "}
                  {task.deadline}
                </p>

              </div>

            </div>
          ))
        )}

      </div>

    </div>
  );
}