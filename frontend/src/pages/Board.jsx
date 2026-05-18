import { useState } from "react";

import KanbanColumn from "../components/layout/kanban/KanbanColumn";

import TaskDetailModal from "../components/layout/tasks/TaskDetailModal";

import CreateTaskModal from "../components/layout/tasks/CreateTaskModal";

import { mockTasks } from "../data/mockData";

export default function Board() {

  const [tasks, setTasks] =
    useState(mockTasks);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [createOpen, setCreateOpen] =
    useState(false);

  const columns = [
    "To Do",
    "In Progress",
    "In Review",
    "Done",
  ];

  const handleCreateTask = (
    newTask
  ) => {

    setTasks((prev) => [
      ...prev,
      newTask,
    ]);
  };

  return (
    <div className="flex h-full flex-col">

      <div className="mb-8 flex items-start justify-between">

        <div>

          <h1
            className="
              text-5xl font-bold
              text-slate-950
            "
          >
            Task Board
          </h1>

          <p
            className="
              mt-2 text-lg
              text-slate-500
            "
          >
            Track work across
            To Do,
            In Progress,
            In Review,
            and Done.
          </p>

        </div>

        <button
          onClick={() =>
            setCreateOpen(true)
          }
          className="
            rounded-2xl
            bg-slate-950
            px-6 py-4
            font-semibold text-white
            transition
            hover:bg-slate-800
          "
        >
          New Task
        </button>

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
            tasks.filter(
              (task) =>
                task.status === column
            );

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