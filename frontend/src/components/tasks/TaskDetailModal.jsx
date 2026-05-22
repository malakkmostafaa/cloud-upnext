import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { updateTask, deleteTask } from "../../services/tasksService";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const STATUSES = [
  { value: "TO_DO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

const inputClass =
  "w-full rounded-xl border border-[#ccebed] bg-[#f7fbfc] px-4 py-2.5 text-sm outline-none focus:border-[#22b8b0]";

function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/**
 * View / edit / delete a single task in one modal (TASK-07, TASK-08, TASK-09).
 *
 * @param {object}   props
 * @param {boolean}  props.open
 * @param {object}   props.task        - raw task object from the API
 * @param {boolean}  props.canManage   - true for managers/admins
 * @param {Function} props.onClose
 * @param {Function} props.onUpdated   - (updatedTask) => void
 * @param {Function} props.onDeleted   - (taskId) => void
 */
export default function TaskDetailModal({
  open,
  task,
  canManage,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    if (!open || !task) return;

    setEditing(false);
    setSaving(false);
    setDeleting(false);
    setError("");
    setFieldErrors([]);
    setForm({
      title: task.title ?? "",
      description: task.description ?? "",
      priority: task.priority ?? "MEDIUM",
      status: task.status ?? "TO_DO",
      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
      assigneeId: task.assigneeId ?? "",
      teamId: task.teamId ?? "",
    });
  }, [open, task]);

  if (!open || !task) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setFieldErrors([]);
    setSaving(true);

    try {
      const updated = await updateTask(task.taskId, {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        status: form.status,
        deadline: form.deadline,
        assigneeId: form.assigneeId,
        teamId: form.teamId,
      });
      onUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || err.message || "Failed to update task.");
      if (Array.isArray(data?.details)) setFieldErrors(data.details);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError("");
    setDeleting(true);

    try {
      await deleteTask(task.taskId);
      onDeleted?.(task.taskId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete task.");
      setDeleting(false);
    }
  }

  const statusHistory = Array.isArray(task.statusHistory)
    ? task.statusHistory
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#159c96]">
              {editing ? "Edit Task" : "Task Details"}
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">
              {task.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium">{error}</p>
            {fieldErrors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs">
                {fieldErrors.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Title" required>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                maxLength={200}
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                className={inputClass}
                rows={3}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                maxLength={5000}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Priority" required>
                <select
                  className={inputClass}
                  value={form.priority}
                  onChange={(e) => update("priority", e.target.value)}
                  required
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status" required>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  required
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Deadline" required>
                <input
                  className={inputClass}
                  type="date"
                  value={form.deadline}
                  onChange={(e) => update("deadline", e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Assignee ID" required>
                <input
                  className={inputClass}
                  value={form.assigneeId}
                  onChange={(e) => update("assigneeId", e.target.value)}
                  required
                />
              </Field>

              <Field label="Team ID" required>
                <input
                  className={inputClass}
                  value={form.teamId}
                  onChange={(e) => update("teamId", e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#22b8b0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#159c96] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Status" value={statusLabel(task.status)} />
              <DetailRow label="Priority" value={task.priority} />
              <DetailRow
                label="Deadline"
                value={task.deadline ? task.deadline.slice(0, 10) : "—"}
              />
              <DetailRow label="Team" value={task.teamId || "—"} />
              <DetailRow label="Assignee" value={task.assigneeId || "—"} />
              <DetailRow label="Project" value={task.projectId || "—"} />
              <DetailRow label="Created by" value={task.createdBy || "—"} />
              <DetailRow label="Created at" value={formatDateTime(task.createdAt)} />
            </div>

            <div className="mt-4">
              <p className="mb-1 text-sm font-medium text-slate-700">
                Description
              </p>
              <p className="rounded-xl bg-[#f7fbfc] px-4 py-3 text-sm text-slate-600">
                {task.description || "No description provided."}
              </p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Status history
              </p>
              {statusHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No changes recorded.</p>
              ) : (
                <ol className="space-y-1.5">
                  {statusHistory.map((entry, i) => (
                    <li
                      key={`${entry.at}-${i}`}
                      className="flex items-center gap-2 rounded-lg bg-[#f7fbfc] px-3 py-2 text-xs text-slate-600"
                    >
                      <span className="font-semibold text-[#159c96]">
                        {statusLabel(entry.status)}
                      </span>
                      <span className="text-slate-400">
                        {formatDateTime(entry.at)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {canManage && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-[#22b8b0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#159c96]"
                >
                  Edit Task
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm text-slate-700">{value}</p>
    </div>
  );
}
