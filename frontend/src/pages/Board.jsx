import {
  useEffect,
  useState,
} from "react";

import KanbanColumn
  from "../components/layout/kanban/KanbanColumn";

import TaskDetailModal
  from "../components/layout/tasks/TaskDetailModal";

import CreateTaskModal
  from "../components/layout/tasks/CreateTaskModal";

export default function Board() {

  const [tasks, setTasks] =
    useState([]);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [selectedTeam, setSelectedTeam] =
    useState("All");

  /**
   * LOAD TASKS FROM BACKEND
   */
  useEffect(() => {

    async function fetchTasks() {

      try {

        const response =
          await fetch(
            "http://localhost:5000/api/tasks"
          );

        const data =
          await response.json();

        setTasks(data);

      } catch (error) {

        console.error(
          "Failed to fetch tasks:",
          error
        );

      }

    }

    fetchTasks();

  }, []);

  const columns = [
    "To Do",
    "In Progress",
    "In Review",
    "Done",
  ];

  const teams = [
    "All",

    ...new Set(
      tasks.map(
        (task) =>
          task.teamName
      )
    ),
  ];

  /**
   * CREATE TASK
   */
  async function handleCreateTask(
    newTask
  ) {

    try {

      const response =
        await fetch(
          "http://localhost:5000/api/tasks",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              newTask
            ),
          }
        );

      const savedTask =
        await response.json();

      setTasks((prev) => [
        ...prev,
        savedTask,
      ]);

      setCreateOpen(false);

    } catch (error) {

      console.error(
        "Create task failed:",
        error
      );

    }

  }

  /**
   * UPDATE TASK
   */
  async function handleSaveTask(
    updatedTask
  ) {

    try {

      const response =
        await fetch(

          `http://localhost:5000/api/tasks/${updatedTask.taskId}`,

          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              updatedTask
            ),
          }
        );

      const savedTask =
        await response.json();

      setTasks((prev) =>
        prev.map((task) =>
          task.taskId ===
          savedTask.taskId
            ? savedTask
            : task
        )
      );

      setSelectedTask(savedTask);

    } catch (error) {

      console.error(
        "Update task failed:",
        error
      );

    }

  }

  /**
   * DELETE TASK
   */
  async function handleDeleteTask(
    taskId
  ) {

    try {

      await fetch(

        `http://localhost:5000/api/tasks/${taskId}`,

        {
          method: "DELETE",
        }
      );

      setTasks((prev) =>
        prev.filter(
          (task) =>
            task.taskId !== taskId
        )
      );

      setSelectedTask(null);

    } catch (error) {

      console.error(
        "Delete task failed:",
        error
      );

    }

  }

  return (

    <div className="flex h-full flex-col">

      <div className="mb-8 flex items-start justify-between">

        <div>

          <h1 className="text-5xl font-bold text-slate-950">
            Task Board
          </h1>

          <p className="mt-2 text-lg text-slate-500">
            Track work across To Do,
            In Progress,
            In Review,
            and Done.
          </p>

        </div>

        <div className="flex items-center gap-4">

          <select
            value={selectedTeam}
            onChange={(e) =>
              setSelectedTeam(
                e.target.value
              )
            }
            className="
              rounded-2xl border
              border-slate-200
              bg-white px-4 py-4
              text-sm font-medium
              text-slate-700
              outline-none
            "
          >

            {teams.map((team) => (

              <option
                key={team}
                value={team}
              >
                {team}
              </option>

            ))}

          </select>

          <button
            onClick={() =>
              setCreateOpen(true)
            }
            className="
              rounded-2xl bg-slate-950
              px-6 py-4 font-semibold
              text-white transition
              hover:bg-slate-800
            "
          >
            New Task
          </button>

        </div>

      </div>

      <div
        className="
          grid flex-1 gap-6
          xl:grid-cols-4
          md:grid-cols-2
          grid-cols-1
        "
      >

        {columns.map((column) => {

          const columnTasks =
            tasks.filter((task) => {

              const matchesStatus =
                task.status === column;

              const matchesTeam =
                selectedTeam === "All"
                || task.teamName === selectedTeam;

              return (
                matchesStatus
                && matchesTeam
              );
            });

          return (

            <KanbanColumn
              key={column}
              title={column}
              tasks={columnTasks}
              onTaskClick={
                setSelectedTask
              }
            />

          );

        })}

      </div>

      <TaskDetailModal
        open={!!selectedTask}

        onOpenChange={() =>
          setSelectedTask(null)
        }

        task={selectedTask}

        onSaveTask={
          handleSaveTask
        }

        onDeleteTask={
          handleDeleteTask
        }
      />

      <CreateTaskModal
        open={createOpen}

        onOpenChange={
          setCreateOpen
        }

        onCreateTask={
          handleCreateTask
        }
      />

    </div>
  );
}