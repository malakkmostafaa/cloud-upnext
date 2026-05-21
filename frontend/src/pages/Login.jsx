import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  signIn,
  fetchAuthSession,
  confirmSignIn,
  signOut,
} from "aws-amplify/auth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("ali@upnext.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signOut();

      const signInResult = await signIn({
        username: email,
        password,
      });

      if (
        signInResult.nextStep?.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
      ) {
        await confirmSignIn({
          challengeResponse: password,
          options: {
            userAttributes: {
              name: email.split("@")[0],
            },
          },
        });
      }

      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("No ID token returned from Cognito.");
      }

      localStorage.setItem("idToken", idToken);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/me`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Backend rejected the Cognito token.");
      }

      const user = await response.json();
      login(user, idToken);

      if (user.role === "EMPLOYEE") {
        navigate("/board");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef6f8] px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200 lg:grid-cols-2">
        <div className="hidden bg-[#dff7f5] p-10 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22b8b0] text-xl font-bold text-white">
                U
              </div>

              <h1 className="mt-8 text-4xl font-bold text-slate-950">
                UpNext
              </h1>

              <p className="mt-4 max-w-sm text-slate-500">
                A lightweight cloud task-management platform powered by AWS
                Cognito, DynamoDB, and server-side team isolation.
              </p>
            </div>

            <div className="rounded-3xl bg-white/80 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Demo users
              </p>
              <div className="mt-3 space-y-1 text-sm text-slate-500">
                <p>admin@upnext.com — Admin</p>
                <p>ali@upnext.com — Manager</p>
                <p>sara@upnext.com — Frontend employee</p>
                <p>omar@upnext.com — Backend employee</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-12">
          <div className="mb-8">
            <p className="text-sm font-semibold text-[#159c96]">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Access your team workspace.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                className="w-full rounded-2xl border border-slate-100 bg-[#f7fbfc] px-4 py-3 outline-none focus:border-[#22b8b0]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ali@upnext.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                className="w-full rounded-2xl border border-slate-100 bg-[#f7fbfc] px-4 py-3 outline-none focus:border-[#22b8b0]"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password123!"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#22b8b0] px-4 py-3 font-semibold text-white hover:bg-[#159c96] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-3xl bg-[#f7fbfc] p-4 text-xs text-slate-500 lg:hidden">
            <p className="font-semibold text-slate-700">Demo password:</p>
            <p>Password123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}