import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Projects from "./pages/Projects";
import UsersTeams from "./pages/UsersTeams";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board" element={<Board />} />
        <Route path="/projects" element={<Projects />} />
        <Route
          path="/users"
                element={
         <RoleRoute allowedRoles={["ADMIN", "MANAGER"]}>
      <UsersTeams />
    </RoleRoute>
  }
/>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}