import { useState } from "react";
import { Menu } from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import Dashboard from "./Dashboard";
import AppStatistics from "./AppStatistics";
import PromotionsConsole from "./PromotionsConsole";
import SubscriptionsAccess from "./SubscriptionsAccess";

const titles = {
  overview: { section: "Dashboards", page: "Overview" },
  statistics: { section: "Analytics", page: "App statistics" },
  promotions: { section: "Growth", page: "Promotions" },
  subscriptions: { section: "Access control", page: "Subscriptions & access" },
};

export default function AdminLayout() {
  const [active, setActive] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const nav = titles[active] || titles.overview;

  return (
    <div className="min-h-screen bg-white">
      <LeftSidebar active={active} onNavigate={(id) => { setActive(id); setMobileNavOpen(false); }} />

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
        <span className="text-[14px] font-semibold text-gray-900">MyStayInn Admin</span>
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-lg border border-gray-200 p-2"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <Menu size={20} />
        </button>
      </div>

      {mobileNavOpen && (
        <div className="border-b border-gray-100 bg-white px-4 pb-4 lg:hidden">
          {["overview", "statistics", "promotions", "subscriptions"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => { setActive(id); setMobileNavOpen(false); }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] ${
                active === id ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700"
              }`}
            >
              {titles[id]?.page ?? id}
            </button>
          ))}
        </div>
      )}

      <div className="lg:pl-56">
        {active === "overview" && <Dashboard breadcrumb={nav} />}
        {active === "statistics" && <AppStatistics breadcrumb={nav} />}
        {active === "promotions" && <PromotionsConsole breadcrumb={nav} />}
        {active === "subscriptions" && <SubscriptionsAccess breadcrumb={nav} />}
      </div>
    </div>
  );
}
