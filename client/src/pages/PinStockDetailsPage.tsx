import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import {
  Package,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Minus,
  X,
  BarChart3,
} from "lucide-react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import InboundPrintLabel from "../components/InboundPrintLabel";
import OutboundPrintLabel from "../components/OutboundPrintLabel";

interface MonthlySummary {
  inbound: Record<string, number>;
  outbound: Record<string, number>;
  totalInbound: number;
  totalOutbound: number;
  safetyStock: number;
  averageMonthlyUsage: number;
  securementRate: number;
  excessShortage: number;
  regularOrderQty: number;
}

interface PinsAsset {
  id: number;
  pin_name: string;
  currentStock: number;
}

export default function ITStockDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const currentYear = new Date().getFullYear();

  // Base State
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [item, setItem] = useState<PinsAsset | null>(null);

  // Modal Visibility State
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showOutboundModal, setShowOutboundModal] = useState(false);

  // Modal Form States
  const initialInboundState = {
    lot_number: "",
    inbounding_personnel: "",
    inbound_quantity: "",
    inbound_date: new Date().toISOString().split("T")[0],
  };

  const initialOutboundState = {
    outbound_personnel: "",
    receiver: "",
    outbound_quantity: "", // Fixed typo from outbount_quanity
    outbound_date: new Date().toISOString().split("T")[0],
  };

  const [inboundForm, setInboundForm] = useState(initialInboundState);
  const [outboundForm, setOutboundForm] = useState(initialOutboundState);

  const [summary, setSummary] = useState<MonthlySummary>({
    inbound: {},
    outbound: {},
    totalInbound: 0,
    totalOutbound: 0,
    safetyStock: 0,
    averageMonthlyUsage: 0,
    securementRate: 0,
    excessShortage: 0,
    regularOrderQty: 0,
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

  const loadSummary = useCallback(async () => {
    try {
      const response = await api.get(
        `/pins-inventory/monthly-summary/${id}?year=${selectedYear}`,
      );
      setItem(response.data.item);
      setSummary(response.data.summary);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to load summary", { variant: "error" });
    }
  }, [id, selectedYear]);

  useEffect(() => {
    if (id) {
      loadSummary();
    }
  }, [loadSummary, id]);

  // Form Submit Handlers
  const handleInboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/pins-inventory/inbound", {
        asset_id: Number(id),
        ...inboundForm,
        inbound_quantity: Number(inboundForm.inbound_quantity),
      });

      enqueueSnackbar("Asset serial successfully inbounded!", {
        variant: "success",
      });
      setShowInboundModal(false);
      setInboundForm(initialInboundState);
      loadSummary();
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };
      enqueueSnackbar(
        apiError.response?.data?.message || "Inbound operation failed",
        { variant: "error" },
      );
    }
  };

  const handleOutboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qty = Number(outboundForm.outbound_quantity);

    // Frontend quick check (optional UX enhancement)
    if (item && qty > item.currentStock) {
      enqueueSnackbar(
        `Insufficient stock! Max available: ${item.currentStock}`,
        {
          variant: "error",
        },
      );
      return;
    }

    try {
      await api.post("/pins-inventory/outbound", {
        asset_id: Number(id), // Tied directly to the Item ID
        ...outboundForm,
        outbound_quantity: qty,
      });

      enqueueSnackbar("Outbound successful!", { variant: "success" });
      setShowOutboundModal(false);
      setOutboundForm(initialOutboundState);
      loadSummary();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      enqueueSnackbar(
        apiError.response?.data?.message || "Outbound operation failed",
        { variant: "error" },
      );
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 p-4 md:p-6 space-y-6 overflow-y-auto text-slate-800">
      {/* Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={() => setShowInboundModal(true)}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition gap-2 h-9.5"
          >
            <Plus size={16} />
            {t("buttons.inboundPin", "Inbound Pin")}
          </button>
          <button
            onClick={() => setShowOutboundModal(true)}
            className="inline-flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition gap-2 h-9.5"
          >
            <Minus size={16} />
            {t("buttons.outboundPin", "Outbound Pin")}
          </button>
        </div>
      </div>

      {/* KPI Performance / Summary Cards Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t("details.current", "Current Stock")}
            </p>
            <p className="text-xl font-bold text-slate-800">
              {item?.currentStock ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t("details.safety", "Safety Stock")}
            </p>
            <p className="text-xl font-bold text-slate-800">
              {summary.safetyStock}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t("details.monthly", "Monthly Avg Usage")}
            </p>
            <p className="text-xl font-bold text-slate-800">
              {summary.averageMonthlyUsage
                ? Number(summary.averageMonthlyUsage).toFixed(1)
                : "0.0"}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg ${
              summary.excessShortage < 0
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t("details.excess", "Excess/Shortage")}
            </p>
            <p
              className={`text-xl font-bold ${
                summary.excessShortage < 0 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {summary.excessShortage}
            </p>
          </div>
        </div>
      </div>

      {/* Main Analysis and Breakdown Area */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {item?.pin_name || "Pin Details"}
              </h2>
              <p className="text-xs text-slate-400">
                {t(
                  "details.breakdown",
                  "Monthly Inbound & Outbound Asset Breakdown Flow",
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                {t("details.year", "Year:")}
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-slate-200 text-sm font-medium rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  {months.map((month) => (
                    <th
                      key={month}
                      className="p-2.5 font-semibold tracking-wider"
                    >
                      {month}
                    </th>
                  ))}
                  <th className="bg-blue-600 text-white p-2.5 font-bold tracking-wider">
                    {t("details.total", "TOTAL")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50/50">
                  {months.map((month) => (
                    <td key={month} className="p-3 text-emerald-600">
                      {summary.inbound[month] > 0
                        ? `+${summary.inbound[month]}`
                        : "0"}
                    </td>
                  ))}
                  <td className="p-3 bg-blue-50/40 text-emerald-600 font-bold border-l border-slate-100">
                    {summary.totalInbound}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  {months.map((month) => (
                    <td key={month} className="p-3 text-red-500">
                      {summary.outbound[month] > 0
                        ? `-${summary.outbound[month]}`
                        : "0"}
                    </td>
                  ))}
                  <td className="p-3 bg-blue-50/40 text-red-600 font-bold border-l border-slate-100">
                    {summary.totalOutbound}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- INBOUND MODAL DIALOG --- */}
      {showInboundModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                {t("forms.newInbound", "New Inventory Inbound")}
              </h3>
              <button
                onClick={() => setShowInboundModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInboundSubmit} className="p-4 space-y-4">
              {/* Lot Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t("forms.lotNum", "Lot Number *")}
                </label>
                <input
                  required
                  type="text"
                  value={inboundForm.lot_number}
                  onChange={(e) =>
                    setInboundForm({
                      ...inboundForm,
                      lot_number: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Inbound Personnel */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t("forms.inPersonnel", "Inbound Personnel *")}
                </label>
                <input
                  required
                  type="text"
                  value={inboundForm.inbounding_personnel}
                  onChange={(e) =>
                    setInboundForm({
                      ...inboundForm,
                      inbounding_personnel: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Quantity & Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t("forms.quantity", "Quantity *")}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={inboundForm.inbound_quantity}
                    onChange={(e) =>
                      setInboundForm({
                        ...inboundForm,
                        inbound_quantity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t("forms.inDate", "Inbound Date *")}
                  </label>
                  <input
                    required
                    type="date"
                    value={inboundForm.inbound_date}
                    onChange={(e) =>
                      setInboundForm({
                        ...inboundForm,
                        inbound_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Conditional Print Label Button Section */}
              {inboundForm.lot_number?.trim() &&
                Number(inboundForm.inbound_quantity) > 0 && (
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2 animate-fadeIn">
                    <div className="flex justify-between items-center text-xs text-blue-900 font-medium px-1">
                      <span>
                        {t("forms.lot", "Lot:")}{" "}
                        <strong>{inboundForm.lot_number}</strong>
                      </span>
                      <span>
                        {t("forms.qty", "Qty:")}{" "}
                        <strong>{inboundForm.inbound_quantity}</strong>
                      </span>
                    </div>

                    <InboundPrintLabel
                      data={{
                        lot_number: inboundForm.lot_number,
                        quantity: inboundForm.inbound_quantity,
                        date: inboundForm.inbound_date,
                      }}
                    />
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInboundModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  {t("buttons.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {t("buttons.saveInbound", "Save Inbound")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- OUTBOUND MODAL DIALOG --- */}
      {showOutboundModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                {t("forms.pinDeployement", "Pin Deployment (Outbound)")}
              </h3>
              <button
                onClick={() => setShowOutboundModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOutboundSubmit} className="p-4 space-y-4">
              {/* Outbound Personnel & Receiver */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t("forms.outPersonnel", "Outbound Personnel *")}
                  </label>
                  <input
                    required
                    type="text"
                    value={outboundForm.outbound_personnel}
                    onChange={(e) =>
                      setOutboundForm({
                        ...outboundForm,
                        outbound_personnel: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t("forms.receiver", "Receiver *")}
                  </label>
                  <input
                    required
                    type="text"
                    value={outboundForm.receiver}
                    onChange={(e) =>
                      setOutboundForm({
                        ...outboundForm,
                        receiver: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t("forms.quantity", "Quantity *")}
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={outboundForm.outbound_quantity}
                  onChange={(e) =>
                    setOutboundForm({
                      ...outboundForm,
                      outbound_quantity: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>

              {/* Outbound Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t("forms.outDate", "Outbound Date *")}
                </label>
                <input
                  required
                  type="date"
                  value={outboundForm.outbound_date}
                  onChange={(e) =>
                    setOutboundForm({
                      ...outboundForm,
                      outbound_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>

              {/* Conditional Outbound Dispatch Print Label */}
              {Number(outboundForm.outbound_quantity) > 0 && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center text-xs text-amber-900 font-medium px-1">
                    <span>
                      Receiver:{" "}
                      <strong>{outboundForm.receiver || "N/A"}</strong>
                    </span>
                    <span>
                      Dispatched Qty:{" "}
                      <strong>{outboundForm.outbound_quantity}</strong>
                    </span>
                  </div>

                  <OutboundPrintLabel
                    data={{
                      lot_number:
                        item?.pin_name ||
                        `OUT-${outboundForm.outbound_date?.replace(/-/g, "") || "DEPLOY"}`,
                      quantity: outboundForm.outbound_quantity,
                      destination: outboundForm.receiver,
                      date: outboundForm.outbound_date,
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOutboundModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50 transition-colors"
                >
                  {t("buttons.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                >
                  {t("buttons.release", "Confirm Release")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
