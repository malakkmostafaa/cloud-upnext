import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("ali@upnext.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    // Temporary mock token until Cognito is connected
    localStorage.setItem("upnext_token", "mock-token");
    navigate("/dashboard");
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
          <p className="font-semibold text-slate-700">Demo users later:</p>
          <p>Ali: Manager</p>
          <p>Sara: Frontend employee</p>
          <p>Omar: Backend employee</p>
        </div>
      </div>
    </div>
  );
}