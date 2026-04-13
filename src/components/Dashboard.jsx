import StatsCard from "./StatsCard";
import Navbar from "./Navbar";
import RevenueChart from "./RevenueChart";
import BedChart from "./BedChart";
import OccupancyChart from "./OccupancyChart";
import RightSidebar from "./RightSidebar";

export default function Dashboard({ breadcrumb }) {
  const { section = "Dashboards", page = "Overview" } = breadcrumb || {};

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-screen overflow-hidden">
        <div className="overflow-y-auto px-4 lg:px-0 pr-0 lg:pr-4 no-scrollbar">
          <Navbar section={section} page={page} />

          <div className="gap-6">
            <div className="w-auto space-y-6 pb-10">
              <h2 className="text-lg font-semibold text-gray-900">Overview</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard title="Active PG admins" colour="#EEF0FF" value="7,265" growth="+11.01%" />
                <StatsCard title="Active tenants (Customer app)" colour="#ECF4FF" value="36,710" growth="+4.12%" />
                <StatsCard title="Combined MAU (both apps)" colour="#F0FDF4" value="41,200" growth="+8.40%" />
                <StatsCard title="Est. platform revenue (MTD)" colour="#FFF7ED" value="₹42.8L" growth="+6.08%" />
              </div>

              <RevenueChart />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
                <BedChart />
                <OccupancyChart />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>

      <div className="block lg:hidden px-4 pb-6">
        <RightSidebar />
      </div>
    </div>
  );
}
