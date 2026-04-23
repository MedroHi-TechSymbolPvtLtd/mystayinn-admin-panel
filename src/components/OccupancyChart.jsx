import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const FALLBACK = [{ name: "No data", value: 1, color: "#e5e7eb" }];

export default function OccupancyChart({ data, occupancyRate }) {
  const chartData = Array.isArray(data) && data.length ? data : FALLBACK;
  const label =
    occupancyRate != null && !Number.isNaN(Number(occupancyRate))
      ? `${Number(occupancyRate).toFixed(1)}%`
      : "—";

  return (
    <div className="bg-[#FAFAFA] p-6 rounded-2xl h-[300px]">
      <h3 className="font-semibold text-gray-900 mb-2">Room occupancy</h3>
      <p className="text-xs text-gray-500 mb-4">Rate: {label}</p>

      <div className="flex items-center justify-between">
        <div className="w-[200px] h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={6}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4 text-sm">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-4 w-[180px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="flex-1 text-gray-900">{item.name}</span>
              <span className="text-gray-700 font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
