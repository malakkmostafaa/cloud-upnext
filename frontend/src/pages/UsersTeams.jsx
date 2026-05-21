import { useEffect, useState } from "react";

export default function UsersTeams() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  async function loadData() {
    try {
      setError("");
      setLoading(true);

      const token = localStorage.getItem("idToken");

      const [usersResponse, teamsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${apiBaseUrl}/api/teams`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!usersResponse.ok) {
        throw new Error("Failed to load users.");
      }

      if (!teamsResponse.ok) {
        throw new Error("Failed to load teams.");
      }

      const usersData = await usersResponse.json();
      const teamsData = await teamsResponse.json();

      setUsers(usersData);
      setTeams(teamsData);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while loading data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();

    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setCreating(true);

      const token = localStorage.getItem("idToken");

      const response = await fetch(`${apiBaseUrl}/api/teams`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create team.");
      }

      setTeamName("");
      setSuccess("Team created successfully.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while creating team.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAssignUserToTeam(e) {
    e.preventDefault();

    if (!selectedUser || !selectedTeam) {
      setError("Please select a user and a team.");
      return;
    }

    const team = teams.find((t) => t.teamId === selectedTeam);

    if (!team) {
      setError("Selected team was not found.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setAssigning(true);

      const token = localStorage.getItem("idToken");

      const response = await fetch(
        `${apiBaseUrl}/api/users/${encodeURIComponent(selectedUser)}/team`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: team.teamId,
            teamName: team.name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign user to team.");
      }

      setSelectedUser("");
      setSelectedTeam("");
      setSuccess("User assigned to team successfully.");

      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while assigning user.");
    } finally {
      setAssigning(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-950">Users & Teams</h2>

        <p className="mt-2 text-slate-500">
          Manage users, teams, and team membership.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">
          Loading users and teams...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Assign User to Team */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-950">
              Assign User to Team
            </h3>

            <form
              onSubmit={handleAssignUserToTeam}
              className="grid gap-3 md:grid-cols-3"
            >
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option
                    key={user.userId || user.email}
                    value={user.userId || user.email}
                  >
                    {user.email || user.username} — {user.teamName || user.teamId || "No team"}
                  </option>
                ))}
              </select>

              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={assigning}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </form>

            <p className="mt-3 text-xs text-slate-500">
              After changing a user team, that user must log out and log in again
              to get a fresh Cognito token.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Users */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-950">
                Users
              </h3>

              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.userId || user.email}
                    className="rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <p className="font-medium text-slate-900">
                      {user.name || user.email || user.username}
                    </p>

                    <p className="text-sm text-slate-500">{user.email}</p>

                    <p className="mt-1 text-xs text-slate-500">
                      {user.role} · {user.teamName || user.teamId || "No team"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Teams */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-950">Teams</h3>
              </div>

              <form onSubmit={handleCreateTeam} className="mb-5 flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="New team name"
                />

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </form>

              <div className="space-y-3">
                {teams.map((team) => (
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
      )}
    </div>
  );
}