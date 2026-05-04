import { Fragment, useEffect, useMemo, useState } from "react";
import Navbar from "./Navbar";
import { useAdminSession } from "../context/AdminSessionContext.jsx";
import {
  fetchOwnersWithProperties,
  updateOwnerProPlan,
  downloadBeneficiaryUploadCsv,
  fetchBeneficiaryExportSettings,
  saveBeneficiaryExportSettings,
} from "../lib/adminPanelApi.js";

function formatInt(n) {
  return new Intl.NumberFormat("en-IN").format(Number(n) || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN");
}

export default function SubscriptionsAccess({ breadcrumb }) {
  const { admin } = useAdminSession();
  const isSuperAdmin = admin?.role === "super_admin";
  const { section = "Access", page = "Subscriptions & access" } = breadcrumb || {};
  const [owners, setOwners] = useState([]);
  const [expandedOwnerIds, setExpandedOwnerIds] = useState({});
  const [ownerDuration, setOwnerDuration] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingOwnerId, setSavingOwnerId] = useState(null);
  const [error, setError] = useState(null);
  const [beneficiaryDownloading, setBeneficiaryDownloading] = useState(false);
  const [debitAccDraft, setDebitAccDraft] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsHint, setSettingsHint] = useState(null);

  // Load owners on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOwnersWithProperties();
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setOwners(list);
          setOwnerDuration((prev) => {
            const next = { ...prev };
            for (const owner of list) {
              const id = owner.id || owner.uniqueId;
              if (next[id] == null) next[id] = Number(owner?.subscription?.durationMonths) || 1;
            }
            return next;
          });
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load owners");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    let cancelled = false;
    (async () => {
      setSettingsLoading(true);
      setSettingsHint(null);
      try {
        const data = await fetchBeneficiaryExportSettings();
        if (!cancelled) setDebitAccDraft(String(data?.debitAccNo ?? ""));
      } catch (e) {
        if (!cancelled) {
          setSettingsHint({ type: "err", msg: e?.message || "Could not load company debit settings" });
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  // Move this function OUTSIDE the useEffect so it's accessible
  const onSetOwnerPlan = async (ownerId, durationMonths) => {
    const prev = ownerDuration[ownerId];
    setOwnerDuration((state) => ({ ...state, [ownerId]: durationMonths }));
    setSavingOwnerId(ownerId);
    try {
      await updateOwnerProPlan(ownerId, true, durationMonths);
      // Optionally refresh the list to get updated data from server
      const data = await fetchOwnersWithProperties();
      const list = Array.isArray(data) ? data : [];
      setOwners(list);
    } catch (e) {
      // Revert on error
      setOwnerDuration((state) => ({ ...state, [ownerId]: prev }));
      setError(e?.message || "Failed to update pro plan");
    } finally {
      setSavingOwnerId(null);
    }
  };

  const toggleOwner = (id) => {
    setExpandedOwnerIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const stats = useMemo(() => {
    const totalOwners = owners.length;
    const activeOwners = owners.filter((o) => o.isActive !== false).length;
    const totalProperties = owners.reduce(
      (sum, o) => sum + (Array.isArray(o.properties) ? o.properties.length : 0),
      0
    );
    return { totalOwners, activeOwners, totalProperties };
  }, [owners]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar section={section} page={page} />
      <div className="space-y-8 px-4 py-6 lg:px-8 pb-16">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Subscriptions &amp; property admin access</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-gray-500">
            All admin-app owners are listed below with their MyO ID. Click the arrow to expand and view nested PG details.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-gray-900">Beneficiary upload (Excel / CSV)</h2>
              
            </div>
            <button
              type="button"
              disabled={beneficiaryDownloading}
              onClick={async () => {
                setBeneficiaryDownloading(true);
                setError(null);
                try {
                  await downloadBeneficiaryUploadCsv();
                } catch (e) {
                  setError(e?.message || "Could not download beneficiary file");
                } finally {
                  setBeneficiaryDownloading(false);
                }
              }}
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {beneficiaryDownloading ? "Preparing…" : "Download CSV"}
            </button>
          </div>

          {settingsHint?.type === "err" && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900 border border-amber-100">
              {settingsHint.msg}
            </div>
          )}
          {settingsHint?.type === "ok" && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900 border border-emerald-100">
              {settingsHint.msg}
            </div>
          )}

          {isSuperAdmin ? (
            <div className="mt-4 rounded-xl border border-white/80 bg-white p-4 shadow-sm">
              <label className="block text-[13px] font-medium text-gray-900">
                Company debit account (DEBIT_ACC_NO)
              </label>
              <p className="mt-1 text-[12px] text-gray-500">
                Used as the debit / company account on every beneficiary export row. Digits only (6–24).
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={settingsLoading ? "Loading…" : "e.g. company operating account number"}
                  disabled={settingsLoading || settingsSaving}
                  value={debitAccDraft}
                  onChange={(e) => {
                    setDebitAccDraft(e.target.value.replace(/[^\d\s]/g, ""));
                    setSettingsHint(null);
                  }}
                  className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-[14px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  disabled={settingsSaving || settingsLoading}
                  onClick={async () => {
                    setSettingsSaving(true);
                    setSettingsHint(null);
                    try {
                      const digits = debitAccDraft.replace(/\s/g, "");
                      const saved = await saveBeneficiaryExportSettings({ debitAccNo: digits });
                      setDebitAccDraft(String(saved?.debitAccNo ?? ""));
                      setSettingsHint({
                        type: "ok",
                        msg: "Saved.",
                      });
                    } catch (e) {
                      setSettingsHint({ type: "err", msg: e?.message || "Could not save" });
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {settingsSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[12px] text-gray-600 max-w-xl">
              Only <span className="font-medium text-gray-800">super admins</span> can edit the company debit account in this
              panel. Exports still work if it was configured by a super admin or via{" "}
              <code className="rounded bg-white/80 px-1">BENEFICIARY_EXPORT_DEBIT_ACC_NO</code> /{" "}
              <code className="rounded bg-white/80 px-1">TECHMUDITA_ACC_NO</code> on the server.
            </p>
          )}
          <details className="mt-4 rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-[12px] text-gray-700">
            <summary className="cursor-pointer font-medium text-gray-900 select-none">
              Column mapping (reference)
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[640px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-3 font-medium">UI / source</th>
                    <th className="py-2 pr-3 font-medium">Excel column</th>
                    <th className="py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Account holder name</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">BNF_NAME</td>
                    <td className="py-2">From app</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Account number</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">BENE_ACC_NO</td>
                    <td className="py-2">From app; exported as Excel text (avoids 2.22E+12-style corruption).</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">IFSC</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">BENE_IFSC</td>
                    <td className="py-2">From app</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Beneficiary mobile</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">MOBILE_NUM</td>
                    <td className="py-2">10-digit from app; exported as Excel text.</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Email (optional)</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">EMAIL_ID</td>
                    <td className="py-2">From app if provided</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Reference</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">REF_NO</td>
                    <td className="py-2">New UUID per row, per download</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Product / mode</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">PYMT_PROD_TYPE_CODE, PYMT_MODE</td>
                    <td className="py-2">Default e.g. PAB_VENDOR / NEFT (from saved app defaults)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Company debit account</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">DEBIT_ACC_NO</td>
                    <td className="py-2">
                      <span className="font-medium text-gray-900">Priority:</span> value saved here by a super admin, then{" "}
                      <code className="rounded bg-gray-100 px-1">BENEFICIARY_EXPORT_DEBIT_ACC_NO</code> or{" "}
                      <code className="rounded bg-gray-100 px-1">TECHMUDITA_ACC_NO</code> on the server (Excel text).
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Credit narration</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">CREDIT_NARR</td>
                    <td className="py-2">
                      From app defaults or <code className="rounded bg-gray-100 px-1">BENEFICIARY_EXPORT_CREDIT_NARR</code>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Remark</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">REMARK</td>
                    <td className="py-2">Internal: admin unique id</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">Amount / date</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">AMOUNT, PYMT_DATE</td>
                    <td className="py-2">
                      Blank by default (beneficiary registration). For payout-style rows set{" "}
                      <code className="rounded bg-gray-100 px-1">BENEFICIARY_EXPORT_DEFAULT_AMOUNT</code>,{" "}
                      <code className="rounded bg-gray-100 px-1">BENEFICIARY_EXPORT_PYMT_DATE</code> (YYYY-MM-DD), or{" "}
                      <code className="rounded bg-gray-100 px-1">BENEFICIARY_EXPORT_PYMT_DATE_TODAY=true</code>.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-500">
                  <th className="px-4 py-3 font-medium w-[70px]">Expand</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">MyO ID</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Plan Duration</th>
                  <th className="px-4 py-3 font-medium text-center">Start Date</th>
                  <th className="px-4 py-3 font-medium text-center">Valid Until</th>
                  <th className="px-4 py-3 font-medium text-center">Days Left</th>
                  <th className="px-4 py-3 font-medium text-right">PG Count</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-sm text-slate-500">
                      Loading owners…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-sm text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : owners.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-sm text-slate-500">
                      No owner/admin users found.
                    </td>
                  </tr>
                ) : (
                  owners.map((owner) => {
                    const ownerId = owner.id || owner.uniqueId;
                    const expanded = Boolean(expandedOwnerIds[ownerId]);
                    const ownerName =
                      [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim() || "Owner";
                    const ownerProperties = Array.isArray(owner.properties) ? owner.properties : [];
                    const sub = owner.subscription || {};
                    const isProEnabled = owner?.proPlanEnabled === true || sub?.proPlanEnabled === true;
                    const currentDuration = Number(ownerDuration[ownerId] || sub?.durationMonths || 1);
                    const isSaving = savingOwnerId === ownerId;
                    
                    return (
                      <Fragment key={`frag-${ownerId}`}>
                        <tr key={`owner-${ownerId}`} className="border-b border-gray-100 hover:bg-gray-50/40">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleOwner(ownerId)}
                              className="h-8 w-8 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                              aria-label={expanded ? "Collapse owner properties" : "Expand owner properties"}
                            >
                              {expanded ? "▾" : "▸"}
                            </button>
                           </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{ownerName}</td>
                          <td className="px-4 py-3 text-gray-700 font-medium">{owner.uniqueId || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{owner.phone || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{owner.email || "—"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                                owner.isActive === false
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {owner.isActive === false ? "Inactive" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <select
                              value={currentDuration}
                              onChange={(e) => onSetOwnerPlan(ownerId, Number(e.target.value))}
                              disabled={isSaving}
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            >
                              <option value={1}>1 month</option>
                              <option value={3}>3 months</option>
                              <option value={6}>6 months</option>
                              <option value={12}>1 year</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">{formatDate(sub?.startedAt)}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{formatDate(sub?.validUntil)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-semibold ${isProEnabled ? "text-emerald-700" : "text-slate-500"}`}>
                              {isSaving ? "Saving..." : Number(sub?.daysLeft || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            {formatInt(ownerProperties.length)}
                          </td>
                        </tr>
                        {expanded && (
                          <tr key={`props-${ownerId}`} className="border-b border-gray-100 bg-slate-50/70">
                            <td className="px-4 py-3" />
                            <td colSpan={10} className="px-4 py-3">
                              {ownerProperties.length === 0 ? (
                                <div className="text-sm text-slate-500 py-2">
                                  No PG/property found for this owner.
                                </div>
                              ) : (
                                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                                  <table className="w-full text-[12px]">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                      <tr className="text-slate-500">
                                        <th className="px-3 py-2 font-medium text-left">PG Name</th>
                                        <th className="px-3 py-2 font-medium text-left">PG ID</th>
                                        <th className="px-3 py-2 font-medium text-left">Location</th>
                                        <th className="px-3 py-2 font-medium text-left">Type</th>
                                        <th className="px-3 py-2 font-medium text-right">Rooms</th>
                                        <th className="px-3 py-2 font-medium text-right">Occupied</th>
                                        <th className="px-3 py-2 font-medium text-right">Revenue</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ownerProperties.map((p) => (
                                        <tr key={`${ownerId}-${p.id || p.uniqueId}`} className="border-b border-slate-100">
                                          <td className="px-3 py-2 text-slate-900 font-medium">{p.name || "—"}</td>
                                          <td className="px-3 py-2 text-slate-600">{p.uniqueId || p.id || "—"}</td>
                                          <td className="px-3 py-2 text-slate-600">
                                            {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                                          </td>
                                          <td className="px-3 py-2 text-slate-600">{p.propertyType || "—"}</td>
                                          <td className="px-3 py-2 text-right text-slate-800">{formatInt(p.totalRooms)}</td>
                                          <td className="px-3 py-2 text-right text-slate-800">{formatInt(p.occupiedRooms)}</td>
                                          <td className="px-3 py-2 text-right text-slate-800">{formatInt(p.monthlyRevenue)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-medium text-gray-500">Total owners</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatInt(stats.totalOwners)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-medium text-gray-500">Active owners</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatInt(stats.activeOwners)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-medium text-gray-500">Total PGs listed</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatInt(stats.totalProperties)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}