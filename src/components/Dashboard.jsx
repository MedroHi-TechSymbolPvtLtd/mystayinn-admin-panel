import { useEffect, useMemo, useState } from "react";
import { City, State } from "country-state-city";
import pincodeDirectory from "india-pincode-lookup";
import StatsCard from "./StatsCard";
import Navbar from "./Navbar";
import RevenueChart from "./RevenueChart";
import BedChart from "./BedChart";
import OccupancyChart from "./OccupancyChart";
import RightSidebar from "./RightSidebar";
import {
  fetchAreaOccupancy,
  fetchDashboardMonthly,
  fetchDashboardSummary,
} from "../lib/adminPanelApi.js";

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
  const [areaQuery, setAreaQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPincode, setSelectedPincode] = useState("");
  const [areaOccupancy, setAreaOccupancy] = useState({
    availableBeds: 0,
    emptyBeds: 0,
    matchedProperties: 0,
  });
  const [areaLoading, setAreaLoading] = useState(false);

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

  const stateOptions = useMemo(() => {
    return State.getStatesOfCountry("IN").sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const selectedStateCode = useMemo(
    () => stateOptions.find((s) => s.name === selectedState)?.isoCode || "",
    [stateOptions, selectedState]
  );

  const cityOptions = useMemo(() => {
    if (!selectedStateCode) return [];
    return City.getCitiesOfState("IN", selectedStateCode).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedStateCode]);

  const pincodeOptions = useMemo(() => {
    if (!selectedState || !selectedCity) return [];
    const normalize = (v) =>
      String(v || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const cityNorm = normalize(selectedCity);
    const stateNorm = normalize(selectedState);

    // Package datasets can have legacy state names; keep state filtering soft.
    const rows = pincodeDirectory.lookup(selectedCity) || [];
    const cityMatched = rows.filter((row) => {
      const district = normalize(row?.districtName);
      const taluk = normalize(row?.taluk);
      const office = normalize(row?.officeName);
      return district.includes(cityNorm) || taluk.includes(cityNorm) || office.includes(cityNorm);
    });

    const stateMatched = cityMatched.filter((row) => {
      const rowState = normalize(row?.stateName);
      return rowState.includes(stateNorm) || stateNorm.includes(rowState);
    });

    const bestRows = stateMatched.length > 0 ? stateMatched : cityMatched;
    return Array.from(new Set(bestRows.map((row) => String(row?.pincode || "").trim()).filter(Boolean))).sort();
  }, [selectedState, selectedCity]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setAreaLoading(true);
      try {
        const data = await fetchAreaOccupancy({
          q: areaQuery,
          state: selectedState,
          city: selectedCity,
          pincode: selectedPincode,
        });
        if (!cancelled) {
          setAreaOccupancy({
            availableBeds: Number(data?.availableBeds || 0),
            emptyBeds: Number(data?.emptyBeds || 0),
            matchedProperties: Number(data?.matchedProperties || 0),
          });
        }
      } catch {
        if (!cancelled) {
          setAreaOccupancy({ availableBeds: 0, emptyBeds: 0, matchedProperties: 0 });
        }
      } finally {
        if (!cancelled) setAreaLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [areaQuery, selectedState, selectedCity, selectedPincode]);

  const a = summary?.analytics || {};
  const propertyCount = summary?.propertyCount ?? a.totalProperties ?? 0;
  const customers = a.totalCustomers ?? 0;
  const signups = summary?.userSignups || {};
  const adminAppSignups = signups.adminAppSignups ?? 0;
  const customerAppSignups = signups.customerAppSignups ?? 0;
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
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
                    <StatsCard
                      title="MyStayInn Business app signups"
                      colour="#F0F9FF"
                      value={formatInt(adminAppSignups)}
                      growth="live"
                    />
                    <StatsCard
                      title="MyStayInn app signups"
                      colour="#ECFDF5"
                      value={formatInt(customerAppSignups)}
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

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Area-wise Occupancy</h3>
                        <p className="text-xs text-slate-500">
                          Filter by state, city, or pincode to view bed occupancy.
                        </p>
                      </div>
                      <input
                        value={areaQuery}
                        onChange={(e) => setAreaQuery(e.target.value)}
                        placeholder="Enter state / city / pincode"
                        className="w-full sm:w-80 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                          setSelectedCity("");
                          setSelectedPincode("");
                        }}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="">Select state</option>
                        {stateOptions.map((state) => (
                          <option key={state.isoCode} value={state.name}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedCity}
                        onChange={(e) => {
                          setSelectedCity(e.target.value);
                          setSelectedPincode("");
                        }}
                        disabled={!selectedState}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">{selectedState ? "Select city" : "Select state first"}</option>
                        {cityOptions.map((city) => (
                          <option key={`${city.stateCode}-${city.name}`} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedPincode}
                        onChange={(e) => setSelectedPincode(e.target.value)}
                        disabled={!selectedCity}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">{selectedCity ? "Select pincode" : "Select city first"}</option>
                        {pincodeOptions.map((pc) => (
                          <option key={pc} value={pc}>
                            {pc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Matching properties: {areaOccupancy.matchedProperties}
                    </p>
                    {areaLoading ? (
                      <div className="mt-4 text-sm text-slate-500">Calculating occupancy...</div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                          <p className="text-xs uppercase font-semibold text-blue-700">Beds Available</p>
                          <p className="mt-1 text-2xl font-bold text-blue-900">{formatInt(areaOccupancy.availableBeds)}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                          <p className="text-xs uppercase font-semibold text-emerald-700">Beds Empty</p>
                          <p className="mt-1 text-2xl font-bold text-emerald-900">{formatInt(areaOccupancy.emptyBeds)}</p>
                        </div>
                      </div>
                    )}
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
