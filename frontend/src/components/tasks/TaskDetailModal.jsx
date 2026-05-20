import {
  useEffect,
  useState,
} from "react";

import * as Dialog from "@radix-ui/react-dialog";
import { useAuth }
  from "../../context/AuthContext";

export default function TaskDetailModal({
  open,
  onOpenChange,
  task,
  onSaveTask,
  onDeleteTask,
}) {
  const { user } =
  useAuth();

  const [isEditing, setIsEditing] =
    useState(false);

  const [editedTask, setEditedTask] =
    useState(task);

  useEffect(() => {

    setEditedTask(task);

  }, [task]);

  if (!task) return null;

  async function handleSave() {

    await onSaveTask(editedTask);

    setIsEditing(false);
  }

  function handleDelete() {

    onDeleteTask(task.taskId);

    onOpenChange(false);
  }

  return (

    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >

      <Dialog.Portal>

        <Dialog.Overlay
          className="
            fixed inset-0 z-40
            bg-black/50
            backdrop-blur-sm
          "
        />

        <Dialog.Content
          className="
            fixed left-1/2 top-1/2
            z-50 w-[95%]
            max-w-2xl
            -translate-x-1/2
            -translate-y-1/2
            rounded-3xl
            bg-white p-8
            shadow-2xl
          "
        >

          <div className="mb-6 flex items-start justify-between">

            <div className="flex-1">

             {isEditing &&
(
  user?.role === "manager" ||
  user?.role === "admin"
) ? (

                <input
                  value={editedTask?.title || ""}
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      title: e.target.value,
                    })
                  }
                  className="
                    w-full rounded-2xl
                    border border-slate-200
                    px-4 py-3
                    text-3xl font-bold
                    outline-none
                  "
                />

              ) : (

                <>
                  <Dialog.Title
                    className="
                      text-3xl font-bold
                      text-slate-950
                    "
                  >
                    {task.title}
                  </Dialog.Title>

                {isEditing &&
(
  user?.role === "manager" ||
  user?.role === "admin"
) ? (

                    <textarea
                      value={
                        editedTask?.description || ""
                      }
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          description:
                            e.target.value,
                        })
                      }
                      className="
                        mt-3 w-full
                        rounded-2xl
                        border border-slate-200
                        p-4 outline-none
                      "
                    />

                  ) : (

                    <p className="mt-2 text-slate-500">
                      {task.description}
                    </p>

                  )}

                </>

              )}

            </div>

            <div className="ml-4 flex gap-2">

              {isEditing ? (

  <button
    onClick={handleSave}
    className="
      rounded-xl
      bg-green-600
      px-4 py-2
      text-sm font-semibold
      text-white
    "
  >
    Save
  </button>

) : (

  (
  user?.role === "manager" ||
  user?.role === "admin" ||
  user?.role === "employee"
) && (

    <button
      onClick={() =>
        setIsEditing(true)
      }
      className="
        rounded-xl
        bg-slate-950
        px-4 py-2
        text-sm font-semibold
        text-white
      "
    >
      Edit
    </button>

  )

)}

              {(
  user?.role === "manager" ||
  user?.role === "admin"
) && (

  <button
    onClick={handleDelete}
    className="
      rounded-xl
      bg-red-600
      px-4 py-2
      text-sm font-semibold
      text-white
    "
  >
    Delete
  </button>

)}

              <Dialog.Close
                className="
                  rounded-full p-2
                  hover:bg-slate-100
                "
              >
                ✕
              </Dialog.Close>

            </div>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Team
              </p>

              {isEditing &&
(
  user?.role === "manager" ||
  user?.role === "admin"
) ? (

                <input
                  value={
                    editedTask?.teamName || ""
                  }
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      teamName:
                        e.target.value,
                    })
                  }
                  className="
                    mt-2 w-full
                    rounded-xl
                    border border-slate-200
                    px-3 py-2
                  "
                />

              ) : (

                <p className="mt-1 font-semibold">
                  {task.teamName}
                </p>

              )}

            </div>

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Assignee
              </p>

              {isEditing &&
(
  user?.role === "manager" ||
  user?.role === "admin"
) ? (

                <input
                  value={
                    editedTask?.assigneeName || ""
                  }
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      assigneeName:
                        e.target.value,
                    })
                  }
                  className="
                    mt-2 w-full
                    rounded-xl
                    border border-slate-200
                    px-3 py-2
                  "
                />

              ) : (

                <p className="mt-1 font-semibold">
                  {task.assigneeName}
                </p>

              )}

            </div>

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Status
              </p>

              {isEditing ? (

                <select
                  value={
                    editedTask?.status || ""
                  }
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      status:
                        e.target.value,
                    })
                  }
                  className="
                    mt-2 w-full
                    rounded-xl border
                    border-slate-200
                    px-3 py-2
                  "
                >

                  <option>
                    To Do
                  </option>

                  <option>
                    In Progress
                  </option>

                  <option>
                    In Review
                  </option>

                  <option>
                    Done
                  </option>

                </select>

              ) : (

                <p className="mt-1 font-semibold">
                  {task.status}
                </p>

              )}

            </div>

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Priority
              </p>
{isEditing &&
(
  user?.role === "manager" ||
  user?.role === "admin"
) ? (

                <select
                  value={
                    editedTask?.priority || ""
                  }
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      priority:
                        e.target.value,
                    })
                  }
                  className="
                    mt-2 w-full
                    rounded-xl border
                    border-slate-200
                    px-3 py-2
                  "
                >

                  <option>
                    Low
                  </option>

                  <option>
                    Medium
                  </option>

                  <option>
                    High
                  </option>

                </select>

              ) : (

                <p className="mt-1 font-semibold">
                  {task.priority}
                </p>

              )}

            </div>

            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">

              <p className="text-sm text-slate-500">
                Deadline
              </p>

             {isEditing &&
(
  user?.role === "manager" ||
  user?.role === "admin"
) ? (

                <input
                  type="date"
                  value={
                    editedTask?.deadline || ""
                  }
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      deadline:
                        e.target.value,
                    })
                  }
                  className="
                    mt-2 rounded-xl
                    border border-slate-200
                    px-3 py-2
                  "
                />

              ) : (

                <p className="mt-1 font-semibold">
                  {task.deadline}
                </p>

              )}

            </div>

          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">

            <p className="mb-2 font-semibold">
              Comments
            </p>

            <div
              className="
                rounded-xl border
                border-dashed
                border-slate-300
                p-6 text-center
                text-sm text-slate-400
              "
            >
              No comments yet
            </div>

          </div>

        </Dialog.Content>

      </Dialog.Portal>

    </Dialog.Root>
  );
}