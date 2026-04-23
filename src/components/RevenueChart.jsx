import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";

const EMPTY = [];

export default function RevenueChart({ data = EMPTY }) {
  const chartData = data.length ? data : [{ month: "—", revenue: 0, expenses: 0 }];

  return (
    <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl h-[300px] sm:h-[350px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Revenue vs expenses (YTD)</h3>
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-black" />
            Revenue
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-300" />
            Expenses
          </div>
        </div>
        <div />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="fadeGray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="month"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              fontSize: "12px",
            }}
          />
          <Area type="monotone" dataKey="revenue" stroke="none" fill="url(#fadeGray)" />
          <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} dot={false} name="Revenue" />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#93C5FD"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Expenses"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
