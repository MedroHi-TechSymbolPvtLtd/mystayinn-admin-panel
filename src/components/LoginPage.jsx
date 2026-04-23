import { useCallback, useEffect, useState } from "react";
import { useAdminSession } from "../context/AdminSessionContext.jsx";
import { fetchRegisterOpen } from "../lib/adminPanelApi.js";

export default function LoginPage() {
  const { login, registerFirstAdmin, error: sessionError } = useAdminSession();
  const [mode, setMode] = useState("signin");

  /** null = still checking, true = zero admins (form allowed), false = not available */
  const [registerAvailable, setRegisterAvailable] = useState(null);
  const [registerCheckError, setRegisterCheckError] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const refreshRegisterOpen = useCallback(async () => {
    setRegisterAvailable(null);
    setRegisterCheckError(false);
    try {
      const open = await fetchRegisterOpen();
      setRegisterAvailable(open);
    } catch {
      setRegisterAvailable(false);
      setRegisterCheckError(true);
    }
  }, []);

  useEffect(() => {
    refreshRegisterOpen();
  }, [refreshRegisterOpen]);

  const onSignIn = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setLocalError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (regPassword !== regPassword2) {
      setLocalError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await registerFirstAdmin({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: regPassword,
      });
    } catch (err) {
      setLocalError(err?.message || "Could not create account");
    } finally {
      setSubmitting(false);
    }
  };

  const err = localError || sessionError;
  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">MyStayInn Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "signin"
            ? "Sign in with your admin account (phone or email)."
            : registerAvailable
              ? "Create the first super admin. Additional admins are added later from the admin area."
              : "First-time setup or server status — see below."}
        </p>

        <div className="mt-6 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 transition-colors ${
              mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => {
              setMode("signin");
              setLocalError(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 transition-colors ${
              mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => {
              setMode("register");
              setLocalError(null);
              refreshRegisterOpen();
            }}
          >
            Create first account
          </button>
        </div>

        {mode === "signin" ? (
          <form className="mt-8 space-y-4" onSubmit={onSignIn}>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="id">
                Phone or email
              </label>
              <input
                id="id"
                className={inputClass}
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="pw">
                Password
              </label>
              <input
                id="pw"
                type="password"
                className={inputClass}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : registerAvailable === null ? (
          <p className="mt-8 text-center text-sm text-slate-500">Checking first-time setup…</p>
        ) : registerCheckError ? (
          <div className="mt-8 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Could not reach the admin API</p>
            <p>
              Set <code className="rounded bg-amber-100 px-1">VITE_ADMIN_PANEL_API_URL</code> in{" "}
              <code className="rounded bg-amber-100 px-1">mystay-admin-panel/.env</code> to your running{" "}
              <code className="rounded bg-amber-100 px-1">admin-panel-service</code> base URL (no trailing slash),
              for example <code className="rounded bg-amber-100 px-1">http://127.0.0.1:3009</code>, then restart{" "}
              <code className="rounded bg-amber-100 px-1">npm run dev</code>.
            </p>
            <button
              type="button"
              className="w-full rounded-lg border border-amber-300 bg-white py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
              onClick={() => refreshRegisterOpen()}
            >
              Try again
            </button>
          </div>
        ) : registerAvailable === false ? (
          <div className="mt-8 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">First-time registration is closed</p>
            <p>
              The server already has at least one admin account, so the &quot;create first account&quot; step is
              disabled. Use <strong>Sign in</strong> with your phone or email and password.
            </p>
            <p className="text-slate-600">
              If you lost access, clear or reset the <code className="rounded bg-white px-1">admins</code> table in
              the admin-panel database (dev only), or ask whoever manages your deployment to create a user.
            </p>
            <button
              type="button"
              className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={() => {
                setMode("signin");
                setLocalError(null);
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onRegister}>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="reg-name">
                Full name
              </label>
              <input
                id="reg-name"
                className={inputClass}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="reg-email">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                className={inputClass}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="reg-phone">
                Phone
              </label>
              <input
                id="reg-phone"
                className={inputClass}
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="reg-pw">
                Password
              </label>
              <input
                id="reg-pw"
                type="password"
                className={inputClass}
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="reg-pw2">
                Confirm password
              </label>
              <input
                id="reg-pw2"
                type="password"
                className={inputClass}
                autoComplete="new-password"
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create super admin"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
