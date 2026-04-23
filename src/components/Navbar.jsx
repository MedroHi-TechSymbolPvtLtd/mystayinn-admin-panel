import { Bell, Moon, Sun, Star, PanelLeftDashed, History } from "lucide-react";
import { useAdminSession } from "../context/AdminSessionContext.jsx";

export default function Navbar({ section = "Dashboards", page = "Default" }) {
  const { admin } = useAdminSession();

  return (
    <div className="h-[56px] bg-white flex items-center justify-between px-6 border-b border-gray-100">
      <div className="flex items-center gap-4 text-[13px] text-gray-400">
        <div className="flex items-center gap-3 text-gray-900">
          <PanelLeftDashed size={16} strokeWidth={2.2} />
          <Star size={16} strokeWidth={2.2} />
        </div>

        <div className="flex items-center gap-2 ml-2">
          <span>{section}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{page}</span>
        </div>
      </div>

      <div className="flex items-center gap-5 text-gray-900 ">
        <div className="flex-1 flex justify-center">
          <div className="relative w-[220px]">
            <input
              type="text"
              placeholder="Search"
              className="w-full h-[30px] bg-gray-50 rounded-full pl-9 pr-9 text-[13px] text-gray-700 placeholder:text-gray-400 outline-none"
            />

            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">
              ⌕
            </span>

            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-white px-1.5 py-[1px] rounded border">
              /
            </span>
          </div>
        </div>
        <span className="hidden sm:inline text-[12px] text-gray-500 max-w-[140px] truncate" title={admin?.email || ""}>
          {admin?.name || ""}
        </span>
        <Sun size={16} strokeWidth={2.2} />
        <History size={16} strokeWidth={2.2} />
        <Bell size={16} strokeWidth={2.2} />
      </div>
    </div>
  );
}
