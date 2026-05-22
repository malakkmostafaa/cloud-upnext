/* eslint-disable no-undef */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { X, Paperclip, MessageCircle, Image as ImageIcon, Upload } from "lucide-react";

import {
  updateTask,
  deleteTask,
  getTaskImageViewUrl,
} from "../../services/tasksService";
import {
  listTaskComments,
  createTaskComment,
} from "../../services/commentsService";
import {
  uploadTaskAttachment,
  getAttachmentViewUrl,
  deleteTaskAttachment,
} from "../../services/attachmentsService";

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

function formatFileSize(size) {
  const value = Number(size) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function isImageAttachment(attachment) {
  return attachment?.type === "IMAGE" || attachment?.contentType?.startsWith("image/");
}

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

  const [taskImage, setTaskImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentOpeningId, setAttachmentOpeningId] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);

  const activeAttachments = useMemo(() => {
    const list = Array.isArray(task?.attachments) ? task.attachments : [];
    return list.filter((item) => !item.deletedAt);
  }, [task]);

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

    async function loadTaskExtras() {
      setLoadingImage(true);
      setLoadingComments(true);

      try {
        const [imageResult, commentsResult] = await Promise.allSettled([
          getTaskImageViewUrl(task.taskId),
          listTaskComments(task.taskId),
        ]);

        if (imageResult.status === "fulfilled") {
          setTaskImage(imageResult.value?.imageUrl ? imageResult.value : null);
        } else {
          setTaskImage(null);
        }

        if (commentsResult.status === "fulfilled") {
          setComments(commentsResult.value);
        } else {
          setComments([]);
        }
      } finally {
        setLoadingImage(false);
        setLoadingComments(false);
      }
    }

    loadTaskExtras();
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

  async function handleAddComment(e) {
    e.preventDefault();

    if (!commentText.trim()) return;

    setCommenting(true);
    setError("");

    try {
      const comment = await createTaskComment(task.taskId, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add comment.");
    } finally {
      setCommenting(false);
    }
  }

  async function handleAttachmentUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setAttachmentUploading(true);
    setError("");

    try {
      const result = await uploadTaskAttachment(task.taskId, file);
      const updatedTask = result.task || result;

      onUpdated?.(updatedTask);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload attachment."
      );
    } finally {
      setAttachmentUploading(false);
    }
  }

  async function handleOpenAttachment(attachment) {
    setAttachmentOpeningId(attachment.attachmentId);
    setError("");

    try {
      const result = await getAttachmentViewUrl(
        task.taskId,
        attachment.attachmentId
      );

      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to open attachment."
      );
    } finally {
      setAttachmentOpeningId("");
    }
  }

  async function handleDeleteAttachment(attachment) {
    setError("");

    try {
      const result = await deleteTaskAttachment(
        task.taskId,
        attachment.attachmentId
      );

      const updatedTask = result.task || result;
      onUpdated?.(updatedTask);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete attachment."
      );
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
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
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
            <div className="grid gap-3 md:grid-cols-2">
            <InfoCard label="Status" value={statusLabel(task.status)} />
            <InfoCard label="Priority" value={task.priority} />
            <InfoCard
              label="Deadline"
              value={task.deadline ? task.deadline.slice(0, 10) : "No deadline"}
            />
            <InfoCard label="Team" value={task.teamName || task.teamId || "Not assigned"} />
            <InfoCard label="Assignee" value={task.assigneeName || task.assigneeId || "Unassigned"} />
            <InfoCard label="Created" value={formatDateTime(task.createdAt)} />
          </div>

            <div className="mt-4">
              <p className="mb-1 text-sm font-medium text-slate-700">
                Description
              </p>
              <p className="rounded-xl bg-[#f7fbfc] px-4 py-3 text-sm text-slate-600">
                {task.description || "No description provided."}
              </p>
            </div>

            <section className="mt-6 rounded-3xl border border-slate-100 bg-[#f7fbfc] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ImageIcon size={18} className="text-[#159c96]" />
                <h4 className="font-bold text-slate-900">Task Image</h4>
              </div>

              {loadingImage ? (
                <p className="text-sm text-slate-400">Loading image...</p>
              ) : taskImage?.imageUrl ? (
                <div>
                  <img
                    src={taskImage.imageUrl}
                    alt="Task attachment"
                    className="max-h-72 w-full rounded-2xl object-cover"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Source: {taskImage.source}
                    {taskImage.resizedExists === false ? " · resized version not ready yet" : ""}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No task image was uploaded.
                </p>
              )}
            </section>

            <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Paperclip size={18} className="text-[#159c96]" />
                  <h4 className="font-bold text-slate-900">Attachments</h4>
                </div>

                <label className="cursor-pointer rounded-xl bg-[#22b8b0] px-3 py-2 text-xs font-semibold text-white hover:bg-[#159c96]">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAttachmentUpload}
                    disabled={attachmentUploading}
                    accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,text/plain"
                  />
                  <span className="flex items-center gap-1">
                    <Upload size={14} />
                    {attachmentUploading ? "Uploading..." : "Upload"}
                  </span>
                </label>
              </div>

              {activeAttachments.length === 0 ? (
                <p className="text-sm text-slate-400">No attachments yet.</p>
              ) : (
                <div className="space-y-2">
                  {activeAttachments.map((attachment) => (
                    <div
                      key={attachment.attachmentId}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7fbfc] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {isImageAttachment(attachment) ? "🖼️ " : "📎 "}
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-slate-400">
                          {isImageAttachment(attachment) ? "Image" : "File"} ·{" "}
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAttachment(attachment)}
                          disabled={attachmentOpeningId === attachment.attachmentId}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-60"
                        >
                          {attachmentOpeningId === attachment.attachmentId
                            ? "Opening..."
                            : "Open"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment)}
                          className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle size={18} className="text-[#159c96]" />
                <h4 className="font-bold text-slate-900">Comments</h4>
              </div>

              {loadingComments ? (
                <p className="text-sm text-slate-400">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-slate-400">No comments yet.</p>
              ) : (
                <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                  {comments.map((comment) => (
                    <div
                      key={comment.commentId}
                      className="rounded-2xl bg-[#f7fbfc] px-4 py-3"
                    >
                      <div className="mb-1 flex justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {comment.authorName || "Team member"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-600">
                        {comment.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                <input
                  className={inputClass}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={commenting || !commentText.trim()}
                  className="rounded-xl bg-[#22b8b0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#159c96] disabled:opacity-60"
                >
                  {commenting ? "Sending..." : "Send"}
                </button>
              </form>
            </section>

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

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7fbfc] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}
