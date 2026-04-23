import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import StatsCard from "./StatsCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchDashboardMonthly, fetchDashboardSummary } from "../lib/adminPanelApi.js";

function formatInr(n) {
  const x = Number(n) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(x);
}

function formatInt(n) {
  return new Intl.NumberFormat("en-IN").format(Number(n) || 0);
}

/** @param {string} ym */
function shortMonth(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short" });
}

export default function AppStatistics({ breadcrumb }) {
  const { section = "Analytics", page = "App statistics" } = breadcrumb || {};
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sum, mon] = await Promise.all([
          fetchDashboardSummary(),
          fetchDashboardMonthly(new Date().getFullYear()),
        ]);
        if (!cancelled) {
          setSummary(sum);
          setMonthly(Array.isArray(mon) ? mon : []);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const a = summary?.analytics || {};
  const profit = Number(a.totalProfit) || 0;
  const pending = Number(a.pendingDues) || 0;
  const barData = monthly.map((row) => ({
    month: shortMonth(row.month),
    profit: Number(row.profit) || 0,
    revenue: Number(row.revenue) || 0,
  }));

  return (
    <div className="min-h-screen bg-white">
      <Navbar section={section} page={page} />
      <div className="space-y-8 px-4 py-6 lg:px-8 pb-16">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">App statistics</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-gray-500">
            Cross-service metrics from <span className="font-medium text-gray-700">admin-panel-service</span> (aggregated
            analytics DB). Mobile DAU / store installs are not in this API yet — add analytics events or wire
            Firebase/App Store APIs separately.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatsCard
                title="Active enrollments (proxy)"
                colour="#EEF0FF"
                value={formatInt(a.totalCustomers)}
                growth="live"
              />
              <StatsCard title="Total profit (agg.)" colour="#ECF4FF" value={formatInr(profit)} growth="live" />
              <StatsCard title="Pending dues (agg.)" colour="#F0FDF4" value={formatInr(pending)} growth="live" />
              <StatsCard title="Total expenses (agg.)" colour="#FFF7ED" value={formatInr(a.totalExpenses)} growth="live" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 sm:p-6">
              <h3 className="text-[14px] font-semibold text-gray-900">Monthly profit (YTD)</h3>
              <p className="text-xs text-gray-500 mt-0.5">Same source as dashboard monthly endpoint.</p>
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData.length ? barData : [{ month: "—", profit: 0 }]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="profit" name="Profit" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-[13px] text-amber-950">
              <p className="font-medium">Not available via admin-panel-service yet</p>
              <ul className="mt-2 list-disc list-inside text-amber-900/90 space-y-1">
                <li>Per-app DAU / WAU / MAU (Expo / Play / App Store)</li>
                <li>Install &amp; update counts by build</li>
                <li>Per-PG revenue ranking (needs property-level rollups exposed on BFF)</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
