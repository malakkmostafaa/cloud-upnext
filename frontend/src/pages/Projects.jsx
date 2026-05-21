import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "48px",
    borderRadius: "18px",
    borderColor: state.isFocused ? "#22b8b0" : "#ccebed",
    backgroundColor: "#f7fbfc",
    boxShadow: state.isFocused ? "0 0 0 4px #dff7f5" : "none",
    cursor: "pointer",
    "&:hover": {
      borderColor: "#22b8b0",
    },
  }),

  menu: (base) => ({
    ...base,
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #d9eef2",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
    zIndex: 50,
  }),

  menuList: (base) => ({
    ...base,
    padding: "6px",
  }),

  option: (base, state) => ({
    ...base,
    borderRadius: "12px",
    backgroundColor: state.isSelected
      ? "#22b8b0"
      : state.isFocused
        ? "#dff7f5"
        : "white",
    color: state.isSelected ? "white" : "#0f172a",
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: "14px",
  }),

  placeholder: (base) => ({
    ...base,
    color: "#64748b",
    fontSize: "14px",
  }),

  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#159c96" : "#94a3b8",
    "&:hover": {
      color: "#159c96",
    },
  }),
};

export default function Projects() {
  const { user } = useAuth();

  const canManageProjects = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("frontend");
  const [teamFilter, setTeamFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  async function loadProjects() {
  try {
    setError("");
    setLoading(true);

    const response = await api.get("/projects");

    const data = response.data.projects || response.data;
    setProjects(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Failed to load projects:", err);
    setError(
      err.response?.data?.message ||
        err.message ||
        "Something went wrong while loading projects."
    );
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

    const payload = {
      name,
      description,
      teamId,
    };

    if (editingProjectId) {
      await api.put(`/projects/${editingProjectId}`, payload);
    } else {
      await api.post("/projects", payload);
    }

    resetForm();
    await loadProjects();
  } catch (err) {
    console.error("Failed to save project:", err);
    setError(
      err.response?.data?.message ||
        err.message ||
        "Something went wrong while saving project."
    );
  } finally {
    setSaving(false);
  }
}

 async function handleDeleteProject(projectId) {
  if (!canManageProjects) return;

  try {
    setError("");

    await api.delete(`/projects/${projectId}`);

    await loadProjects();
  } catch (err) {
    console.error("Failed to delete project:", err);
    setError(
      err.response?.data?.message ||
        err.message ||
        "Something went wrong while deleting project."
    );
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects();
  }, []);

  const teams = ["all", ...new Set(projects.map((p) => p.teamId).filter(Boolean))];

  const teamFilterOptions = useMemo(() => {
    return teams.map((team) => ({
      value: team,
      label: team === "all" ? "All teams" : team,
    }));
  }, [teams]);

  const projectTeamOptions = [
    { value: "frontend", label: "Frontend" },
    { value: "backend", label: "Backend" },
    { value: "qa", label: "QA" },
    { value: "devops", label: "DevOps" },
    { value: "all", label: "All Teams" },
  ];

  const filteredProjects = canManageProjects
    ? teamFilter === "all"
      ? projects
      : projects.filter((project) => project.teamId === teamFilter)
    : projects.filter(
        (project) =>
          project.teamId === user?.teamId ||
          project.teamId === user?.teamName ||
          project.teamName === user?.teamId ||
          project.teamName === user?.teamName
      );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#159c96]">Workspace</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Projects</h2>
          <p className="mt-2 text-slate-500">
            Manage projects and link tasks to the correct team.
          </p>
        </div>

        {canManageProjects && (
          <button
            onClick={handleNewProjectClick}
            className="rounded-2xl bg-[#22b8b0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#159c96]"
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

      {canManageProjects && (
        <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm shadow-slate-200">
          <div className="w-full md:w-72">
            <Select
              options={teamFilterOptions}
              value={teamFilterOptions.find((option) => option.value === teamFilter)}
              onChange={(option) => setTeamFilter(option?.value || "all")}
              styles={selectStyles}
              isSearchable={false}
            />
          </div>
        </div>
      )}

      {canManageProjects && showForm && (
        <form
          onSubmit={handleSaveProject}
          className="mb-6 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200"
        >
          <h3 className="mb-4 text-lg font-bold text-slate-950">
            {editingProjectId ? "Edit Project" : "Create Project"}
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              className="rounded-2xl border border-slate-100 bg-[#f7fbfc] px-4 py-3 text-sm outline-none focus:border-[#22b8b0]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />

            <input
              className="rounded-2xl border border-slate-100 bg-[#f7fbfc] px-4 py-3 text-sm outline-none focus:border-[#22b8b0]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />

            <Select
              options={projectTeamOptions}
              value={projectTeamOptions.find((option) => option.value === teamId)}
              onChange={(option) => setTeamId(option?.value || "frontend")}
              styles={selectStyles}
              isSearchable={false}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-2xl bg-[#22b8b0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#159c96] disabled:opacity-60"
          >
            {saving ? "Saving..." : editingProjectId ? "Save Changes" : "Create Project"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-sm shadow-slate-200">
          Loading projects...
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.projectId}
              className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200"
            >
              <span className="rounded-full bg-[#dff7f5] px-3 py-1 text-xs font-semibold text-[#159c96]">
                {project.teamName || project.teamId}
              </span>

              <h3 className="mt-4 text-lg font-bold text-slate-950">
                {project.name}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {project.description || "No description provided."}
              </p>

              {canManageProjects && (
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => handleEditClick(project)}
                    className="rounded-2xl border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-[#f7fbfc]"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteProject(project.projectId)}
                    className="rounded-2xl border border-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}

          {!loading && filteredProjects.length === 0 && (
            <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-sm shadow-slate-200">
              No projects found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}