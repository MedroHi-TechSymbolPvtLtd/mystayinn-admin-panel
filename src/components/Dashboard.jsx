import { useEffect, useState } from "react";
import StatsCard from "./StatsCard";
import Navbar from "./Navbar";
import RevenueChart from "./RevenueChart";
import BedChart from "./BedChart";
import OccupancyChart from "./OccupancyChart";
import RightSidebar from "./RightSidebar";
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

/** @param {string} ym "YYYY-MM" */
function shortMonth(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short" });
}

export default function Dashboard({ breadcrumb }) {
  const { section = "Dashboards", page = "Overview" } = breadcrumb || {};
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
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
        if (!cancelled) setLoadError(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const a = summary?.analytics || {};
  const propertyCount = summary?.propertyCount ?? a.totalProperties ?? 0;
  const customers = a.totalCustomers ?? 0;
  const revenue = a.totalRevenue ?? 0;
  const occ = a.occupancyRate != null ? `${Number(a.occupancyRate).toFixed(1)}%` : "—";

  const revenueChartData = (monthly || []).map((row) => ({
    month: shortMonth(row.month),
    revenue: Number(row.revenue) || 0,
    expenses: Number(row.expenses) || 0,
    profit: Number(row.profit) || 0,
  }));

  const bedChartData = [
    { name: "Total rooms", value: Number(a.totalRooms) || 0, color: "#A9C3EC" },
    { name: "Occupied", value: Number(a.occupiedRooms) || 0, color: "#6EE7D1" },
    { name: "Vacant", value: Number(a.vacantRooms) || 0, color: "#7FB9FF" },
  ];

  const occPie =
    (Number(a.occupiedRooms) || 0) + (Number(a.vacantRooms) || 0) > 0
      ? [
          { name: "Occupied", value: Number(a.occupiedRooms) || 0, color: "#22c55e" },
          { name: "Vacant", value: Number(a.vacantRooms) || 0, color: "#e5e7eb" },
        ]
      : [
          { name: "No room data", value: 1, color: "#e5e7eb" },
        ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-screen overflow-hidden">
        <div className="overflow-y-auto px-4 lg:px-0 pr-0 lg:pr-4 no-scrollbar">
          <Navbar section={section} page={page} />

          <div className="gap-6">
            <div className="w-auto space-y-6 pb-10">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
                <p className="text-xs text-slate-500">
                  Data from <span className="font-medium">admin-panel-service</span> → analytics
                </p>
              </div>

              {loadError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {loadError}
                </div>
              ) : null}

              {loading ? (
                <div className="text-sm text-slate-500 py-8">Loading dashboard…</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatsCard
                      title="Properties (system)"
                      colour="#EEF0FF"
                      value={formatInt(propertyCount)}
                      growth="live"
                    />
                    <StatsCard
                      title="Active enrollments (proxy)"
                      colour="#ECF4FF"
                      value={formatInt(customers)}
                      growth="live"
                    />
                    <StatsCard title="Occupancy rate" colour="#F0FDF4" value={occ} growth="live" />
                    <StatsCard
                      title="Rent collected (agg.)"
                      colour="#FFF7ED"
                      value={formatInr(revenue)}
                      growth="live"
                    />
                  </div>

                  <RevenueChart data={revenueChartData} />

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
                    <BedChart data={bedChartData} />
                    <OccupancyChart data={occPie} occupancyRate={a.occupancyRate} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <RightSidebar summary={summary} />
        </div>
      </div>

      <div className="block lg:hidden px-4 pb-6">
        <RightSidebar summary={summary} />
      </div>
    </div>
  );
}
