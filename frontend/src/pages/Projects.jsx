import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Projects() {
  const { user } = useAuth();

  const canManageProjects =
    user?.role === "MANAGER" || user?.role === "ADMIN";

  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("frontend");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  async function loadProjects() {
    try {
      setError("");
      setLoading(true);

      const token = localStorage.getItem("idToken");

      const response = await fetch(`${apiBaseUrl}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load projects.");
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err.message || "Something went wrong while loading projects.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProject(e) {
    e.preventDefault();

    if (!canManageProjects) return;

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    try {
      setError("");
      setSaving(true);

      const token = localStorage.getItem("idToken");

      const url = editingProjectId
        ? `${apiBaseUrl}/api/projects/${editingProjectId}`
        : `${apiBaseUrl}/api/projects`;

      const method = editingProjectId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          teamId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          editingProjectId
            ? "Failed to update project."
            : "Failed to create project."
        );
      }

      resetForm();
      await loadProjects();
    } catch (err) {
      setError(err.message || "Something went wrong while saving project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(projectId) {
    if (!canManageProjects) return;

    try {
      setError("");

      const token = localStorage.getItem("idToken");

      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete project.");
      }

      await loadProjects();
    } catch (err) {
      setError(err.message || "Something went wrong while deleting project.");
    }
  }

  function handleEditClick(project) {
    setEditingProjectId(project.projectId);
    setName(project.name);
    setDescription(project.description || "");
    setTeamId(project.teamId || "frontend");
    setShowForm(true);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setTeamId("frontend");
    setEditingProjectId(null);
    setShowForm(false);
  }

  function handleNewProjectClick() {
    if (showForm) {
      resetForm();
    } else {
      setShowForm(true);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">Projects</h2>
          <p className="mt-2 text-slate-500">
            Manage projects and link tasks to them.
          </p>
        </div>

        {canManageProjects && (
          <button
            onClick={handleNewProjectClick}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {showForm ? "Cancel" : "New Project"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {canManageProjects && showForm && (
        <form
          onSubmit={handleSaveProject}
          className="mb-6 rounded-3xl border border-slate-200 bg-white p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-slate-950">
            {editingProjectId ? "Edit Project" : "Create Project"}
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />

            <input
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />

            <select
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="qa">QA</option>
              <option value="devops">DevOps</option>
              <option value="all">All Teams</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : editingProjectId
                ? "Save Changes"
                : "Create Project"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">
          Loading projects...
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.projectId}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-950">
                {project.name}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {project.description || "No description provided."}
              </p>

              <p className="mt-3 text-xs text-slate-500">
                Team: {project.teamId}
              </p>

              {canManageProjects && (
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => handleEditClick(project)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteProject(project.projectId)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}