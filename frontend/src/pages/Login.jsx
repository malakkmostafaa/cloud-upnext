import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockUsers } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("ali@upnext.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const foundUser = mockUsers.find(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.password === password
    );

    if (!foundUser) {
      setError("Invalid email or password.");
      return;
    }

    const { password: _, ...safeUser } = foundUser;

    login(safeUser);

    if (safeUser.role === "EMPLOYEE") {
      navigate("/board");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-950">UpNext</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your team tasks
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ali@upnext.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password123!"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Demo users:</p>
          <p>admin@upnext.com — Admin</p>
          <p>ali@upnext.com — Manager</p>
          <p>sara@upnext.com — Frontend employee</p>
          <p>omar@upnext.com — Backend employee</p>
          <p className="mt-2">Password for all: Password123!</p>
        </div>
      </div>
    </div>
  );
}