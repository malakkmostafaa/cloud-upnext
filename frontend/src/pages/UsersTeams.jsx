import { mockTeams } from "../data/mockData";

const mockUsers = [
  { userId: "ali", name: "Ali", email: "ali@upnext.com", role: "MANAGER", teamId: "all" },
  { userId: "sara", name: "Sara", email: "sara@upnext.com", role: "EMPLOYEE", teamId: "frontend" },
  { userId: "omar", name: "Omar", email: "omar@upnext.com", role: "EMPLOYEE", teamId: "backend" },
];

export default function UsersTeams() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-950">Users & Teams</h2>
        <p className="mt-2 text-slate-500">
          Manage team membership and role visibility.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Users</h3>

          <div className="space-y-3">
            {mockUsers.map((user) => (
              <div
                key={user.userId}
                className="rounded-2xl bg-slate-50 px-4 py-3"
              >
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {user.role} · {user.teamId}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Teams</h3>

          <div className="space-y-3">
            {mockTeams.map((team) => (
              <div
                key={team.teamId}
                className="rounded-2xl bg-slate-50 px-4 py-3"
              >
                <p className="font-medium text-slate-900">{team.name}</p>
                <p className="text-sm text-slate-500">ID: {team.teamId}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}