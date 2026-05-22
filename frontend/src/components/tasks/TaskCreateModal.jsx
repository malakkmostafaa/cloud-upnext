/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import api from "../../api/api";
import { createTask, uploadTaskImage } from "../../services/tasksService";
import { listProjects } from "../../services/projectsService";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const initialForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  deadline: "",
  assigneeId: "",
  teamId: "",
  teamName: "",
  projectId: "",
};

export default function TaskCreateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const assignees = users.filter((u) => u.role === "EMPLOYEE");

  useEffect(() => {
    if (!open) return;

    setForm(initialForm);
    setError("");
    setFieldErrors([]);
    setSelectedImage(null);
    setImagePreviewUrl("");

    let cancelled = false;
    setLoadingData(true);

    Promise.all([listProjects(), api.get("/api/users")])
      .then(([projectData, usersResponse]) => {
        if (cancelled) return;

        setProjects(Array.isArray(projectData) ? projectData : []);

        const userData = usersResponse.data;
        setUsers(Array.isArray(userData) ? userData : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load form data."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAssigneeChange(email) {
    const user = assignees.find((u) => u.email === email);

    setForm((prev) => ({
      ...prev,
      assigneeId: email,
      teamId: user?.teamId ?? "",
      teamName: user?.teamName ?? user?.teamId ?? "",
      projectId: "",
    }));
  }

  const availableProjects = projects.filter(
    (p) => p.teamId === form.teamId || p.teamId === "all"
  );

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    setError("");
    setFieldErrors([]);

    if (!file) {
      setSelectedImage(null);
      setImagePreviewUrl("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setSelectedImage(null);
      setImagePreviewUrl("");
      setError("Only JPEG, PNG, and WEBP images are allowed.");
      return;
    }

    const maxSizeInMb = 5;
    const maxSizeInBytes = maxSizeInMb * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      setSelectedImage(null);
      setImagePreviewUrl("");
      setError(`Image must be smaller than ${maxSizeInMb}MB.`);
      return;
    }

    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors([]);

    if (!form.teamId) {
      setError(
        "The selected employee has no team assigned. Assign them to a team first."
      );
      return;
    }

    setSubmitting(true);

    try {
      const createdTask = await createTask({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        deadline: new Date(form.deadline).toISOString(),
        assigneeId: form.assigneeId,
        teamId: form.teamId,
        projectId: form.projectId,
      });

      let finalTask = createdTask;

      if (selectedImage) {
        finalTask = await uploadTaskImage(createdTask.taskId, selectedImage);
      }

      onCreated?.(finalTask);
      onClose();
    } catch (err) {
      const data = err.response?.data;

      setError(data?.message || err.message || "Failed to create task.");

      if (Array.isArray(data?.details)) {
        setFieldErrors(data.details);
      }
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
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
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

          <form
            id="create-task-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
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
                  disabled={loadingData}
                >
                  <option value="" disabled>
                    {loadingData
                      ? "Loading employees..."
                      : assignees.length === 0
                        ? "No employees found"
                        : "Select employee"}
                  </option>

                  {assignees.map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.username || u.email}
                      {u.teamName ? ` (${u.teamName})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Team">
                <input
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                  value={form.teamName || "— follows the assignee —"}
                  readOnly
                />
              </Field>
            </div>

            <Field label="Project" required>
              <select
                className={inputClass}
                value={form.projectId}
                onChange={(e) => update("projectId", e.target.value)}
                required
                disabled={loadingData || !form.teamId}
              >
                <option value="" disabled>
                  {loadingData
                    ? "Loading projects..."
                    : !form.teamId
                      ? "Select an assignee first"
                      : availableProjects.length === 0
                        ? "No projects for this team"
                        : "Select project"}
                </option>

                {availableProjects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Optional Task Image">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <input
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#22b8b0] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#159c96]"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  disabled={submitting}
                />

                <p className="mt-2 text-xs text-slate-400">
                  Optional. Supported formats: PNG, JPEG, WEBP. Maximum size:
                  5MB.
                </p>

                {selectedImage && (
                  <div className="mt-4 rounded-2xl bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {selectedImage.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreviewUrl("");
                        }}
                        className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>

                    {imagePreviewUrl && (
                      <img
                        src={imagePreviewUrl}
                        alt="Selected task preview"
                        className="mt-3 h-32 w-full rounded-xl object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            </Field>
          </form>
        </div>

        {/* Sticky footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-task-form"
            disabled={submitting || loadingData}
            className="rounded-xl bg-[#22b8b0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#159c96] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? selectedImage
                ? "Creating & uploading..."
                : "Creating..."
              : "Create Task"}
          </button>
        </div>
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