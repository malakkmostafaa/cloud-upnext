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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    

    try {
      await signOut();
      // 1. Login using Cognito
      const signInResult = await signIn({
        username: email,
        password,
      });


      // 2. Handle temporary-password challenge
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

      // 3. Get Cognito session and ID token
      const session = await fetchAuthSession();


      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("No ID token returned from Cognito.");
      }

      // 4. Save token for future API requests
      //localStorage.setItem("idToken", idToken);

      // 5. Ask backend who this user is
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
  console.error("Backend auth error:", response.status, errorData);
  throw new Error(errorData.error || "Backend rejected the Cognito token.");
}

      const user = await response.json();

      // 6. Save user in AuthContext
      login(user, idToken);

      // 7. Redirect based on role
      if (user.role === "EMPLOYEE") {
        navigate("/board");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message ||
          "Login failed. Check your email, password, or Cognito setup."
      );
    } finally {
      setLoading(false);
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
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
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