function TaskCard({ task, onClick }) {

  const deadlineDate =
    new Date(task.deadline);

  const today =
    new Date();

  const diffTime =
    deadlineDate - today;

  const diffDays =
    Math.ceil(
      diffTime /
      (1000 * 60 * 60 * 24)
    );

  const isOverdue =
    diffDays < 0;

  const isDueSoon =
    diffDays >= 0 &&
    diffDays <= 3;

  let deadlineStyles =
    "bg-green-100 text-green-700 border-green-300";

  let deadlineText =
    "On Track";

  if (isOverdue) {

    deadlineStyles =
      "bg-red-100 text-red-700 border-red-300";

    deadlineText =
      "Overdue";

  }
  else if (isDueSoon) {

    deadlineStyles =
      "bg-yellow-100 text-yellow-700 border-yellow-300";

    deadlineText =
      "Due Soon";

  }

  return (

    <div

  draggable={task.canDrag}

  onClick={onClick}
      className={`
        rounded-2xl p-4 shadow-md
        border cursor-grab bg-white
        transition hover:shadow-xl
        ${
          isOverdue
            ? "border-red-500"
            : isDueSoon
            ? "border-yellow-400"
            : "border-gray-200"
        }
      `}
    >

      <h3 className="text-lg font-bold mb-2">
        {task.title}
      </h3>

      <p className="text-sm text-gray-600 mb-3">
        {task.description}
      </p>

      <div className="flex justify-between text-sm">

        <span className="font-medium">
          {task.assigneeName}
        </span>

        <span
          className={`font-semibold ${
            task.priority === "High"
              ? "text-red-500"
              : task.priority === "Medium"
              ? "text-yellow-500"
              : "text-green-500"
          }`}
        >
          {task.priority}
        </span>

      </div>

      <div className="mt-3 text-sm text-gray-500">
        Team: {task.teamName}
      </div>

      <div className="text-sm text-gray-500">
        Assignee: {task.assigneeName}
      </div>

      <div
        className={`
          mt-4 rounded-xl border px-3 py-2
          text-xs font-semibold
          ${deadlineStyles}
        `}
      >

        <div className="flex items-center justify-between">

          <span>
            Deadline:
          </span>

          <span>
            {task.deadline}
          </span>

        </div>

        <p className="mt-1">
          {deadlineText}
        </p>

      </div>

    </div>

  );

}

export default TaskCard;