import { useEffect, useMemo, useState } from "react";
import Navbar from "./Navbar";
import StatsCard from "./StatsCard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchAnalyticsDetail, fetchOwnersWithProperties } from "../lib/adminPanelApi.js";

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
  const [analytics, setAnalytics] = useState(null);
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
      year: String(new Date().getFullYear()),
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
      state: "",
      city: "",
      pincode: "",
      q: "",
      adminId: "",
    };
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminSearch, setAdminSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchOwnersWithProperties();
        if (!cancelled) setOwners(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setOwners([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnalyticsDetail({
          year: filters.year,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          state: filters.state,
          city: filters.city,
          pincode: filters.pincode,
          q: filters.q,
          adminId: filters.adminId,
        });
        if (!cancelled) setAnalytics(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const flags = analytics?.dataQualityFlags || {};
  const sourceErrors = Array.isArray(analytics?.sourceErrors) ? analytics.sourceErrors : [];
  const a = analytics?.summary?.analytics || {};
  const perAdmin = analytics?.perAdmin || [];
  const installProxy = analytics?.appMetrics?.installProxy || {};
  const area = analytics?.areaOccupancy || {};
  const funnelRows = analytics?.funnelMonthly || [];
  const perAdminRows = perAdmin;
  const rowTotalCollected = (row) =>
    Number(
      row.totalCollected ??
        row.financialTotal ??
        (Number(row.revenue || 0) + Number(row.moveOutPL || 0))
    );

  const perAdminTotals = useMemo(() => {
    return perAdminRows.reduce(
      (acc, r) => {
        const financial = Number(
          rowTotalCollected(r)
        );
        acc.revenue += financial;
        acc.totalRooms += Number(r.totalRooms || 0);
        acc.occupiedRooms += Number(r.occupiedRooms || 0);
        acc.enrolled += Number(r.activeEnrollments || 0);
        return acc;
      },
      { revenue: 0, totalRooms: 0, occupiedRooms: 0, enrolled: 0 }
    );
  }, [perAdminRows]);

  const occupancyPerAdmin =
    perAdminTotals.totalRooms > 0 ? Math.round((perAdminTotals.occupiedRooms / perAdminTotals.totalRooms) * 100) : 0;
  const revenuePerAdmin = perAdminRows.length ? perAdminTotals.revenue / perAdminRows.length : 0;
  const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const currentMonthRow = funnelRows.find((r) => String(r.month) === currentYearMonth) || null;
  const latestFunnelRow = funnelRows.length ? funnelRows[funnelRows.length - 1] : null;
  const snapshotProfit = Number(analytics?.liveFinancialSnapshot?.totalProfit || 0);
  const summaryProfit = Number(a?.totalProfit || 0);
  const snapshotRevenue = Number(analytics?.liveFinancialSnapshot?.totalRevenue || 0);
  const snapshotExpenses = Number(analytics?.liveFinancialSnapshot?.totalExpenses || 0);
  const computedSnapshotProfit = snapshotRevenue - snapshotExpenses;
  const currentMonthRevenue = Number(currentMonthRow?.revenue ?? 0);
  const latestMonthRevenue = Number(latestFunnelRow?.revenue ?? 0);
  const summaryRevenue = Number(a?.totalRevenue || 0);
  let effectiveRevenue = 0;
  let revenueSource = "no revenue rows";
  let effectiveProfitLoss = 0;
  let profitSource = "no financial rows";
  const currentMonthProfit = Number(currentMonthRow?.profit ?? 0);
  const latestMonthProfit = Number(latestFunnelRow?.profit ?? 0);
  const hasSnapshotFinancial =
    analytics?.liveFinancialSnapshot &&
    (snapshotRevenue !== 0 || snapshotExpenses !== 0 || snapshotProfit !== 0);
  if (currentMonthRow?.profit != null && currentMonthProfit !== 0) {
    effectiveProfitLoss = Number(currentMonthRow.profit);
    profitSource = "current month (funnel)";
  } else if (latestFunnelRow?.profit != null && latestMonthProfit !== 0) {
    effectiveProfitLoss = Number(latestFunnelRow.profit);
    profitSource = "latest month (funnel)";
  } else if (hasSnapshotFinancial && analytics?.liveFinancialSnapshot?.totalProfit != null) {
    effectiveProfitLoss = snapshotProfit;
    profitSource = "saved backend snapshot";
  } else if (hasSnapshotFinancial) {
    effectiveProfitLoss = computedSnapshotProfit;
    profitSource = "snapshot (revenue-expense)";
  } else if (currentMonthRow?.profit != null) {
    effectiveProfitLoss = currentMonthProfit;
    profitSource = "current month (funnel)";
  } else if (latestFunnelRow?.profit != null) {
    effectiveProfitLoss = latestMonthProfit;
    profitSource = "latest month (funnel)";
  } else if (a?.totalProfit != null) {
    effectiveProfitLoss = summaryProfit;
    profitSource = "analytics summary";
  }

  if (snapshotRevenue !== 0) {
    effectiveRevenue = snapshotRevenue;
    revenueSource = "live booking collections (current month)";
  } else if (currentMonthRow?.revenue != null && currentMonthRevenue !== 0) {
    effectiveRevenue = currentMonthRevenue;
    revenueSource = "current month (funnel)";
  } else if (latestFunnelRow?.revenue != null && latestMonthRevenue !== 0) {
    effectiveRevenue = latestMonthRevenue;
    revenueSource = "latest month (funnel)";
  } else if (a?.totalRevenue != null) {
    effectiveRevenue = summaryRevenue;
    revenueSource = "analytics summary";
  }

  const trendData = funnelRows.map((row) => ({
    month: shortMonth(row.month),
    profit: Number(row.profit || 0),
    revenue: Number(row.revenue || 0),
    enrollments: Number(row.newEnrollments || 0),
    occupancyRate: occupancyPerAdmin,
  }));

  const filteredPerAdminRows = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    if (!q) return perAdminRows;
    return perAdminRows.filter((r) => {
      const name = String(r.adminName || "").toLowerCase();
      const id = String(r.adminId || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [perAdminRows, adminSearch]);

  useEffect(() => {
    setPageNumber(1);
  }, [adminSearch, perAdminRows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredPerAdminRows.length / PAGE_SIZE));
  const safePage = Math.min(pageNumber, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedRows = filteredPerAdminRows.slice(pageStart, pageStart + PAGE_SIZE);

  const chartRows = useMemo(() => {
    const sorted = [...filteredPerAdminRows].sort(
      (x, y) =>
        Number(rowTotalCollected(y)) - Number(rowTotalCollected(x))
    );
    return sorted.slice(0, 50);
  }, [filteredPerAdminRows]);

  const exportCsv = () => {
    const headers = [
      "adminId",
      "adminName",
      "propertyCount",
      "totalRooms",
      "occupiedRooms",
      "vacantRooms",
      "occupancyRate",
      "activeEnrollments",
      "revenue",
      "avgRevenuePerProperty",
    ];
    const lines = [headers.join(",")];
    for (const row of perAdminRows) {
      lines.push(
        [
          row.adminId,
          row.adminName,
          row.propertyCount,
          row.totalRooms,
          row.occupiedRooms,
          row.vacantRooms,
          row.occupancyRate,
          row.activeEnrollments,
          row.revenue,
          row.avgRevenuePerProperty,
        ]
          .map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `app-statistics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar section={section} page={page} />
      <div className="space-y-8 px-4 py-6 lg:px-8 pb-16">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">App statistics</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-gray-500">
            Cross-service analytics for admin growth and operations.
          </p>
          {flags.computedNote ? (
            <p className="mt-2 max-w-3xl rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
              {flags.computedNote}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            <input className="rounded-md border px-2 py-2 text-sm" type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
            <input className="rounded-md border px-2 py-2 text-sm" type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
            <input className="rounded-md border px-2 py-2 text-sm" type="number" placeholder="year" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))} />
            <input className="rounded-md border px-2 py-2 text-sm" placeholder="state" value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))} />
            <input className="rounded-md border px-2 py-2 text-sm" placeholder="city" value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} />
            <input className="rounded-md border px-2 py-2 text-sm" placeholder="pincode" value={filters.pincode} onChange={(e) => setFilters((f) => ({ ...f, pincode: e.target.value }))} />
            <input className="rounded-md border px-2 py-2 text-sm" placeholder="search area" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
            <select className="rounded-md border px-2 py-2 text-sm" value={filters.adminId} onChange={(e) => setFilters((f) => ({ ...f, adminId: e.target.value }))}>
              <option value="">All admins</option>
              {owners.map((o) => (
                <option key={String(o.id)} value={String(o.id)}>
                  {`${o.firstName || ""} ${o.lastName || ""}`.trim() || o.uniqueId}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm" onClick={exportCsv}>
              Export CSV
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}

        {sourceErrors.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            <p className="font-medium">Some data sources failed (sections may show zeros)</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {sourceErrors.map((se) => (
                <li key={`${se.source}-${se.message}`}>
                  <span className="font-medium">{se.source}</span>: {se.message}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-amber-900/90">
              Check admin-panel-service env: service URLs and matching <code className="rounded bg-white/80 px-1">INTERNAL_API_KEY</code> with
              user-service and booking-service. Ensure analytics-service and user-service are running.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
              <StatsCard title="Revenue (Collections)" colour="#ECFEFF" value={formatInr(effectiveRevenue)} growth={`source: ${revenueSource}`} />
              <StatsCard title="Dashboard total profit (global)" colour="#F5F3FF" value={formatInr(a.totalProfit)} growth="analytics DB" />
              <StatsCard title="Downloads (install proxy)" colour="#ECFDF5" value={formatInt(installProxy.total)} growth={`A:${formatInt(installProxy.adminApp)} C:${formatInt(installProxy.customerApp)}`} />
              <StatsCard title="Profit/Loss" colour="#ECF4FF" value={formatInr(effectiveProfitLoss)} growth={`source: ${profitSource}`} />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 sm:p-6">
              <h3 className="text-[14px] font-semibold text-gray-900">Growth trends</h3>
              <p className="text-xs text-gray-500 mt-0.5">Profit/loss (primary), revenue (secondary), and enrollments for analytics.</p>
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData.length ? trendData : [{ month: "—", profit: 0, revenue: 0, enrollments: 0 }]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="profit" name="Profit/Loss" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="revenue" name="Revenue" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="enrollments" name="Enrollments" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 sm:p-6">
              <h3 className="text-[14px] font-semibold text-gray-900">Area occupancy analytics</h3>
              <p className="text-xs text-gray-500 mt-0.5">For selected area filters and matched properties.</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatsCard title="Total beds" colour="#EEF0FF" value={formatInt(area.totalBeds)} growth="live" />
                <StatsCard title="Occupied beds" colour="#F0F9FF" value={formatInt(area.occupiedBeds)} growth="live" />
                <StatsCard title="Empty beds" colour="#ECFDF5" value={formatInt(area.emptyBeds)} growth="live" />
                <StatsCard title="Area occupancy rate" colour="#FFF7ED" value={`${formatInt(area.occupancyRate)}%`} growth={`${formatInt(area.matchedProperties)} properties`} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 sm:p-6">
              <h3 className="text-[14px] font-semibold text-gray-900">Per-admin occupancy and financials</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Shows top 50 admins by revenue for readability when the dataset is large.
              </p>
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartRows.map((r) => ({
                      name: String(r.adminName || r.adminId).slice(0, 18),
                      occupancy: Number(r.occupancyRate || 0),
                      revenue: Number(rowTotalCollected(r)),
                    }))}
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={48} />
                    <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickFormatter={(v) => formatInt(v)} />
                    <YAxis yAxisId="occ" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke="#10B981" name="Total Collected (₹ = rent + move-out P/L)" dot />
                    <Line yAxisId="occ" type="monotone" dataKey="occupancy" stroke="#4F46E5" name="Occupancy %" dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white overflow-x-auto">
              <div className="flex flex-col gap-2 border-b bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                  className="w-full rounded-md border px-2 py-1.5 text-sm sm:w-72"
                  placeholder="Search admin name or ID"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Showing {filteredPerAdminRows.length ? `${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, filteredPerAdminRows.length)}` : "0"} of {formatInt(filteredPerAdminRows.length)} admins
                </p>
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-3 py-2">Admin</th>
                    <th className="px-3 py-2">Total Collected</th>
                    <th className="px-3 py-2">Beds</th>
                    <th className="px-3 py-2">Enrolled</th>
                    <th className="px-3 py-2">Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={String(row.adminId)} className="border-b">
                      <td className="px-3 py-2">{row.adminName || row.adminId}</td>
                      <td className="px-3 py-2">
                        {formatInr(rowTotalCollected(row))}
                      </td>
                      <td className="px-3 py-2">{formatInt(row.totalRooms)}</td>
                      <td className="px-3 py-2">{formatInt(row.activeEnrollments)}</td>
                      <td className="px-3 py-2">{formatInt(row.occupancyRate)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredPerAdminRows.length ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500">
                  No per-admin rows returned. Either analytics DB has no property/revenue data yet, area filters excluded all owners, or the per-admin rollup request failed (see warnings above).
                </p>
              ) : null}
              {filteredPerAdminRows.length > 0 ? (
                <div className="flex items-center justify-end gap-2 border-t px-3 py-3">
                  <button
                    className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-600">
                    Page {safePage} / {totalPages}
                  </span>
                  <button
                    className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}





