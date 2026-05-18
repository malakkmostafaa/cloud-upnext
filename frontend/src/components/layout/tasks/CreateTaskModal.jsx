import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

export default function CreateTaskModal({
  open,
  onOpenChange,
  onCreateTask,
}) {

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState("Medium");

  const [status, setStatus] =
    useState("To Do");

  const [assigneeName, setAssigneeName] =
    useState("");

  const [teamName, setTeamName] =
    useState("");

  const [deadline, setDeadline] =
    useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTask = {
      taskId: Date.now(),
      title,
      description,
      priority,
      status,
      assigneeName,
      teamName,
      deadline,
    };

    onCreateTask(newTask);

    onOpenChange(false);

    setTitle("");
    setDescription("");
    setPriority("Medium");
    setStatus("To Do");
    setAssigneeName("");
    setTeamName("");
    setDeadline("");
  };

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
            z-50 w-[95%] max-w-2xl
            -translate-x-1/2
            -translate-y-1/2
            rounded-3xl bg-white p-8
            shadow-2xl
          "
        >

          <div className="mb-6 flex items-center justify-between">

            <Dialog.Title
              className="
                text-3xl font-bold
                text-slate-950
              "
            >
              Create New Task
            </Dialog.Title>

            <Dialog.Close
              className="
                rounded-full p-2
                hover:bg-slate-100
              "
            >
              ✕
            </Dialog.Close>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <input
              className="
                w-full rounded-2xl
                border border-slate-200
                px-4 py-3
              "
              placeholder="Task title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              required
            />

            <textarea
              className="
                w-full rounded-2xl
                border border-slate-200
                px-4 py-3
              "
              placeholder="Description"
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
            />

            <div className="grid gap-4 md:grid-cols-2">

              <select
                className="
                  rounded-2xl
                  border border-slate-200
                  px-4 py-3
                "
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value)
                }
              >
                <option>
                  High
                </option>

                <option>
                  Medium
                </option>

                <option>
                  Low
                </option>
              </select>

              <select
                className="
                  rounded-2xl
                  border border-slate-200
                  px-4 py-3
                "
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
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

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <input
                className="
                  rounded-2xl
                  border border-slate-200
                  px-4 py-3
                "
                placeholder="Assignee"
                value={assigneeName}
                onChange={(e) =>
                  setAssigneeName(
                    e.target.value
                  )
                }
              />

              <input
                className="
                  rounded-2xl
                  border border-slate-200
                  px-4 py-3
                "
                placeholder="Team"
                value={teamName}
                onChange={(e) =>
                  setTeamName(
                    e.target.value
                  )
                }
              />

            </div>

            <input
              type="date"
              className="
                w-full rounded-2xl
                border border-slate-200
                px-4 py-3
              "
              value={deadline}
              onChange={(e) =>
                setDeadline(e.target.value)
              }
            />

            <button
              type="submit"
              className="
                w-full rounded-2xl
                bg-slate-950
                px-5 py-4
                font-semibold text-white
                hover:bg-slate-800
              "
            >
              Create Task
            </button>

          </form>

        </Dialog.Content>

      </Dialog.Portal>

    </Dialog.Root>
  );
}