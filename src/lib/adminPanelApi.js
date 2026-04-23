/**
 * Browser client for myStay `admin-panel-service` (BFF: auth, dashboard, properties, etc.).
 * Set `VITE_ADMIN_PANEL_API_URL` (e.g. http://localhost:3009) in Vite env.
 */
const TOKEN_KEY = "mystay_admin_panel_token";

export function getAdminPanelBaseUrl() {
  const raw = import.meta.env?.VITE_ADMIN_PANEL_API_URL || "http://127.0.0.1:3009";
  return String(raw).replace(/\/$/, "");
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearStoredToken() {
  setStoredToken(null);
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/**
 * @param {string} path - e.g. `/api/admin/dashboard/summary`
 * @param {{ method?: string, body?: object, auth?: boolean }} opts
 */
export async function adminPanelRequest(path, opts = {}) {
  const { method = "GET", body, auth = true } = opts;
  const url = `${getAdminPanelBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  /** @type {Record<string, string>} */
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const t = getStoredToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await parseJson(res);
  if (!res.ok) {
    const msg = data?.message || data?.error?.message || res.statusText || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export async function loginAdmin(identifier, password) {
  const data = await adminPanelRequest("/api/admin/auth/login", {
    method: "POST",
    body: { identifier, password },
    auth: false,
  });
  const payload = data?.data;
  if (payload?.token) setStoredToken(payload.token);
  return payload;
}

/** Whether bootstrap sign-up is allowed (no admins in DB yet). */
export async function fetchRegisterOpen() {
  const data = await adminPanelRequest("/api/admin/auth/register-open", { auth: false });
  return Boolean(data?.data?.open);
}

/** Create the first super_admin when the database has zero admins. */
export async function registerBootstrapAdmin(body) {
  const data = await adminPanelRequest("/api/admin/auth/register", {
    method: "POST",
    body,
    auth: false,
  });
  const payload = data?.data;
  if (payload?.token) setStoredToken(payload.token);
  return payload;
}

export async function fetchAdminProfile() {
  const data = await adminPanelRequest("/api/admin/auth/me");
  return data?.data;
}

export async function fetchDashboardSummary() {
  const data = await adminPanelRequest("/api/admin/dashboard/summary");
  return data?.data;
}

export async function fetchDashboardMonthly(year) {
  const y = year ?? new Date().getFullYear();
  const data = await adminPanelRequest(`/api/admin/dashboard/monthly?year=${encodeURIComponent(String(y))}`);
  return data?.data;
}
