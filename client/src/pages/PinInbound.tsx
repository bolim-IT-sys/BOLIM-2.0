import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";

type SpareData = {
  id: number;
  category_id: number;
  part_number: string;
  product_name: string;
  no: number;
  specification: string;
  maker: string;
  stock: number | null;
  unit_price: number;
  remarks: string;
  app_holder: string;
  category: string;
};

type SummaryData = {
  part_number: string;
  total_inbound: number;

  [key: string]: string | number;
};

type UsageData = {
  part_number: string;
  total_usage: number;

  [key: string]: string | number;
};

export default function InventoryDashboard() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const { t } = useTranslation();
  const [inventoryData, setInventoryData] = useState<SpareData[]>([]);
  const [inboundData, setInboundData] = useState({
    part_number: "",
    quantity: "",
    inbound_date: "",
  });
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [useData, setUseData] = useState({
    part_number: "",
    quantity: "",
    usage_date: "",
  });

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleInbound = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/spare/inbound`, inboundData);

      enqueueSnackbar(`Inbound Successful!`, {
        variant: "success",
      });

      setInboundData({
        part_number: "",
        quantity: "",
        inbound_date: "",
      });

      fetchMovements();
    } catch (error: unknown) {
      console.error(error);

      let errorMessage = "Inbound failed";

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || "Server error";
      }

      enqueueSnackbar(errorMessage, {
        variant: "error",
      });
    }
  };

  const handleUsage = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/spare/usage`, useData);

      enqueueSnackbar(`Usage Recorded!`, {
        variant: "success",
      });

      setUseData({
        part_number: "",
        quantity: "",
        usage_date: "",
      });

      fetchMovements();
    } catch (error: unknown) {
      console.error(error);

      let errorMessage = "Usage failed";

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || "Server error";
      }

      enqueueSnackbar(errorMessage, {
        variant: "error",
      });
    }
  };

  const fetchMovements = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/spare/view`);
      setInventoryData(res.data);

      const summaryRes = await axios.get(
        `${API_URL}/spare/inbound-summary?year=${selectedYear}`,
      );

      setSummaryData(summaryRes.data);

      const usageRes = await axios.get(
        `${API_URL}/spare/usage-summary?year=${selectedYear}`,
      );

      setUsageData(usageRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, [API_URL, selectedYear]);
  useEffect(() => {
    fetchMovements();
  }, [fetchMovements, selectedYear]);

  return (
    <div className="h-full w-full bg-slate-50 p-4 md:p-6 space-y-6 overflow-y-auto">
      {/* Dual Forms Grid Block */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Inbound Parts Card */}
        <form
          onSubmit={handleInbound}
          className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-emerald-500 shadow-sm p-5 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {t("pininv.inparts")}
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t("pininv.prodnum")}
                </label>
                <input
                  type="text"
                  value={inboundData.part_number}
                  required
                  onChange={(e) =>
                    setInboundData({
                      ...inboundData,
                      part_number: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t("pininv.qty")}
                </label>
                <input
                  type="number"
                  value={inboundData.quantity}
                  required
                  onChange={(e) =>
                    setInboundData({
                      ...inboundData,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t("pininv.inDate")}
                </label>
                <input
                  type="date"
                  value={inboundData.inbound_date}
                  required
                  onChange={(e) =>
                    setInboundData({
                      ...inboundData,
                      inbound_date: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition"
            >
              {t("pininv.inbound")}
            </button>
          </div>
        </form>

        {/* Usage Parts Card */}
        <form
          onSubmit={handleUsage}
          className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-orange-500 shadow-sm p-5 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span>
              {t("pininv.useparts")}
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t("pininv.prodnum")}
                </label>
                <input
                  type="text"
                  value={useData.part_number}
                  required
                  onChange={(e) =>
                    setUseData({
                      ...useData,
                      part_number: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t("pininv.qty")}
                </label>
                <input
                  type="number"
                  value={useData.quantity}
                  required
                  onChange={(e) =>
                    setUseData({
                      ...useData,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t("pininv.useDate")}
                </label>
                <input
                  type="date"
                  value={useData.usage_date}
                  required
                  onChange={(e) =>
                    setUseData({
                      ...useData,
                      usage_date: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
            <button
              type="submit"
              className="rounded-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition"
            >
              {t("pininv.use")}
            </button>
          </div>
        </form>
      </div>

      {/* Metric Context Filter Utility Row */}
      <div className="flex items-center justify-end gap-3 rounded-xl bg-white p-4 border border-slate-200 shadow-sm">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          {t("pininv.year")}
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-700 transition"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Main Multi-Period Analytics Matrix Data Sheet Table */}
      <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-140 overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              {/* Primary Multi-Header Span Groupings */}
              <tr>
                <th className="sticky top-0 left-0 z-30 min-w-45 bg-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100 border-b border-r border-slate-700">
                  {t("pininv.prodnum")}
                </th>
                <th
                  colSpan={12}
                  className="sticky top-0 z-20 bg-emerald-700 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-emerald-50 border-b border-r border-emerald-800"
                >
                  {selectedYear} {t("pininv.inbound")}
                </th>
                <th className="sticky top-0 z-20 min-w-30 bg-emerald-800 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-emerald-50 border-b border-r border-emerald-900">
                  {t("pininv.totalIn")}
                </th>
                <th className="sticky top-0 z-20 min-w-30 bg-amber-700 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-amber-50 border-b border-r border-amber-800">
                  {t("pininv.avgUsage")}
                </th>
                <th
                  colSpan={12}
                  className="sticky top-0 z-20 bg-orange-700 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-orange-50 border-b border-r border-orange-800"
                >
                  {selectedYear} {t("pininv.usage")}
                </th>
                <th className="sticky top-0 z-20 min-w-30 bg-orange-800 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-orange-50 border-b">
                  {t("pininv.totalUse")}
                </th>
              </tr>

              {/* Calendar Multi-Header Breakdown Column Definitions */}
              <tr className="bg-slate-50 text-slate-700 text-xs font-semibold">
                {/* Pinned placeholder aligning lower stack underneath left product axis column */}
                <th className="sticky top-9 left-0 z-30 bg-slate-100 border-b border-r border-slate-200 shadow-[0_1px_0_0_rgba(226,232,240,1)]"></th>

                {/* Inbound Split Months */}
                {months.map((month) => (
                  <th
                    key={`in-${month}`}
                    className="sticky top-9 z-20 bg-emerald-50 px-2 py-1.5 text-center font-bold text-emerald-800 border-b border-r border-slate-200"
                  >
                    {month}
                  </th>
                ))}
                <th className="sticky top-9 z-20 bg-emerald-100 border-b border-r border-slate-200"></th>
                <th className="sticky top-9 z-20 bg-amber-50 border-b border-r border-slate-200"></th>

                {/* Consumption Split Months */}
                {months.map((month) => (
                  <th
                    key={`use-${month}`}
                    className="sticky top-9 z-20 bg-orange-50 px-2 py-1.5 text-center font-bold text-orange-800 border-b border-r border-slate-200"
                  >
                    {month}
                  </th>
                ))}
                <th className="sticky top-9 z-20 bg-orange-100 border-b border-slate-200"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {inventoryData.map((inventory, row) => (
                <tr
                  key={row}
                  className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/20"
                >
                  {/* Pinned Data Access Primary Column */}
                  <td className="sticky left-0 z-10 bg-white font-semibold text-slate-900 px-4 py-3 border-r border-slate-200 shadow-[1px_0_0_0_rgba(226,232,240,1)] group-hover:bg-slate-50">
                    {inventory.part_number}
                  </td>

                  {/* Inbound Period Render Loops */}
                  {months.map((month, i) => {
                    const summary = summaryData.find(
                      (s) => s.part_number === inventory.part_number,
                    );
                    return (
                      <td
                        key={`in-${row}-${i}`}
                        className="px-2 py-3 text-center font-medium text-slate-600 border-r border-slate-100 bg-emerald-50/10"
                      >
                        {summary?.[month] || "—"}
                      </td>
                    );
                  })}

                  {/* Aggregate Incoming Sum Total */}
                  <td className="bg-emerald-50/60 text-emerald-700 font-bold text-center px-3 py-3 border-r border-slate-200">
                    {summaryData.find(
                      (s) => s.part_number === inventory.part_number,
                    )?.total_inbound || 0}
                  </td>

                  {/* Aggregate Consumption Median Target Average */}
                  <td className="bg-amber-50/60 text-amber-800 font-bold text-center px-3 py-3 border-r border-slate-200">
                    {usageData.find(
                      (s) => s.part_number === inventory.part_number,
                    )?.avg_monthly_usage || 0}
                  </td>

                  {/* Outbound Operational Consumption Period Loops */}
                  {months.map((month, i) => {
                    const summary = usageData.find(
                      (s) => s.part_number === inventory.part_number,
                    );
                    return (
                      <td
                        key={`use-${row}-${i}`}
                        className="px-2 py-3 text-center font-medium text-slate-600 border-r border-slate-100 bg-orange-50/10"
                      >
                        {summary?.[month] || "—"}
                      </td>
                    );
                  })}

                  {/* Aggregate Consolidated Utilization Summary Total */}
                  <td className="bg-orange-50/60 text-orange-700 font-bold text-center px-3 py-3">
                    {usageData.find(
                      (s) => s.part_number === inventory.part_number,
                    )?.total_usage || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
