/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signOut,
} from "aws-amplify/auth";

const AuthContext = createContext(null);

function normalizeRole(role) {
  return role?.toUpperCase() || "";
}

function buildUserFromCognito({ currentUser, attributes }) {
  const role = normalizeRole(attributes["custom:role"]);
  const teamId = attributes["custom:teamId"] || "";

  return {
    userId: attributes.sub || currentUser?.userId || "",
    username: currentUser?.username || "",
    name: attributes.name || attributes.email || currentUser?.username || "",
    email: attributes.email || "",
    role,
    teamId,
    teamName: teamId,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadCurrentUser() {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const normalizedUser = buildUserFromCognito({
        currentUser,
        attributes,
      });

      setUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      await loadCurrentUser();
      setLoading(false);
    }

    initAuth();
  }, []);

  async function refreshUser() {
    setLoading(true);

    try {
      const refreshedUser = await loadCurrentUser();
      return refreshedUser;
    } finally {
      setLoading(false);
    }
  }

  async function getIdToken() {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,

        refreshUser,
        getIdToken,
        logout,

        isAuthenticated: Boolean(user),
        isManager: user?.role === "MANAGER",
        isAdmin: user?.role === "ADMIN",
        isEmployee: user?.role === "EMPLOYEE",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}