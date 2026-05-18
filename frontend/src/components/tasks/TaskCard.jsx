function TaskCard({ task, onClick }) {

  const isOverdue =
    new Date(task.deadline) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) =>
        e.dataTransfer.setData(
          "taskId",
          task.taskId
        )
      }
      onClick={onClick}
      className={`rounded-2xl p-4 shadow-md border cursor-grab bg-white transition hover:shadow-xl ${
        isOverdue
          ? "border-red-500"
          : "border-gray-200"
      }`}
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

      <div className="mt-3 text-xs text-gray-500">
        Deadline: {task.deadline}
      </div>

      {isOverdue && (
        <p className="text-red-500 text-xs mt-2 font-semibold">
          Overdue
        </p>
      )}

    </div>
  );
}

export default TaskCard;