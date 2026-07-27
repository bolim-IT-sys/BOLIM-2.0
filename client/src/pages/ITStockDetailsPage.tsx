import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import {
  FileDown,
  Search,
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
import { MModal } from "../modals/MovableModal";
import RepairForm from "../components/RepairFrom";
import RepairHistory from "../components/RepairHistory";

interface MonthlySummary {
  inbound: Record<string, number>;
  outbound: Record<string, number>;
  totalInbound: number;
  totalOutbound: number;
  safetyStock: number;
  averageMonthlyUsage: number; // Linked directly here
  securementRate: number;
  excessShortage: number;
  regularOrderQty: number;
}

interface ITAsset {
  id: number;
  item_name: string;
  currentStock: number;
}

interface ITSerialRecord {
  id?: number;
  asset_id: number | string;
  serial_number: string;
  pr_date: string | null;
  received_date: string | null;
  deployed_date: string | null;
  station: string | null;
  department: string | null;
  authorized_personnel: string | null;
  receiver: string | null;
  outbound_personnel: string | null;
  remarks:
    | "BRAND NEW: AVAILABLE"
    | "REPAIRED: AVAILABLE"
    | "RETURNED: AVAILABLE"
    | "DEPLOYED"
    | "UNDER REPAIR"
    | string;
  reason: string | null;
  reasonFor: string | null;
}

export default function ITStockDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const currentYear = new Date().getFullYear();

  // Base State
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [item, setItem] = useState<ITAsset | null>(null);
  const [records, setRecords] = useState<ITSerialRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Visibility State
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showOutboundModal, setShowOutboundModal] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState<ITSerialRecord | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<ITSerialRecord | null>(
    null,
  );

  // Modal Form States
  const [inboundForm, setInboundForm] = useState({
    inbound_personnel: "",
    serial_number: "",
    pr_date: "",
    received_date: "",
  });

  const [outboundForm, setOutboundForm] = useState({
    outbound_personnel: "",
    receiver: "",
    serial_number: "",
    station: "",
    department: "",
    reason: "",
    deployed_date: "",
  });

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

  const statusClasses: Record<string, string> = {
    "BRAND NEW: AVAILABLE": "bg-blue-500",
    DEPLOYED: "bg-green-500",
    RETURNED: "bg-purple-500",
    "UNDER REPAIR": "bg-orange-500",
    "REPAIRED: AVAILABLE": "bg-cyan-500",
    "UNDER WARRANTY": "bg-yellow-500 text-black",
    "ON HOLD": "bg-gray-500",
    DISPOSED: "bg-red-500",
    AVAILABLE: "bg-emerald-500",
    "Repair Failed": "bg-amber-500",
  };

  const loadSummary = useCallback(async () => {
    try {
      const response = await api.get(
        `/it-inventory/monthly-summary/${id}?year=${selectedYear}`,
      );
      setItem(response.data.item);
      setSummary(response.data.summary);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to load summary", { variant: "error" });
    }
  }, [id, selectedYear]);

  const loadRecords = useCallback(async () => {
    try {
      const response = await api.get(`/it-inventory/serials/${id}`, {
        params: { year: selectedYear, search },
      });
      setRecords(response.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to load records", { variant: "error" });
    }
  }, [id, selectedYear, search]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Form Submit Handlers
  const handleInboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/it-inventory/inbound", {
        asset_id: id,
        ...inboundForm,
      });
      enqueueSnackbar("Asset serial successfully inbounded!", {
        variant: "success",
      });
      setShowInboundModal(false);
      {
        /*setInboundForm({
        inbound_personnel: "",
        serial_number: "",
        pr_date: "",
        received_date: "",
      });*/
      }
      loadSummary();
      loadRecords();
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
    try {
      await api.post("/it-inventory/outbound", outboundForm);
      enqueueSnackbar("Asset successfully deployed outbound!", {
        variant: "success",
      });
      setShowOutboundModal(false);
      setIsSerialModalOpen(false);
      {
        /*setOutboundForm({
        outbound_personnel: "",
        receiver: "",
        serial_number: "",
        station: "",
        department: "",
        reason: "",
        deployed_date: "",
      });*/
      }
      loadSummary();
      loadRecords();
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

  const handleSendToRepair = () => {
    if (!selectedSerial) return;

    setShowRepairForm(true);
  };

  const handleUpdate = async () => {
    if (!editingRecord) return;

    try {
      await api.put(`/it-inventory/serials/${editingRecord.id}`, {
        serial_number: editingRecord.serial_number,
        pr_date: editingRecord.pr_date,
        received_date: editingRecord.received_date,
        deployed_date: editingRecord.deployed_date,
        station: editingRecord.station,
        department: editingRecord.department,
        outbound_personnel: editingRecord.outbound_personnel,
        receiver: editingRecord.receiver,
        reason: editingRecord.reason,
      });

      loadRecords();

      setEditingId(null);
      setEditingRecord(null);

      enqueueSnackbar("Record updated successfully", {
        variant: "success",
      });

      setIsSerialModalOpen(false);

      loadRecords();
      loadSummary();
    } catch (error) {
      console.error(error);

      enqueueSnackbar("Failed to update record", {
        variant: "error",
      });
    }
  };

  const handleUpdateSerial = async () => {
    if (!selectedSerial) return;

    try {
      await api.put(`/it-inventory/serials/${selectedSerial.id}`, {
        serial_number: selectedSerial.serial_number,
        pr_date: selectedSerial.pr_date,
        received_date: selectedSerial.received_date,
        authorized_personnel: selectedSerial.authorized_personnel,
        reasonFor: selectedSerial.reasonFor,
      });

      enqueueSnackbar("Record updated successfully", {
        variant: "success",
      });

      setIsSerialModalOpen(false);
      setIsEditMode(!isEditMode);

      loadRecords();
      loadSummary();
    } catch (error) {
      console.error(error);

      enqueueSnackbar("Failed to update record", {
        variant: "error",
      });
    }
  };

  const handleExport = async () => {
    try {
      if (!filterFrom || !filterTo) {
        enqueueSnackbar(`Please select date range`, {
          variant: "error",
        });
        return;
      }
      const response = await api.get(`/it-inventory/export-serials/${id}`, {
        params: {
          from: filterFrom,
          to: filterTo,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");

      link.href = url;

      link.download = `IT_SERIAL_REPORT from ${filterFrom} to ${filterTo}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to export report", {
        variant: "error",
      });
    }
  };

  const handleReturn = async () => {
    if (!selectedSerial || isSubmitting) return;

    if (!window.confirm("Return this asset to inventory?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.put(
        `/it-inventory/return/${selectedSerial.id}`,
      );

      enqueueSnackbar("Item returned successfully.", {
        variant: "success",
      });

      await loadRecords();
      await loadSummary();

      setSelectedSerial(response.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to return item.", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHold = async () => {
    if (!selectedSerial || isSubmitting) return;

    if (!window.confirm("Put this asset on hold?")) return;

    try {
      setIsSubmitting(true);
      const response = await api.put(`/it-inventory/hold/${selectedSerial.id}`);

      enqueueSnackbar("Asset placed on hold.", {
        variant: "success",
      });

      await loadRecords();
      await loadSummary();

      setSelectedSerial(response.data);
    } catch (error) {
      console.error(error);

      enqueueSnackbar("Failed to update status.", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = async () => {
    if (!selectedSerial || isSubmitting) return;

    if (!window.confirm("Resume this asset?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.put(
        `/it-inventory/resume/${selectedSerial.id}`,
      );

      enqueueSnackbar("Item resumed successfully.", {
        variant: "success",
      });

      await loadRecords();
      await loadSummary();

      setSelectedSerial(response.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to resume item.", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToStock = async () => {
    if (!selectedSerial || isSubmitting) return;

    if (!window.confirm("Return this asset to inventory?")) return;

    try {
      setIsSubmitting(true);
      const response = await api.put(
        `/it-inventory/return-from-hold/${selectedSerial.id}`,
      );

      enqueueSnackbar("Item returned successfully.", {
        variant: "success",
      });

      await loadRecords();
      await loadSummary();

      setSelectedSerial(response.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to return item.", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWarranty = async () => {
    if (!selectedSerial || isSubmitting) return;

    if (!window.confirm("Send this asset under warranty?")) return;

    try {
      setIsSubmitting(true);
      const response = await api.put(
        `/it-inventory/warranty/${selectedSerial.id}`,
      );

      enqueueSnackbar("Asset sent under warranty.", {
        variant: "success",
      });

      await loadRecords();
      await loadSummary();

      setSelectedSerial(response.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to send asset under warranty.", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  };

  const handleWarrantyCompleted = async () => {
    if (!selectedSerial || isSubmitting) return;

    if (!window.confirm("Asset warranty completed?")) return;

    try {
      setIsSubmitting(true);
      const response = await api.put(
        `/it-inventory/warranty-complete/${selectedSerial.id}`,
      );

      enqueueSnackbar("Asset warranty complete.", {
        variant: "success",
      });

      await loadRecords();
      await loadSummary();

      setSelectedSerial(response.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to complete warranty process.", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  };

  const handleOpenDeployModal = () => {
    if (!selectedSerial) return;

    // Set the outbound input value to match the row we are looking at
    setOutboundForm({
      ...outboundForm,
      serial_number: selectedSerial.serial_number,
      // Optional: Pre-fill today's date automatically to save clicks
      deployed_date: new Date().toISOString().split("T")[0],
    });

    // Open your existing outbound dialog form
    setShowOutboundModal(true);
  };

  const handleDispose = async () => {
    if (!selectedSerial || isSubmitting) return;

    // 1. Collect Authorized Personnel
    const personnel = window.prompt(
      "Enter the name of the Authorized Personnel for this disposal:",
    );
    if (personnel === null) return; // User clicked Cancel
    if (!personnel.trim()) {
      enqueueSnackbar("Authorized personnel is required.", {
        variant: "error",
      });
      return;
    }

    // 2. Collect Reason
    const reason = window.prompt(
      "Enter the reason for disposal / scrap details:",
    );
    if (reason === null) return; // User clicked Cancel
    if (!reason.trim()) {
      enqueueSnackbar("Reason for disposal is required.", { variant: "error" });
      return;
    }

    // 3. Final Confirmation Guard
    if (
      !window.confirm(
        "Are you sure you want to dispose of this asset? This action is completely irreversible.",
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Pass the collected strings inside the PUT body payload
      await api.put(`/it-inventory/dispose/${selectedSerial.id}`, {
        authorized_personnel: personnel.trim(),
        reasonFor: reason.trim(),
      });

      enqueueSnackbar("Asset disposed successfully.", {
        variant: "success",
      });

      // 2. Refresh dashboard grids
      await loadRecords();
      await loadSummary();

      // 3. CLEAN UP MODAL STATE
      // Extract the serial directly from the wrapper object response (.data.serial)
      //if (response.data && response.data.serial) {
      //  setSelectedSerial(response.data.serial);
      //}

      // Close the modal since it is now archived/dead inventory
      setIsSerialModalOpen(false);
    } catch (error) {
      console.error(error);
      const errorMsg = error as { response?: { data?: { message?: string } } };
      enqueueSnackbar(
        errorMsg.response?.data?.message || "Failed to dispose asset.",
        {
          variant: "error",
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 p-4 md:p-6 space-y-6 overflow-y-auto text-slate-800">
      {/* Top Filter and Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-col w-full sm:w-44">
            <label
              htmlFor="from"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Filter From Date
            </label>
            <input
              id="from"
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="flex flex-col w-full sm:w-44">
            <label
              htmlFor="to"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Filter To Date
            </label>
            <input
              id="to"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              type="date"
              className="w-full border border-slate-200 bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition gap-2 h-9.5"
          >
            <FileDown size={16} />
            Export
          </button>
        </div>

        {/* Operational Flow Quick Trigger Sub-menu Context Links */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={() => setShowInboundModal(true)}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition gap-2 h-9.5"
          >
            <Plus size={16} />
            Inbound Stock
          </button>
          <button
            onClick={() => setShowOutboundModal(true)}
            className="inline-flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition gap-2 h-9.5"
          >
            <Minus size={16} />
            Outbound Asset
          </button>
        </div>
      </div>

      {/* Global Live Search Field Header Container Bar */}
      <div className="relative w-full bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search
          size={18}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(
            "search.placeholder",
            "Search Serial, Station, Department, Personnel...",
          )}
          className="w-full pl-10 pr-4 rounded-lg border border-slate-200 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
      </div>

      {/* KPI Performance / Summary Cards Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Current Stock
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
              Safety Stock
            </p>
            <p className="text-xl font-bold text-slate-800">
              {summary.safetyStock}
            </p>
          </div>
        </div>

        {/* REPLACED CARDS BLOCK: SECUREMENT RATE -> MONTHLY AVERAGE USAGE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Monthly Avg Usage
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
            className={`p-2.5 rounded-lg ${summary.excessShortage < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Excess/Shortage
            </p>
            <p
              className={`text-xl font-bold ${summary.excessShortage < 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              {summary.excessShortage}
            </p>
          </div>
        </div>
      </div>

      {/* Main Analysis and Breakdown Area */}
      <div className="space-y-6">
        {/* Monthly Summary Card Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {item?.item_name || "Item Details"}
              </h2>
              <p className="text-xs text-slate-400">
                Monthly Inbound & Outbound Asset Breakdown Flow
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Year:</span>
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
                    TOTAL
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

        {/* Detailed Serial Allocation Records Grid Block */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Asset Serial Allocation History
            </h3>
          </div>

          <div className="overflow-x-auto max-h-125">
            <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center">No.</th>
                  <th className="p-3">Serial Number</th>
                  <th className="p-3">PR Date</th>
                  <th className="p-3">Received Date</th>
                  <th className="p-3">Deployed Date</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Outbound Personnel</th>
                  <th className="p-3">Receiver</th>
                  <th className="p-3 text-center">Remarks</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-600">
                {records.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3 text-center font-medium text-slate-400">
                      {index + 1}
                    </td>
                    <td>
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.serial_number || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    serial_number: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <button
                          className="text-slate-700 hover:underline"
                          onClick={() => {
                            setSelectedSerial(record);
                            setIsSerialModalOpen(true);
                          }}
                        >
                          {record.serial_number}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.pr_date || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    pr_date: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        record.pr_date || "—"
                      )}
                    </td>
                    <td className="p-3 text-slate-500">
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.received_date || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    received_date: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        record.received_date || "—"
                      )}
                    </td>
                    <td className="p-3 text-slate-500">
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.deployed_date || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    deployed_date: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        record.deployed_date || "—"
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.station || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    station: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        record.station || "—"
                      )}
                    </td>
                    <td className="p-3">
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.department || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    department: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        record.department || "—"
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.outbound_personnel || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    outbound_personnel: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        record.outbound_personnel || "—"
                      )}
                    </td>
                    <td className="p-3">
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.receiver || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    receiver: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        record.receiver || "—"
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide shadow-sm
                        ${record.remarks?.includes("AVAILABLE") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : ""}
                        ${record.remarks === "DEPLOYED" ? "bg-blue-50 text-blue-700 border border-blue-200" : ""}
                        ${record.remarks === "UNDER REPAIR" ? "bg-rose-50 text-rose-700 border border-rose-200" : ""}
                        ${!["DEPLOYED", "UNDER REPAIR"].includes(record.remarks) && !record.remarks?.includes("AVAILABLE") ? "bg-slate-100 text-slate-600" : ""}
                      `}
                      >
                        {record.remarks}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-400 italic">
                      {editingId === record.id ? (
                        <input
                          value={editingRecord?.reason || ""}
                          onChange={(e) =>
                            setEditingRecord((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    reason: e.target.value,
                                  }
                                : null,
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        record.reason || "—"
                      )}
                    </td>
                    <td className="p-3 gap-1 flex">
                      {editingId === record.id && (
                        <button
                          onClick={handleUpdate}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg"
                        >
                          Save Changes
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const nextId = record.id ?? null;
                          setEditingId(editingId === nextId ? null : nextId);
                          setEditingRecord(record);
                        }}
                        className="p-2 bg-blue-600 rounded-lg text-white"
                      >
                        {editingId === record.id ? `Cancel` : "Edit"}
                      </button>
                    </td>
                  </tr>
                ))}

                {records.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="p-8 text-center text-slate-400 italic bg-slate-50/30"
                    >
                      No matching hardware allocation records found.
                    </td>
                  </tr>
                )}
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
                New Inventory Inbound
              </h3>
              <button
                onClick={() => setShowInboundModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInboundSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Inbound Personnel *
                </label>
                <input
                  required
                  type="text"
                  value={inboundForm.inbound_personnel}
                  onChange={(e) =>
                    setInboundForm({
                      ...inboundForm,
                      inbound_personnel: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Serial Number *
                </label>
                <input
                  required
                  type="text"
                  value={inboundForm.serial_number}
                  onChange={(e) =>
                    setInboundForm({
                      ...inboundForm,
                      serial_number: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                  placeholder="e.g. S/N-9323F82"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    PR Date
                  </label>
                  <input
                    type="date"
                    value={inboundForm.pr_date}
                    onChange={(e) =>
                      setInboundForm({
                        ...inboundForm,
                        pr_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Inbound Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={inboundForm.received_date}
                    onChange={(e) =>
                      setInboundForm({
                        ...inboundForm,
                        received_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInboundModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  Save Inbound
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- OUTBOUND MODAL DIALOG --- */}
      {showOutboundModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-60 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                Asset Deployment (Outbound)
              </h3>
              <button
                onClick={() => setShowOutboundModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handleOutboundSubmit}
              className="p-4 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Outbound Personnel *
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                    placeholder="Issuer Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Receiver *
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                    placeholder="Recipient Employee"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Serial Number *
                </label>
                <input
                  required
                  type="text"
                  value={outboundForm.serial_number}
                  onChange={(e) =>
                    setOutboundForm({
                      ...outboundForm,
                      serial_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                  placeholder="Enter specific S/N to deploy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Station *
                  </label>
                  <input
                    required
                    type="text"
                    value={outboundForm.station}
                    onChange={(e) =>
                      setOutboundForm({
                        ...outboundForm,
                        station: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                    placeholder="Line / Desk No."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Department *
                  </label>
                  <input
                    required
                    type="text"
                    value={outboundForm.department}
                    onChange={(e) =>
                      setOutboundForm({
                        ...outboundForm,
                        department: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                    placeholder="e.g. IT, Operations"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Outbound Date *
                </label>
                <input
                  required
                  type="date"
                  value={outboundForm.deployed_date}
                  onChange={(e) =>
                    setOutboundForm({
                      ...outboundForm,
                      deployed_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Reason / Remarks *
                </label>
                <textarea
                  required
                  rows={2}
                  value={outboundForm.reason}
                  onChange={(e) =>
                    setOutboundForm({ ...outboundForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2
                            focus:ring-blue-500/10 transition-all"
                  placeholder="e.g. New onboarding deployment, Hardware swap replacement"
                ></textarea>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOutboundModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  Confirm Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SERIAL MODAL DIALOG --- */}
      <MModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        title="Serial Details"
        size="xxl"
      >
        {selectedSerial && (
          <div className="space-y-6 overflow-y-auto max-h-[85vh] p-1">
            {/* 1. Conditional Overlay Form */}
            {showRepairForm && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner mb-4">
                <RepairForm
                  serialNumber={selectedSerial.serial_number}
                  onCancel={() => setShowRepairForm(false)}
                  onClose={async () => {
                    try {
                      await api.post(
                        `/it-inventory/repair/start/${selectedSerial.id}`,
                      );
                    } catch (error) {
                      console.error(
                        "Failed to update inventory status:",
                        error,
                      );
                      enqueueSnackbar(
                        "Repair saved, but failed to update inventory status.",
                        { variant: "error" },
                      );
                    } finally {
                      setShowRepairForm(false);
                      loadRecords();
                      loadSummary();
                      setIsSerialModalOpen(false);
                    }
                  }}
                />
              </div>
            )}

            {/* 2. Structured Table Data View */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-center">PR Date</th>
                    <th className="px-4 py-3 text-center">Date Received</th>
                    <th className="px-4 py-3 text-center">Serial Number</th>
                    <th className="px-4 py-3 text-center">Update By</th>
                    <th className="px-4 py-3 text-center">Reason</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      {isEditMode ? (
                        <input
                          type="date"
                          value={selectedSerial.pr_date || ""}
                          onChange={(e) =>
                            setSelectedSerial({
                              ...selectedSerial,
                              pr_date: e.target.value,
                            })
                          }
                          className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        selectedSerial.pr_date || "—"
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isEditMode ? (
                        <input
                          type="date"
                          value={selectedSerial.received_date || ""}
                          onChange={(e) =>
                            setSelectedSerial({
                              ...selectedSerial,
                              received_date: e.target.value,
                            })
                          }
                          className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        selectedSerial.received_date || "—"
                      )}
                    </td>

                    <td className="px-4 py-3 text-center font-medium text-slate-900">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={selectedSerial.serial_number || ""}
                          onChange={(e) =>
                            setSelectedSerial({
                              ...selectedSerial,
                              serial_number: e.target.value,
                            })
                          }
                          className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        selectedSerial.serial_number
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={selectedSerial.authorized_personnel || ""}
                          onChange={(e) =>
                            setSelectedSerial({
                              ...selectedSerial,
                              authorized_personnel: e.target.value,
                            })
                          }
                          className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        selectedSerial.authorized_personnel || "—"
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={selectedSerial.reasonFor || ""}
                          onChange={(e) =>
                            setSelectedSerial({
                              ...selectedSerial,
                              reasonFor: e.target.value,
                            })
                          }
                          className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        selectedSerial.reasonFor || "—"
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white tracking-wide shadow-sm ${
                          statusClasses[selectedSerial.remarks] ||
                          "bg-slate-500"
                        }`}
                      >
                        {selectedSerial.remarks}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Action Workflow Buttons (State Machine Driven) */}
            <div className="flex flex-wrap justify-end items-center gap-2 pt-2 border-t border-slate-100">
              {/* EDIT STATE BUTTONS - Globally Available unless Disposed */}
              {selectedSerial.remarks !== "DISPOSED" && (
                <>
                  {isEditMode ? (
                    <button
                      onClick={handleUpdateSerial}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                    >
                      Save Changes
                    </button>
                  ) : null}
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    {isEditMode ? "Cancel Edit" : "Edit Record"}
                  </button>
                </>
              )}

              {/* BRAND NEW: AVAILABLE WORKFLOWS */}
              {selectedSerial.remarks === "BRAND NEW: AVAILABLE" && (
                <>
                  <button
                    onClick={handleOpenDeployModal}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Deploy
                  </button>
                  <button
                    onClick={handleWarranty}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Warranty
                  </button>
                  <button
                    onClick={handleSendToRepair}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Send To Repair
                  </button>
                </>
              )}

              {/* REPAIRED: AVAILABLE WORKFLOWS */}
              {selectedSerial.remarks === "REPAIRED: AVAILABLE" && (
                <>
                  <button
                    onClick={handleOpenDeployModal}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Deploy
                  </button>
                  <button
                    onClick={handleSendToRepair}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Send To Repair
                  </button>
                </>
              )}

              {/* AVAILABLE WORKFLOWS */}
              {selectedSerial.remarks === "AVAILABLE" && (
                <>
                  <button
                    onClick={handleOpenDeployModal}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Deploy
                  </button>
                  <button
                    onClick={handleSendToRepair}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Send To Repair
                  </button>
                  <button
                    onClick={handleDispose}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Dispose
                  </button>
                </>
              )}

              {/* DEPLOYED WORKFLOWS */}
              {selectedSerial.remarks === "DEPLOYED" && (
                <>
                  <button
                    onClick={handleReturn}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Return
                  </button>
                  <button
                    onClick={handleWarranty}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Warranty
                  </button>
                  <button
                    onClick={handleHold}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Hold
                  </button>
                </>
              )}

              {/* RETURNED WORKFLOWS */}
              {selectedSerial.remarks === "RETURNED: AVAILABLE" && (
                <>
                  <button
                    onClick={handleOpenDeployModal}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Deploy
                  </button>
                  <button
                    onClick={handleSendToRepair}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Send To Repair
                  </button>
                  <button
                    onClick={handleDispose}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Dispose
                  </button>
                </>
              )}

              {/* UNDER WARRANTY WORKFLOWS */}
              {selectedSerial.remarks === "UNDER WARRANTY" && (
                <button
                  onClick={handleWarrantyCompleted}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Warranty Completed
                </button>
              )}

              {/* ON HOLD WORKFLOWS */}
              {selectedSerial.remarks === "ON HOLD" && (
                <>
                  <button
                    onClick={handleResume}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Resume
                  </button>
                  <button
                    onClick={handleReturnToStock}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Return to Stock
                  </button>
                </>
              )}

              {/* DISPOSED STATE */}
              {selectedSerial.remarks === "DISPOSED" && (
                <span className="text-xs text-slate-400 italic font-medium select-none pr-2">
                  Archived — View Only Mode
                </span>
              )}

              {/* REPAIR FAILED STATE */}
              {selectedSerial.remarks === "Repair Failed" && (
                <>
                  <button
                    onClick={handleSendToRepair}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Retry Repair
                  </button>
                  <button
                    onClick={handleDispose}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Dispose
                  </button>
                </>
              )}
            </div>

            {/* 4. Timeline History Footer */}
            {selectedSerial && selectedSerial.id !== undefined && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <RepairHistory
                  serialNumber={selectedSerial.serial_number}
                  selectedId={selectedSerial.id}
                  onRefresh={() => {
                    loadRecords();
                    loadSummary();
                    setIsSerialModalOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </MModal>
    </div>
  );
}
