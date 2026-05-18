import * as Dialog from "@radix-ui/react-dialog";

export default function TaskDetailModal({
  open,
  onOpenChange,
  task,
}) {
  if (!task) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>

        <Dialog.Overlay
          className="
            fixed inset-0 bg-black/50
            backdrop-blur-sm z-40
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

          <div className="mb-6 flex items-start justify-between">

            <div>
              <Dialog.Title
                className="
                  text-3xl font-bold
                  text-slate-950
                "
              >
                {task.title}
              </Dialog.Title>

              <p className="mt-2 text-slate-500">
                {task.description}
              </p>
            </div>

            <Dialog.Close
              className="
                rounded-full p-2
                hover:bg-slate-100
              "
            >
              ✕
            </Dialog.Close>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Team
              </p>

              <p className="mt-1 font-semibold">
                {task.teamName}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Assignee
              </p>

              <p className="mt-1 font-semibold">
                {task.assigneeName}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Priority
              </p>

              <p className="mt-1 font-semibold">
                {task.priority}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Deadline
              </p>

              <p className="mt-1 font-semibold">
                {task.deadline}
              </p>
            </div>

          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 font-semibold">
              Comments
            </p>

            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              No comments yet
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}