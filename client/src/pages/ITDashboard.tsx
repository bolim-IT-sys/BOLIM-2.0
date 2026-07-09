import { useState, useEffect } from "react";
import {
  Package,
  Layers,
  AlertTriangle,
  Banknote,
  //FileSpreadsheet,
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
import api from "../api/axios";
import { formatDistanceToNow } from "date-fns";

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

interface MonthlyData {
  labels: string[];
  inbound: number[];
  outbound: number[];
}

type StatusData = Record<string, number>;

interface LowStock {
  id: number;
  item_name: string;
  specification: string | null;
  category: string | null;
  company: string | null;
  unit_price: number;
  stock: number;
  image: string | null;
  created_at: string;
  dynamicSafetyStock: number;
  regularOrderQty: number;
}

interface Activity {
  text: string;
  time: string;
  type: string;
}

interface CategoryStock {
  category: string | null;
  count: number;
}

export default function ITDashboard() {
  const [kpis, setKpis] = useState({
    totalAssets: 0,
    currentStocks: 0,
    lowStocks: 0,
    inventoryValue: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [statusData, setStatusData] = useState<StatusData>({});
  const [lowStocks, setLowStocks] = useState<LowStock[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categoryStocks, setCategoryStocks] = useState<CategoryStock[]>([]);
  //console.log(categoryStocks);
  const kpisCards = [
    {
      title: "Total Assets",
      value: kpis.totalAssets,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Current Stocks",
      value: kpis.currentStocks,
      icon: Layers,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Low Stocks",
      value: kpis.lowStocks,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Inventory Value",
      value: `₩${Number(kpis.inventoryValue).toLocaleString()}`,
      icon: Banknote,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  // --- CHART CONFIGURATIONS ---
  const inboundOutboundData = {
    labels: monthlyData?.labels ?? [
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
        data: monthlyData?.inbound ?? [],
        backgroundColor: "#C6E0B4",
      },
      {
        label: "Outbound",
        data: monthlyData?.outbound ?? [],
        backgroundColor: "#F4B183",
      },
    ],
  };

  const statusDistributionData = {
    labels: statusData ? Object.keys(statusData) : [],
    datasets: [
      {
        data: statusData ? Object.values(statusData) : [],
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
    labels: categoryStocks.map((item) => item.category ?? "Unknown"),
    datasets: [
      {
        label: "Stock Level",
        data: categoryStocks.map((item) => Number(item.count)),
        backgroundColor: "#D9E2F3",
      },
    ],
  };

  const loadDashboard = async () => {
    try {
      const [kpiRes, monthlyRes, statusRes, lowRes, activityRes, categoryRes] =
        await Promise.all([
          api.get("/it-inventory/dashboard/kpis"),
          api.get("/it-inventory/dashboard/monthly"),
          api.get("/it-inventory/dashboard/status-distribution"),
          api.get("/it-inventory/dashboard/low-stocks"),
          api.get("/it-inventory/dashboard/activities"),
          api.get("/it-inventory/dashboard/category-stocks"),
        ]);

      setKpis(kpiRes.data);
      setMonthlyData(monthlyRes.data);
      setStatusData(statusRes.data);
      setLowStocks(lowRes.data);
      setActivities(activityRes.data);
      setCategoryStocks(categoryRes.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    loadDashboard();
  }, []);

  if (!monthlyData || !statusData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
      </div>
    );
  }

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
        {/*<button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">
          <FileSpreadsheet size={16} />
          Export Stock Report
        </button>*/}
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {kpisCards.map((kpi, idx) => (
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
                        {item.item_name}
                      </p>
                      <span className="text-xs text-gray-400">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 text-center font-semibold text-gray-700">
                      {item.stock}{" "}
                      <span className="text-gray-300 font-normal">
                        / {item.dynamicSafetyStock}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.stock === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {item.stock === 0 ? "Out of Stock" : "Low"}
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
                    {formatDistanceToNow(new Date(activity.time), {
                      addSuffix: true,
                    })}
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
