import { User, Bell } from "lucide-react";

export default function RightSidebar({ summary }) {
  const ps = summary?.propertiesStatus && typeof summary.propertiesStatus === "object"
    ? summary.propertiesStatus
    : null;
  const statusRows = ps
    ? Object.entries(ps).map(([k, v]) => ({ label: k, value: v }))
    : [];

  return (
    <div className="bg-white border-l border-gray-200 p-5 h-full lg:h-[95vh] flex flex-col justify-between sticky top-4">
      <div>
        <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Notifications</h3>

        <div className="space-y-5 text-[13px] text-gray-500">
          <p className="leading-relaxed">
            Notification feed is not exposed on admin-panel-service yet. Use{" "}
            <span className="font-medium text-gray-700">POST  /notify</span> from tools or wire FCM here.
          </p>
          {["Just now", "Earlier"].map((time, i) => (
            <div key={i} className="flex items-start gap-3 opacity-60">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {i === 1 ? <User size={14} className="text-gray-500" /> : <Bell size={14} className="text-gray-500" />}
              </div>
              <div className="leading-tight">
                <p className="text-gray-700">Placeholder</p>
                <p className="text-gray-400 text-[11px] mt-0.5">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#FAFAFA] max-w rounded-xl p-4 mt-8 border border-gray-100">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4 leading-tight">
          Properties by status
          <br />
          <span className="font-normal text-gray-500 text-xs">from dashboard summary</span>
        </h3>

        <div className="space-y-3 text-[13px]">
          {statusRows.length ? (
            statusRows.map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-gray-500 capitalize">{row.label}</span>
                <span className="font-medium text-gray-900">{String(row.value)}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-xs">No property status breakdown (empty or still loading).</p>
          )}
        </div>
      </div>
    </div>
  );
}
