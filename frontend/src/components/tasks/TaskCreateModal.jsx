import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { createTask } from "../../services/tasksService";
import { listProjects } from "../../services/projectsService";

// TODO(users/teams-member): replace these with API calls to /api/users and
// /api/teams once those endpoints land. Mock data keeps the demo working today.
import { mockTeams, mockUsers } from "../../data/mockData";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const initialForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  deadline: "",
  assigneeId: "",
  teamId: "",
  projectId: "",
};

export default function TaskCreateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);

  // Employees can only be assignees; filter out admins and managers.
  const assignees = mockUsers.filter((u) => u.role === "EMPLOYEE");

  useEffect(() => {
    if (!open) return;

    setForm(initialForm);
    setError("");
    setFieldErrors([]);

    let cancelled = false;
    setLoadingProjects(true);

    listProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load projects."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAssigneeChange(userId) {
    const user = assignees.find((u) => u.userId === userId);
    setForm((prev) => ({
      ...prev,
      assigneeId: userId,
      // Auto-fill team from the chosen assignee — keeps the data consistent
      // with the spec's "every employee belongs to exactly one team".
      teamId: user?.teamId ?? prev.teamId,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors([]);
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        description: form.description || undefined,
        deadline: new Date(form.deadline).toISOString(),
      };

      const task = await createTask(payload);
      onCreated?.(task);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || err.message || "Failed to create task.");
      if (Array.isArray(data?.details)) setFieldErrors(data.details);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-950">New Task</h3>
            <p className="mt-1 text-sm text-slate-500">
              Assign a task to an employee on any team.
            </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid gap-4 md:grid-cols-2">
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
            <Field label="Assignee" required>
              <select
                className={inputClass}
                value={form.assigneeId}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select employee
                </option>
                {assignees.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.name} ({u.teamName})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Team" required>
              <select
                className={inputClass}
                value={form.teamId}
                onChange={(e) => update("teamId", e.target.value)}
                required
              >
                <option value="" disabled>
                  Select team
                </option>
                {mockTeams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Project" required>
            <select
              className={inputClass}
              value={form.projectId}
              onChange={(e) => update("projectId", e.target.value)}
              required
              disabled={loadingProjects}
            >
              <option value="" disabled>
                {loadingProjects ? "Loading projects..." : "Select project"}
              </option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          {/* TODO(s3-member): when the image-upload widget is ready, render it
              here and store the resulting S3 object key in `form.imageKey`. */}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingProjects}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900";

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
