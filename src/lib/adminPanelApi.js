/**
 * Browser client for myStay `admin-panel-service` (BFF: auth, dashboard, properties, etc.).
 * Set `VITE_ADMIN_PANEL_API_URL` in `.env` — local e.g. `http://127.0.0.1:3009`, or hosted base with path prefix e.g. `https://api.example.com/admin` (no trailing slash).
 */
const TOKEN_KEY = "mystay_admin_panel_token";

export function getAdminPanelBaseUrl() {
  const raw = import.meta.env?.VITE_ADMIN_PANEL_API_URL || "http://127.0.0.1:3009";
  // Strip whitespace so `.env` typos can't produce `/admin/%20/...` in the URL path.
  return String(raw).trim().replace(/\s+/g, "").replace(/\/$/, "");
}

/**
 * Optional API prefix between base URL and route path.
 * - Local default: "/api/admin"
 * - Set empty string in .env for gateways that already rewrite to admin routes.
 */
function getAdminPanelApiPrefix() {
  const raw = import.meta.env?.VITE_ADMIN_PANEL_API_PREFIX;
  if (raw === undefined) return "/api/admin";
  const p = String(raw).trim();
  if (!p || p === "/") return "";
  return p.startsWith("/") ? p.replace(/\/$/, "") : `/${p.replace(/\/$/, "")}`;
}

/** Leading-space paths once broke fetch URLs; normalize before concatenating with base. */
function normalizeApiPath(path) {
  const p = String(path).trim();
  return p.startsWith("/") ? p : `/${p}`;
}

function resolveApiPath(path) {
  const normalized = normalizeApiPath(path);
  const prefix = getAdminPanelApiPrefix();
  if (!prefix) return normalized;
  if (normalized === prefix || normalized.startsWith(`${prefix}/`)) return normalized;
  return `${prefix}${normalized}`;
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
 * @param {string} path - e.g. ` /dashboard/summary`
 * @param {{ method?: string, body?: object, auth?: boolean }} opts
 */
export async function adminPanelRequest(path, opts = {}) {
  const { method = "GET", body, auth = true } = opts;
  const url = `${getAdminPanelBaseUrl()}${resolveApiPath(path)}`;
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
  const data = await adminPanelRequest(" /auth/login", {
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
  const data = await adminPanelRequest(" /auth/register-open", { auth: false });
  return Boolean(data?.data?.open);
}

/** Create the first super_admin when the database has zero admins. */
export async function registerBootstrapAdmin(body) {
  const data = await adminPanelRequest(" /auth/register", {
    method: "POST",
    body,
    auth: false,
  });
  const payload = data?.data;
  if (payload?.token) setStoredToken(payload.token);
  return payload;
}

export async function fetchAdminProfile() {
  const data = await adminPanelRequest(" /auth/me");
  return data?.data;
}

export async function fetchDashboardSummary() {
  const data = await adminPanelRequest(" /dashboard/summary");
  return data?.data;
}

export async function fetchDashboardMonthly(year) {
  const y = year ?? new Date().getFullYear();
  const data = await adminPanelRequest(` /dashboard/monthly?year=${encodeURIComponent(String(y))}`);
  return data?.data;
}

export async function fetchAnalyticsDetail(query = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    const sv = String(v).trim();
    if (!sv) continue;
    params.set(k, sv);
  }
  const qs = params.toString();
  const path = qs
    ? ` /dashboard/analytics-detail?${qs}`
    : " /dashboard/analytics-detail";
  const data = await adminPanelRequest(path);
  return data?.data;
}

export async function fetchAreaOccupancy({ q = "", state = "", city = "", pincode = "" } = {}) {
  const params = new URLSearchParams({
    q: String(q || ""),
    state: String(state || ""),
    city: String(city || ""),
    pincode: String(pincode || ""),
  });
  const data = await adminPanelRequest(` /dashboard/area-occupancy?${params.toString()}`);
  return data?.data || { availableBeds: 0, emptyBeds: 0, matchedProperties: 0 };
}

export async function fetchOwnersWithProperties() {
  const data = await adminPanelRequest(" /owners-with-properties");
  return Array.isArray(data?.data) ? data.data : [];
}

export async function updateOwnerProPlan(ownerId, proPlanEnabled, durationMonths = 1) {
  const data = await adminPanelRequest(` /owners/${encodeURIComponent(String(ownerId))}/pro-plan`, {
    method: "PUT",
    body: { proPlanEnabled, durationMonths },
  });
  return data?.data || data;
}

export async function sendPushNotificationCampaign(payload) {
  const data = await adminPanelRequest(" /notify/push", {
    method: "POST",
    body: payload,
  });
  return data?.data || data;
}

export async function fetchNotificationUsers({ audience = "both", q = "", limit = 200 } = {}) {
  const data = await adminPanelRequest(
    ` /notify/users?audience=${encodeURIComponent(audience)}&q=${encodeURIComponent(q)}&limit=${encodeURIComponent(
      String(limit)
    )}`
  );
  return Array.isArray(data?.data?.users) ? data.data.users : [];
}

/** Super admin only — company debit account for beneficiary CSV (stored in DB). */
export async function fetchBeneficiaryExportSettings() {
  const data = await adminPanelRequest(" /settings/beneficiary-export");
  return data?.data ?? {};
}

/** Super admin only — persist debit account (empty string clears stored value). */
export async function saveBeneficiaryExportSettings(body) {
  const data = await adminPanelRequest(" /settings/beneficiary-export", {
    method: "PUT",
    body,
  });
  return data?.data ?? data;
}

/**
 * Download bank beneficiary bulk-upload sheet (CSV, opens in Excel).
 * Requires analytics permission (same as dashboard exports).
 */
export async function downloadBeneficiaryUploadCsv() {
  const url = `${getAdminPanelBaseUrl()}${resolveApiPath("/dashboard/beneficiary-upload-export.csv")}`;
  /** @type {Record<string, string>} */
  const headers = { Accept: "text/csv,*/*" };
  const t = getStoredToken();
  if (!t) throw new Error("Sign in to download.");
  headers.Authorization = `Bearer ${t}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    let msg = res.statusText || "Download failed";
    try {
      const j = JSON.parse(text);
      if (j?.message) msg = j.message;
    } catch {
      if (text?.trim()) msg = text.trim().slice(0, 200);
    }
    throw new Error(msg);
  }
  const cd = res.headers.get("Content-Disposition") || "";
  let filename = "mystay-beneficiary-upload.csv";
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
  if (m?.[1]) filename = decodeURIComponent(m[1].trim());
  else {
    const m2 = /filename="([^"]+)"/i.exec(cd);
    if (m2?.[1]) filename = m2[1];
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
