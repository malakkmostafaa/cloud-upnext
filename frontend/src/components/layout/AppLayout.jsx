import { LayoutDashboard, KanbanSquare, FolderKanban, Users, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { mockUser } from "../../data/mockData";

function SidebarLink({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

  const handleLogout = () => {
    localStorage.removeItem("upnext_token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-full w-72 border-r border-slate-200 bg-white px-5 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">UpNext</h1>
          <p className="mt-1 text-sm text-slate-500">Team task management</p>
        </div>

        <nav className="space-y-2">
          <SidebarLink to="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/board" icon={KanbanSquare}>
            Task Board
          </SidebarLink>
          <SidebarLink to="/projects" icon={FolderKanban}>
            Projects
          </SidebarLink>
          <SidebarLink to="/users" icon={Users}>
            Users & Teams
          </SidebarLink>
        </nav>

        <div className="absolute bottom-6 left-5 right-5">
          <div className="mb-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{mockUser.name}</p>
            <p className="text-xs text-slate-500">{mockUser.role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-72 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
}