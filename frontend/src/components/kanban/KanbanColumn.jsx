import TaskCard from "../tasks/TaskCard";

function KanbanColumn({
  title,
  tasks,
  onTaskClick,
  onDropTask,
}) {

  function handleDrop(e) {
    e.preventDefault();

    const taskId =
      e.dataTransfer.getData("taskId");

    onDropTask(taskId, title);
  }

  return (
    <div
      onDragOver={(e) =>
        e.preventDefault()
      }
      onDrop={handleDrop}
      className="bg-gray-100 rounded-2xl p-4 w-full min-h-[500px]"
    >
      <h2 className="text-xl font-bold mb-4">
        {title}
      </h2>

      <div className="space-y-4">

        {tasks.map((task) => (
          <TaskCard
            key={task.taskId}
            task={task}
            onClick={() =>
              onTaskClick(task)
            }
          />
        ))}

      </div>
    </div>
  );
}

export default KanbanColumn;