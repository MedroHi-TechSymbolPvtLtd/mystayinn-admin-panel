import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";

const DEFAULT = [
  { name: "Total rooms", value: 0, color: "#A9C3EC" },
  { name: "Occupied", value: 0, color: "#6EE7D1" },
  { name: "Vacant", value: 0, color: "#7FB9FF" },
];

export default function BedChart({ data }) {
  const chartData = Array.isArray(data) && data.length ? data : DEFAULT;

  return (
    <div className="bg-[#FAFAFA] p-4 sm:p-6 rounded-2xl h-[260px] sm:h-[300px] w-full">
      <h3 className="font-semibold text-gray-900 mb-6">Rooms (from analytics DB)</h3>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap={42}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#374151", fontSize: 13 }}
          />
          <Bar dataKey="value" radius={[9, 9, 9, 9]} barSize={29}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
