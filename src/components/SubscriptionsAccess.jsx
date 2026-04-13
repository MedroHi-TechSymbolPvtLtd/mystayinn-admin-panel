import { useState } from "react";
import Navbar from "./Navbar";

const initialRows = [
  {
    id: "1",
    property: "Sunrise PG Koramangala",
    adminEmail: "admin@sunrisepg.example",
    subscription: "pro",
    subscriptionActive: true,
    adminEnabled: true,
    proFeatures: true,
    renews: "2026-05-01",
  },
  {
    id: "2",
    property: "Urban Nest Indiranagar",
    adminEmail: "ops@urbannest.example",
    subscription: "standard",
    subscriptionActive: true,
    adminEnabled: true,
    proFeatures: false,
    renews: "2026-04-28",
  },
  {
    id: "3",
    property: "Scholars Inn Whitefield",
    adminEmail: "manager@scholars.example",
    subscription: "pro",
    subscriptionActive: false,
    adminEnabled: false,
    proFeatures: false,
    renews: "—",
  },
  {
    id: "4",
    property: "Metro Stays HSR",
    adminEmail: "hello@metrostays.example",
    subscription: "standard",
    subscriptionActive: true,
    adminEnabled: true,
    proFeatures: true,
    renews: "2026-06-12",
  },
];

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-indigo-600" : "bg-gray-200"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SubscriptionsAccess({ breadcrumb }) {
  const { section = "Access", page = "Subscriptions & access" } = breadcrumb || {};
  const [rows, setRows] = useState(initialRows);

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar section={section} page={page} />
      <div className="space-y-8 px-4 py-6 lg:px-8 pb-16">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Subscriptions &amp; property admin access</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-gray-500">
            Enable or disable property admins based on subscription status. Toggle <span className="font-medium text-gray-700">Pro</span>{" "}
            for premium features per PG. UI-only — persist via your billing and auth APIs.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-[12px] text-amber-900">
          When <strong>subscription</strong> is inactive, consider auto-disabling admin login and showing a renewal
          banner in the Admin app (backend enforcement recommended).
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-500">
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Subscription</th>
                  <th className="px-4 py-3 font-medium text-center">Admin access</th>
                  <th className="px-4 py-3 font-medium text-center">Pro tier</th>
                  <th className="px-4 py-3 font-medium">Renews</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const subOff = !r.subscriptionActive;
                  return (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.property}</td>
                      <td className="px-4 py-3 text-gray-600">{r.adminEmail}</td>
                      <td className="px-4 py-3">
                        <select
                          value={r.subscription}
                          onChange={(e) => updateRow(r.id, { subscription: e.target.value })}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[12px] text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="standard">Standard</option>
                          <option value="pro">Pro</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={r.subscriptionActive}
                            onChange={(v) => {
                              updateRow(r.id, {
                                subscriptionActive: v,
                                ...(v ? {} : { adminEnabled: false, proFeatures: false }),
                              });
                            }}
                            label={`Subscription ${r.property}`}
                          />
                          <span className={r.subscriptionActive ? "text-green-700" : "text-red-600"}>
                            {r.subscriptionActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={r.adminEnabled}
                            onChange={(v) => updateRow(r.id, { adminEnabled: v })}
                            disabled={subOff}
                            label={`Admin access ${r.property}`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={r.proFeatures}
                            onChange={(v) => updateRow(r.id, { proFeatures: v })}
                            disabled={subOff || r.subscription !== "pro"}
                            label={`Pro ${r.property}`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.renews}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-medium text-gray-500">Active subscriptions</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{rows.filter((r) => r.subscriptionActive).length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-medium text-gray-500">Admins with access</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{rows.filter((r) => r.adminEnabled).length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-medium text-gray-500">Pro properties (enabled)</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {rows.filter((r) => r.proFeatures && r.subscription === "pro").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
