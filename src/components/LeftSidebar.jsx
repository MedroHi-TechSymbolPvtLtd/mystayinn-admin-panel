import { LayoutGrid, BarChart3, Megaphone, ShieldCheck, Sparkles } from "lucide-react";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "statistics", label: "App statistics", icon: BarChart3 },
  { id: "promotions", label: "Promotions", icon: Megaphone },
  { id: "subscriptions", label: "Subscriptions & access", icon: ShieldCheck },
];

export default function LeftSidebar({ active, onNavigate }) {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-56 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Sparkles size={16} strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-gray-900">MyStayInn</p>
          <p className="text-[10px] text-gray-400">Super admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ id, label, icon }) => {
          const NavIcon = icon;
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors ${
                isActive
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <NavIcon size={18} strokeWidth={2} className={isActive ? "text-indigo-600" : "text-gray-400"} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <p className="text-[11px] leading-relaxed text-gray-400">
          Analytics & messaging UI only — connect APIs when ready.
        </p>
      </div>
    </aside>
  );
}
