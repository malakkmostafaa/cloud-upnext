import { useState } from "react";

import toast from "react-hot-toast";

import { useAuth }
  from "../context/AuthContext";

import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

import KanbanColumn
  from "../components/kanban/KanbanColumn";

import TaskCard
  from "../components/tasks/TaskCard";

import TaskDetailModal
  from "../components/tasks/TaskDetailModal";

import CreateTaskModal
  from "../components/tasks/CreateTaskModal";
const columns = ["To Do", "In Progress", "In Review", "Done"];

function priorityClass(priority) {
  if (priority === "Critical") return "bg-red-100 text-red-700";
  if (priority === "High") return "bg-orange-100 text-orange-700";
  if (priority === "Medium") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-700";
}

export default function Board() {

  const { user } =
    useAuth();

  const [tasks, setTasks] =
    useState([]);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [selectedTeam, setSelectedTeam] =
    useState("All");

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

              cache: "no-store",

              headers: {

                Authorization:
                  `Bearer ${token}`,

              },

            }
          );

        const data =
          await response.json();

        setTasks(data);

      } catch (error) {

        console.error(
          "FETCH TASKS ERROR:",
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

              Authorization:
                `Bearer ${localStorage.getItem("token")}`,

            },

            body: JSON.stringify({

              ...newTask,

              teamName:
                newTask.teamName
                  ?.trim()
                  .toLowerCase(),

            }),

          }
        );

      const savedTask =
        await response.json();

      setTasks((prev) => [

        ...prev,
        savedTask,

      ]);

      setCreateOpen(false);

      toast.success(
        "Task created successfully!"
      );

    } catch (error) {

      console.error(
        "Create task failed:",
        error
      );

      toast.error(
        "Failed to create task"
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

              Authorization:
                `Bearer ${localStorage.getItem("token")}`,

            },

            body: JSON.stringify({

              ...updatedTask,

              teamName:
                updatedTask.teamName
                  ?.trim()
                  .toLowerCase(),

            }),

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

      setSelectedTask(
        savedTask
      );

      toast.success(
        "Task updated successfully!"
      );

    } catch (error) {

      console.error(
        "Update task failed:",
        error
      );

      toast.error(
        "Failed to update task"
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

      const response =
        await fetch(

          `http://localhost:5000/api/tasks/${taskId}`,

          {

            method: "DELETE",

            headers: {

              Authorization:
                `Bearer ${localStorage.getItem("token")}`,

            },

          }

        );

      if (!response.ok) {

        throw new Error(
          "Delete request failed"
        );

      }

      setTasks((prev) =>

        prev.filter(

          (task) =>

            task.taskId !==
            taskId

        )

      );

      setSelectedTask(null);

      toast.success(
        "Task deleted successfully!"
      );

    } catch (error) {

      console.error(
        "Delete failed:",
        error
      );

      toast.error(
        "Failed to delete task"
      );

    }

  }
  const moveTask = (taskId, nextStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.taskId === taskId
          ? { ...task, status: nextStatus, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>

          <h1 className="text-5xl font-bold text-slate-950">
            Task Board
          </h1>

          <p className="mt-2 text-lg text-slate-500">
            Track work across
            To Do,
            In Progress,
            In Review,
            and Done.
          </p>

        </div>

        <div className="flex items-center gap-4">

          {(
            user?.role === "manager"
            ||

            user?.role === "admin"
          ) && (

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

          )}

          {(
            user?.role === "manager"
            ||

            user?.role === "admin"
          ) && (

            <button
              onClick={() =>
                setCreateOpen(true)
              }

              className="
                rounded-2xl
                bg-slate-950
                px-6 py-4
                font-semibold
                text-white
                transition
                hover:bg-slate-800
              "
            >
              New Task
            </button>

          )}

        </div>

        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          New Task
        </button>
      </div>

      <DragDropContext

        onDragEnd={async (result) => {

          if (!result.destination)
            return;

          const taskId =
            result.draggableId;

          const newStatus =
            result.destination
              .droppableId;

          const task =
            tasks.find(

              (t) =>
                t.taskId ===
                taskId

            );

          if (!task)
            return;

          const updatedTask = {

            ...task,

            status:
              newStatus,

          };

          const canUpdate =

  user?.role === "manager"

  ||

  user?.role === "admin"

  ||

  (

    task.assigneeName
      ?.toLowerCase()
      .trim()

    ===

    user?.name
      ?.toLowerCase()
      .trim()

  );

if (!canUpdate) {

  toast.error(
    "You cannot update teammate tasks"
  );

  return;

}

try {

  /**
   * SAVE OLD TASKS
   */
  const oldTasks = [...tasks];

  /**
   * UPDATE UI
   */
  setTasks((prev) =>

    prev.map((t) =>

      t.taskId === taskId

        ? updatedTask

        : t

    )

  );

  /**
   * UPDATE BACKEND
   */
  await handleSaveTask(
    updatedTask
  );

} catch (error) {

  /**
   * RESTORE UI
   */
  setTasks(oldTasks);

  toast.error(
    "Failed to update task"
  );

}

        }}

      >

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

                  (
                    user?.role === "manager"
                    ||

                    user?.role === "admin"
                  )

                    ? (

                        selectedTeam === "All"
                        ||

                        task.teamName
                          ?.toLowerCase()
                          .trim() ===

                        selectedTeam
                          ?.toLowerCase()
                          .trim()

                      )

                    : (

                        task.teamName
                          ?.toLowerCase()
                          .trim() ===

                        user?.team
                          ?.toLowerCase()
                          .trim()

                      );

                return (
                  matchesStatus
                  &&
                  matchesTeam
                );

              });

            return (

              <Droppable
                droppableId={column}
                key={column}
              >

                {(provided) => (

                  <div
                    ref={
                      provided.innerRef
                    }

                    {...provided.droppableProps}
                  >

                    <KanbanColumn
                      title={column}
                    >

                      {columnTasks.map(
                        (task, index) => (

                          <Draggable

  draggableId={
    task.taskId
  }

  index={index}

  key={
    task.taskId
  }

  isDragDisabled={

    !(
      user?.role === "manager"
      ||

      user?.role === "admin"

      ||

      (

        task.assigneeName
          ?.toLowerCase()
          .trim()

        ===

        user?.name
          ?.toLowerCase()
          .trim()

      )

    )

  }

>

                            {(provided) => (

                              <div
                                ref={
                                  provided.innerRef
                                }

                                {...provided.draggableProps}

                                {...provided.dragHandleProps}
                              >

                                <TaskCard
  task={{
    ...task,

    canDrag:

      (
        user?.role === "manager"
        ||

        user?.role === "admin"
      )

      ||

      (

        task.assigneeName
          ?.toLowerCase()
          .trim()

        ===

        user?.name
          ?.toLowerCase()
          .trim()

      ),

  }}

  onClick={() =>
    setSelectedTask(task)
  }
/>

                              </div>

                            )}

                          </Draggable>

                        )
                      )}

                      {
                        provided.placeholder
                      }

                    </KanbanColumn>

                  </div>

                )}

              </Droppable>

            );

          })}

        </div>

      </DragDropContext>

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