import { useEffect, useMemo, useState } from "react";
import Select from "react-select";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "52px",
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

  const userOptions = useMemo(() => {
    return users
      .filter((user) => user.role === "EMPLOYEE")
      .map((user) => ({
        value: user.userId || user.email,
        label: `${user.email || user.username} — ${
          user.teamName || user.teamId || "No team"
        }`,
      }));
  }, [users]);

  const teamOptions = useMemo(() => {
    return teams.map((team) => ({
      value: team.teamId,
      label: team.name,
    }));
  }, [teams]);

  async function loadData() {
    try {
      setError("");
      setLoading(true);

      const token = localStorage.getItem("idToken");

      const [usersResponse, teamsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersResponse.ok) throw new Error("Failed to load users.");
      if (!teamsResponse.ok) throw new Error("Failed to load teams.");

      setUsers(await usersResponse.json());
      setTeams(await teamsResponse.json());
    } catch (err) {
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
        body: JSON.stringify({ name: teamName }),
      });

      if (!response.ok) throw new Error("Failed to create team.");

      setTeamName("");
      setSuccess("Team created successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Something went wrong while creating team.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAssignUserToTeam(e) {
    e.preventDefault();

    if (!selectedUser || !selectedTeam) {
      setError("Please select an employee and a team.");
      return;
    }

    const selectedUserObject = users.find(
      (user) => (user.userId || user.email) === selectedUser
    );

    if (!selectedUserObject) {
      setError("Selected user was not found.");
      return;
    }

    if (selectedUserObject.role !== "EMPLOYEE") {
      setError("Only employees can be assigned to teams.");
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

      if (!response.ok) throw new Error("Failed to assign user to team.");

      setSelectedUser("");
      setSelectedTeam("");
      setSuccess("User assigned to team successfully.");
      await loadData();
    } catch (err) {
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
        <p className="text-sm font-semibold text-[#159c96]">Administration</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Users & Teams</h2>
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
        <div className="mb-6 rounded-2xl bg-[#dff7f5] px-4 py-3 text-sm font-semibold text-[#159c96]">
          {success}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-sm shadow-slate-200">
          Loading users and teams...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <h3 className="mb-4 text-lg font-bold text-slate-950">
              Assign Employee to Team
            </h3>

            <form onSubmit={handleAssignUserToTeam} className="grid gap-3 md:grid-cols-3">
              <Select
                options={userOptions}
                value={
                  userOptions.find((option) => option.value === selectedUser) || null
                }
                onChange={(option) => setSelectedUser(option?.value || "")}
                placeholder="Select employee"
                styles={selectStyles}
                isSearchable
              />

              <Select
                options={teamOptions}
                value={
                  teamOptions.find((option) => option.value === selectedTeam) || null
                }
                onChange={(option) => setSelectedTeam(option?.value || "")}
                placeholder="Select team"
                styles={selectStyles}
                isSearchable
              />

              <button
                type="submit"
                disabled={assigning}
                className="rounded-2xl bg-[#22b8b0] px-4 py-3 text-sm font-semibold text-white hover:bg-[#159c96] disabled:opacity-60"
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </form>

            <p className="mt-3 text-xs text-slate-400">
              Managers and admins are not assigned to teams. After changing an
              employee&apos;s team, that employee must log out and log in again to
              get a fresh Cognito token.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <h3 className="mb-4 text-lg font-bold text-slate-950">Users</h3>

              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.userId || user.email}
                    className="rounded-3xl bg-[#f7fbfc] px-4 py-3"
                  >
                    <p className="font-bold text-slate-900">
                      {user.name || user.email || user.username}
                    </p>

                    <p className="text-sm text-slate-400">{user.email}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {user.role}
                      </span>

                      <span className="rounded-full bg-[#dff7f5] px-3 py-1 text-xs font-semibold text-[#159c96]">
                        {user.role === "EMPLOYEE"
                          ? user.teamName || user.teamId || "No team"
                          : "Not team-based"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <h3 className="mb-4 text-lg font-bold text-slate-950">Teams</h3>

              <form onSubmit={handleCreateTeam} className="mb-5 flex gap-2">
                <input
                  className="flex-1 rounded-2xl border border-[#ccebed] bg-[#f7fbfc] px-4 py-3 text-sm outline-none transition focus:border-[#22b8b0] focus:bg-white focus:ring-4 focus:ring-[#dff7f5]"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="New team name"
                />

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-2xl bg-[#22b8b0] px-4 py-3 text-sm font-semibold text-white hover:bg-[#159c96] disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </form>

              <div className="space-y-3">
                {teams.map((team) => (
                  <div
                    key={team.teamId}
                    className="rounded-3xl bg-[#f7fbfc] px-4 py-3"
                  >
                    <p className="font-bold text-slate-900">{team.name}</p>
                    <p className="text-sm text-slate-400">ID: {team.teamId}</p>
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