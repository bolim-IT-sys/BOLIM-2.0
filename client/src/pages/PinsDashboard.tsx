import {
  Package,
  Layers,
  AlertTriangle,
  Wrench,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

export default function PinsDashboard() {
  // --- MOCK DATA (Replace with API fetch states later) ---
  const kpis = [
    {
      title: "Total Assets",
      value: "1,240",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Current Stocks",
      value: "845",
      icon: Layers,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Low Stocks",
      value: "12",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Under Repair",
      value: "8",
      icon: Wrench,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  const lowStocks = [
    { name: "Logitech MX Master 3S", category: "Peripherals", qty: 2, min: 10 },
    { name: 'Dell UltraSharp 27"', category: "Monitors", qty: 1, min: 5 },
    { name: "Lenovo ThinkPad X1", category: "Laptops", qty: 3, min: 8 },
    { name: "Cat6 Ethernet Cable 5m", category: "Cables", qty: 4, min: 20 },
    { name: 'MacBook Pro M3 16"', category: "Laptops", qty: 0, min: 4 },
  ];

  const activities = [
    {
      text: "15x Kingston RAM 16GB deployed to HR",
      time: "10 mins ago",
      type: "outbound",
    },
    {
      text: "Bulk shipment of 50x Dell Keyboards received",
      time: "2 hrs ago",
      type: "inbound",
    },
    {
      text: "MacBook Pro ID-9942 moved to 'Under Repair'",
      time: "4 hrs ago",
      type: "system",
    },
    {
      text: "5x Cisco Switches disposed (Obsolete)",
      time: "Yesterday",
      type: "outbound",
    },
  ];

  // --- CHART CONFIGURATIONS ---
  const inboundOutboundData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Inbound",
        data: [65, 59, 80, 81, 56, 55, 40, 60, 75, 88, 90, 110],
        backgroundColor: "#C6E0B4",
      },
      {
        label: "Outbound",
        data: [45, 48, 60, 74, 46, 50, 35, 50, 63, 72, 80, 95],
        backgroundColor: "#F4B183",
      },
    ],
  };

  const statusDistributionData = {
    labels: [
      "Available",
      "Deployed",
      "Under Repair",
      "Under Warranty",
      "On Hold",
      "Disposed",
    ],
    datasets: [
      {
        data: [450, 620, 25, 40, 15, 90],
        backgroundColor: [
          "#C6E0B4",
          "#00B0F0",
          "#F4CCCC",
          "#D9D2E9",
          "#D9D9D9",
          "#E6A57A",
        ],
      },
    ],
  };

  const categoryStocksData = {
    labels: [
      "Laptops",
      "Monitors",
      "Peripherals",
      "Networking",
      "Cables",
      "Storage",
    ],
    datasets: [
      {
        label: "Stock Level",
        data: [120, 85, 340, 45, 210, 145],
        backgroundColor: "#D9E2F3",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800 font-sans">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-5 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            IT INVENTORY DASHBOARD
          </h1>
          <p className="text-sm text-gray-500">
            Real-time stock status, analytics, and operational tracking
            parameters.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">
          <FileSpreadsheet size={16} />
          Export Stock Report
        </button>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
              <h3 className="text-3xl font-bold tracking-tight text-gray-900 mt-1">
                {kpi.value}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bg}`}>
              <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS LAYER 1: MONTHLY INBOUND VS OUTBOUND */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Inbound vs Outbound
        </h2>
        <div className="h-80 w-full">
          <Bar
            data={inboundOutboundData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>
      </div>

      {/* MIDDLE FLEX LAYER: PIE CHART & DATA TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Inventory Status Distribution (Pie/Doughnut) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Status Distribution
          </h2>
          <div className="h-64 flex items-center justify-center relative mt-auto mb-auto">
            <Doughnut
              data={statusDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom", labels: { boxWidth: 12 } },
                },
              }}
            />
          </div>
        </div>

        {/* Top 10 Low Stocks Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Top Low Stocks
          </h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-medium">
                  <th className="py-2 font-semibold">Item</th>
                  <th className="py-2 text-center font-semibold">Qty</th>
                  <th className="py-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lowStocks.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {item.name}
                      </p>
                      <span className="text-xs text-gray-400">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 text-center font-semibold text-gray-700">
                      {item.qty}{" "}
                      <span className="text-gray-300 font-normal">
                        / {item.min}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.qty === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {item.qty === 0 ? "Out of Stock" : "Low"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Feed */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activities
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex gap-3 items-start text-sm">
                <div
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    activity.type === "inbound"
                      ? "bg-green-50 text-green-600"
                      : activity.type === "outbound"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {activity.type === "inbound" ? (
                    <ArrowDownLeft size={14} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium leading-tight">
                    {activity.text}
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM LAYER: CATEGORY STOCKS HORIZONTAL BAR CHART */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Category Stocks Level
        </h2>
        <div className="h-64 w-full">
          <Bar
            data={categoryStocksData}
            options={{
              indexAxis: "y" as const, // Makes the bar chart horizontal
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
