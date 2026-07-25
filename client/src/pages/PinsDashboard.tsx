import { useState, useEffect } from "react";
import {
  Package,
  Layers,
  AlertTriangle,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Search,
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
import { Bar } from "react-chartjs-2";
import api from "../api/axios";
import { formatDistanceToNow } from "date-fns";

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

interface LowStock {
  id: number;
  pin_name: string;
  specification: string | null;
  category: string | null;
  company: string | null;
  unit_price: number;
  stock: number;
  dynamicSafetyStock: number;
  regularOrderQty: number;
}

interface Activity {
  id: string;
  text: string;
  time: string;
  type: string;
}

export default function PINSDashboard() {
  const [kpis, setKpis] = useState({
    totalAssets: 0,
    currentStocks: 0,
    lowStocks: 0,
    inventoryValue: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [lowStocks, setLowStocks] = useState<LowStock[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- MODAL & FILTER STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<"ALL" | "LOW" | "OUT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const kpisCards = [
    {
      id: "total",
      title: "Total PIN Assets",
      value: kpis.totalAssets,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      clickable: false,
    },
    {
      id: "stocks",
      title: "Current Stocks",
      value: kpis.currentStocks,
      icon: Layers,
      color: "text-green-600",
      bg: "bg-green-50",
      clickable: false,
    },
    {
      id: "low-stocks",
      title: "Low Stocks",
      value: kpis.lowStocks,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      clickable: true, // Marker for clickable card
    },
    {
      id: "value",
      title: "Inventory Value",
      value: `₩${Number(kpis.inventoryValue).toLocaleString()}`,
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      clickable: false,
    },
  ];

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

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [kpiRes, monthlyRes, lowRes, activityRes] = await Promise.all([
        api.get("/pins-inventory/dashboard/kpis"),
        api.get("/pins-inventory/dashboard/monthly"),
        api.get("/pins-inventory/dashboard/low-stocks"),
        api.get("/pins-inventory/dashboard/activities"),
      ]);

      setKpis(kpiRes.data);
      setMonthlyData(monthlyRes.data);
      setLowStocks(lowRes.data);
      setActivities(activityRes.data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Filtered List for the Modal
  const modalFilteredItems = lowStocks.filter((item) => {
    const matchesSearch =
      item.pin_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());

    if (modalFilter === "OUT") return matchesSearch && item.stock === 0;
    if (modalFilter === "LOW") return matchesSearch && item.stock > 0;
    return matchesSearch;
  });

  if (isLoading || !monthlyData) {
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
            PINS INVENTORY DASHBOARD
          </h1>
          <p className="text-sm text-gray-500">
            Real-time stock status, monthly analytics, and material tracking.
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {kpisCards.map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => kpi.clickable && setIsModalOpen(true)}
            className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between transition-all ${
              kpi.clickable
                ? "cursor-pointer hover:border-amber-400 hover:shadow-md ring-amber-500/20"
                : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                {kpi.title}
                {kpi.clickable && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                    Click to View
                  </span>
                )}
              </p>
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

      {/* CHARTS LAYER */}
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

      {/* TABLES / FEED LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Low Stocks Card Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Low Stock PINs
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All ({lowStocks.length}) →
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            {lowStocks.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                All stocks are healthy.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-medium">
                    <th className="py-2 font-semibold">PIN Name</th>
                    <th className="py-2 text-center font-semibold">Qty</th>
                    <th className="py-2 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStocks.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {item.pin_name}
                        </p>
                        <span className="text-xs text-gray-400">
                          {item.category || item.specification || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 text-center font-semibold text-gray-700">
                        {item.stock}{" "}
                        <span className="text-gray-300 font-normal">
                          / {item.dynamicSafetyStock}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {/* Highlights: Amber = Low Stock, Rose = Out of Stock */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.stock === 0
                              ? "bg-rose-100 text-rose-800 font-semibold"
                              : "bg-amber-100 text-amber-800 font-semibold"
                          }`}
                        >
                          {item.stock === 0 ? "Out of Stock" : "Low Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activities Feed */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activities
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-96">
            {activities.map((activity, idx) => (
              <div
                key={activity.id || idx}
                className="flex gap-3 items-start text-sm"
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    activity.type === "inbound"
                      ? "bg-green-50 text-green-600"
                      : "bg-amber-50 text-amber-600"
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

      {/* --- LOW / OUT OF STOCK DETAILED MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Low & Out of Stock PIN Assets
                  </h3>
                  <p className="text-xs text-gray-500">
                    Detailed breakdown of items requiring reorder attention.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Controls Bar */}
            <div className="px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
              {/* Search Field */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search PIN name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                <button
                  onClick={() => setModalFilter("ALL")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    modalFilter === "ALL"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All ({lowStocks.length})
                </button>
                <button
                  onClick={() => setModalFilter("LOW")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    modalFilter === "LOW"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-amber-700 hover:bg-amber-100/50"
                  }`}
                >
                  Low Stock ({lowStocks.filter((i) => i.stock > 0).length})
                </button>
                <button
                  onClick={() => setModalFilter("OUT")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    modalFilter === "OUT"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-rose-700 hover:bg-rose-100/50"
                  }`}
                >
                  Out of Stock ({lowStocks.filter((i) => i.stock === 0).length})
                </button>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalFilteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No matching stock records found.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">PIN Name</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-center">Current Qty</th>
                      <th className="pb-3 text-center">Safety Stock</th>
                      <th className="pb-3 text-center">Reorder Qty</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {modalFilteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="py-3 font-medium text-gray-900">
                          {item.pin_name}
                          {item.specification && (
                            <span className="block text-xs text-gray-400 font-normal">
                              {item.specification}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-gray-500">
                          {item.category || "—"}
                        </td>
                        <td className="py-3 text-center font-bold text-gray-800">
                          {item.stock}
                        </td>
                        <td className="py-3 text-center text-gray-500">
                          {item.dynamicSafetyStock}
                        </td>
                        <td className="py-3 text-center font-semibold text-amber-600">
                          {item.regularOrderQty}
                        </td>
                        <td className="py-3 text-right">
                          {/* Color Badging */}
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.stock === 0
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {item.stock === 0 ? "Out of Stock" : "Low Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
