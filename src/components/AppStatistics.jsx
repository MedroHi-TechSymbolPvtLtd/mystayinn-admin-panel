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

const adminAppUsers = [
  { label: "DAU", value: 4120 },
  { label: "WAU", value: 18900 },
  { label: "MAU", value: 72650 },
];

const customerAppUsers = [
  { label: "DAU", value: 28400 },
  { label: "WAU", value: 98200 },
  { label: "MAU", value: 312400 },
];

const downloads = [
  { platform: "Android — Admin", installs: 12400, updates: 8200 },
  { platform: "Android — Customer", installs: 89200, updates: 45100 },
  { platform: "iOS — Admin", installs: 3100, updates: 2100 },
  { platform: "iOS — Customer", installs: 22800, updates: 15600 },
];

const revenuePerPg = [
  { name: "Sunrise PG Koramangala", city: "Bengaluru", revenue: 428000, growth: "+12%" },
  { name: "Urban Nest Indiranagar", city: "Bengaluru", revenue: 315500, growth: "+4%" },
  { name: "Scholars Inn Whitefield", city: "Bengaluru", revenue: 298200, growth: "-2%" },
  { name: "Metro Stays HSR", city: "Bengaluru", revenue: 267900, growth: "+9%" },
  { name: "Comfort Zone Electronic City", city: "Bengaluru", revenue: 189400, growth: "+1%" },
];

const tenantsPerPg = [
  { name: "Sunrise PG Koramangala", enrolled: 142, activeBookings: 128, waitlist: 6 },
  { name: "Urban Nest Indiranagar", enrolled: 98, activeBookings: 91, waitlist: 3 },
  { name: "Scholars Inn Whitefield", enrolled: 210, activeBookings: 198, waitlist: 12 },
  { name: "Metro Stays HSR", enrolled: 76, activeBookings: 70, waitlist: 0 },
  { name: "Comfort Zone Electronic City", enrolled: 54, activeBookings: 52, waitlist: 1 },
];

const funnel = [
  { stage: "Install", admin: 2400, customer: 18000 },
  { stage: "Register", admin: 1900, customer: 14200 },
  { stage: "Active 7d", admin: 1650, customer: 11800 },
  { stage: "Paid / booked", admin: 980, customer: 6200 },
];

function formatInr(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function AppStatistics({ breadcrumb }) {
  const { section = "Analytics", page = "App statistics" } = breadcrumb || {};

  return (
    <div className="min-h-screen bg-white">
      <Navbar section={section} page={page} />
      <div className="space-y-8 px-4 py-6 lg:px-8 pb-16">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">App statistics</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-gray-500">
            Cross-app engagement, acquisition, and per-PG performance for planning growth. Figures below are{" "}
            <span className="font-medium text-gray-700">sample UI data</span> — wire to your analytics API later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard title="Admin app — MAU" colour="#EEF0FF" value="72.6k" growth="+11.01%" />
          <StatsCard title="Customer app — MAU" colour="#ECF4FF" value="312k" growth="+8.22%" />
          <StatsCard title="Total downloads (all builds)" colour="#F0FDF4" value="252k" growth="+5.40%" />
          <StatsCard title="Avg revenue / PG (MTD)" colour="#FFF7ED" value="₹2.1L" growth="+3.18%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-gray-900">Admin app — active users</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {adminAppUsers.map((row) => (
                <div key={row.label} className="rounded-xl bg-gray-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{row.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{row.value.toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-gray-400">Session length p50: 6m 12s · Crash-free: 99.6%</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-gray-900">Customer app — active users</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {customerAppUsers.map((row) => (
                <div key={row.label} className="rounded-xl bg-gray-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{row.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{row.value.toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-gray-400">Retention D7: 38% · Support tickets / 1k MAU: 4.1</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-gray-900">Downloads & updates (store + sideload)</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[640px] w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Channel</th>
                  <th className="pb-2 pr-4 font-medium">New installs (90d)</th>
                  <th className="pb-2 font-medium">Updates (90d)</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((r) => (
                  <tr key={r.platform} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 text-gray-900">{r.platform}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{r.installs.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 text-gray-700">{r.updates.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 sm:p-6">
          <h3 className="text-[14px] font-semibold text-gray-900">Acquisition funnel (both apps)</h3>
          <div className="mt-4 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="admin" name="Admin app" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="customer" name="Customer app" fill="#22C55E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-gray-900">Revenue per PG (MTD)</h3>
          <p className="mt-0.5 text-[12px] text-gray-500">Rank and compare properties for upsell and support load.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Property</th>
                  <th className="pb-2 pr-4 font-medium">City</th>
                  <th className="pb-2 pr-4 font-medium">Revenue</th>
                  <th className="pb-2 font-medium">MoM</th>
                </tr>
              </thead>
              <tbody>
                {revenuePerPg.map((r) => (
                  <tr key={r.name} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{r.city}</td>
                    <td className="py-2.5 pr-4 text-gray-900">{formatInr(r.revenue)}</td>
                    <td className={`py-2.5 font-medium ${r.growth.startsWith("-") ? "text-red-600" : "text-green-600"}`}>
                      {r.growth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-gray-900">Tenants enrolled per PG</h3>
          <p className="mt-0.5 text-[12px] text-gray-500">Enrollment pipeline vs live beds — spot capacity gaps.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Property</th>
                  <th className="pb-2 pr-4 font-medium">Enrolled (all-time)</th>
                  <th className="pb-2 pr-4 font-medium">Active bookings</th>
                  <th className="pb-2 font-medium">Waitlist</th>
                </tr>
              </thead>
              <tbody>
                {tenantsPerPg.map((r) => (
                  <tr key={r.name} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{r.enrolled}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{r.activeBookings}</td>
                    <td className="py-2.5 text-gray-700">{r.waitlist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Churned tenants (30d)", value: "1,240", hint: "vs prior month" },
            { title: "Avg onboarding time", value: "18 min", hint: "Customer app" },
            { title: "NPS (tenants, sample)", value: "42", hint: "Promoter % − detractor %" },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[12px] font-medium text-gray-500">{c.title}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="mt-1 text-[11px] text-gray-400">{c.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
