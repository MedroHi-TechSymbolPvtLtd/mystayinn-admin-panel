import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredToken,
  fetchAdminProfile,
  getStoredToken,
  loginAdmin,
  registerBootstrapAdmin,
  setStoredToken,
} from "../lib/adminPanelApi.js";

const AdminSessionContext = createContext(null);

export function AdminSessionProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(!!getStoredToken());
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profile = await fetchAdminProfile();
      setAdmin(profile);
    } catch (e) {
      setError(e?.message || "Session expired");
      clearStoredToken();
      setToken(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) refreshProfile();
    else setLoading(false);
  }, [token, refreshProfile]);

  const login = useCallback(async (identifier, password) => {
    setError(null);
    const data = await loginAdmin(identifier, password);
    setToken(data?.token || getStoredToken());
    setAdmin(data?.admin || null);
    return data;
  }, []);

  const registerFirstAdmin = useCallback(async (body) => {
    setError(null);
    const data = await registerBootstrapAdmin(body);
    setToken(data?.token || getStoredToken());
    setAdmin(data?.admin || null);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setAdmin(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      admin,
      loading,
      error,
      isAuthenticated: !!token && !!admin,
      login,
      registerFirstAdmin,
      logout,
      refreshProfile,
      setSessionError: setError,
    }),
    [token, admin, loading, error, login, registerFirstAdmin, logout, refreshProfile]
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error("useAdminSession must be used within AdminSessionProvider");
  return ctx;
}
