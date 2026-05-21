import {
  LayoutDashboard,
  KanbanSquare,
  FolderKanban,
  Users,
  LogOut,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function SidebarLink({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isActive
            ? "bg-[#dff7f5] text-[#159c96]"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`
      }
    >
      <Icon size={18} />
      {children}
    </NavLink>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout, isAdmin, isManager } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#eef6f8] p-4">
      <aside className="fixed left-4 top-4 h-[calc(100vh-2rem)] w-72 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/80">
        <div className="mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dff7f5] text-xl font-bold text-[#159c96]">
            U
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-950">UpNext</h1>
          <p className="mt-1 text-sm text-slate-400">Team task management</p>
        </div>

        <nav className="space-y-2">
          <SidebarLink to="/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>
          <SidebarLink to="/board" icon={KanbanSquare}>Task Board</SidebarLink>
          <SidebarLink to="/projects" icon={FolderKanban}>Projects</SidebarLink>

          {(isAdmin || isManager) && (
            <SidebarLink to="/users" icon={Users}>Users & Teams</SidebarLink>
          )}
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="mb-4 rounded-3xl bg-[#f7fbfc] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22b8b0] text-sm font-bold text-white">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || user?.email || "Unknown"}
                </p>
                <p className="text-xs text-slate-400">
                  {user?.role || "No Role"} {user?.teamName ? `· ${user.teamName}` : ""}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-80 min-h-screen rounded-[2rem] bg-[#f8fcfd] p-8 shadow-xl shadow-slate-200/70">
        <Outlet />
      </main>
    </div>
  );
}