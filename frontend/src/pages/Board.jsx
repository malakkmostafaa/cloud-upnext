import { useState } from "react";

import mockTasks from "../mock/tasks";

import KanbanColumn from "../components/kanban/KanbanColumn";
import TaskDetailModal from "../components/tasks/TaskDetailModal";

function Board() {

  const [tasks, setTasks] =
    useState(mockTasks);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [teamFilter, setTeamFilter] =
    useState("All");

  const columns = [
    "To Do",
    "In Progress",
    "In Review",
    "Done",
  ];

  const filteredTasks =
    tasks.filter((task) => {

      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        task.assigneeName
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesTeam =
        teamFilter === "All" ||
        task.teamName === teamFilter;

      return (
        matchesSearch &&
        matchesTeam
      );
    });

  function handleDropTask(
    taskId,
    newStatus
  ) {

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.taskId === taskId
          ? {
              ...task,
              status: newStatus,
            }
          : task
      )
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6">

      <h1 className="text-4xl font-bold mb-8">
        UpNext Kanban Board
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">

        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="p-3 rounded-xl border w-full md:w-[300px]"
        />

        <select
          value={teamFilter}
          onChange={(e) =>
            setTeamFilter(
              e.target.value
            )
          }
          className="p-3 rounded-xl border w-full md:w-[200px]"
        >

          <option value="All">
            All Teams
          </option>

          <option value="Frontend">
            Frontend
          </option>

          <option value="Backend">
            Backend
          </option>

        </select>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {columns.map((column) => (

          <KanbanColumn
            key={column}
            title={column}

            tasks={filteredTasks.filter(
              (task) =>
                task.status === column
            )}

            onTaskClick={
              setSelectedTask
            }

            onDropTask={
              handleDropTask
            }
          />
        ))}

      </div>

      <TaskDetailModal
        task={selectedTask}
        onClose={() =>
          setSelectedTask(null)
        }
      />

    </div>
  );
}

export default Board;