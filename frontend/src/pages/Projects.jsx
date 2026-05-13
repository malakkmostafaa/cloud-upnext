import { mockProjects } from "../data/mockData";

export default function Projects() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">Projects</h2>
          <p className="mt-2 text-slate-500">
            Manage projects and link tasks to them.
          </p>
        </div>

        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          New Project
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <div
            key={project.projectId}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-950">{project.name}</h3>
            <p className="mt-2 text-sm text-slate-500">{project.description}</p>

            <div className="mt-5 flex gap-2">
              <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Edit
              </button>
              <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}