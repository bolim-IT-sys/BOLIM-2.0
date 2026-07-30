import { useCallback, useEffect, useState } from "react";
//import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import { FileDown } from "lucide-react";
import api from "../api/axios";

type MovementFormData = {
  personnel: string;
  date: string;
  description: string;
  serial: string;
  quantity: number;
  from: string;
  to: string;
  condition: string;
  remarks: string;
};

export default function EquipmentMovement() {
  //const [isFetching, setIsFetching] = useState<boolean>();
  //const { t } = useTranslation();
  const [movements, setMovements] = useState<MovementFormData[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const initialForm = {
    personnel: "",
    date: "",
    description: "",
    serial: "",
    quantity: 0,
    from: "",
    to: "",
    condition: "",
    remarks: "",
  };
  const [form, setForm] = useState<MovementFormData>(initialForm);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleExport = async () => {
    try {
      if (!fromDate || !toDate) {
        enqueueSnackbar(`Please select date range`, {
          variant: "error",
        });
        return;
      }
      const res = await api.post(
        `/movement/export-items-to-excel`,
        {
          fromDate,
          toDate,
        },
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Equipment Transfer ${fromDate} to ${toDate}.xlsx`,
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url); // cleanup
    } catch (error) {
      console.error("Export failed ❌", error);
    }
  };

  const fetchMovements = useCallback(async () => {
    try {
      const res = await api.get(`/movement/view`);
      setMovements(res.data.data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/movement`, form);
      enqueueSnackbar(`Saved!`, {
        variant: "success",
      });
      setForm(initialForm);
      fetchMovements();
    } catch (error) {
      console.error(error);
      enqueueSnackbar(`Error saving!`, {
        variant: "error",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Equipment Movement Log
        </h1>
        <p className="text-sm text-slate-500">
          Track, manage, and export equipment asset transfers across lines.
        </p>
      </div>

      {/* Section 1: Top Export & Filter Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col w-full sm:w-44">
            <label
              htmlFor="from"
              className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              Filter From Date
            </label>
            <input
              id="from"
              name="from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="flex flex-col w-full sm:w-44">
            <label
              htmlFor="to"
              className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              Filter To Date
            </label>
            <input
              id="to"
              name="to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <button
          onClick={handleExport}
          className="w-full sm:w-auto inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition gap-2"
        >
          <FileDown size={16} />
          Export to Excel
        </button>
      </div>

      {/* Section 2: Core Form & Data Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start flex-1">
        {/* Dynamic Submit Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 xl:col-span-1">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Log New Transfer
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Name of Personnel
              </label>
              <input
                type="text"
                name="personnel"
                value={form.personnel}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Transfer Date
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Item Description
              </label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Asset Tag / Serial No.
              </label>
              <input
                type="text"
                name="serial"
                value={form.serial}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                From Location / Line
              </label>
              <input
                type="text"
                name="from"
                value={form.from}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                To Location / Line
              </label>
              <input
                type="text"
                name="to"
                value={form.to}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Reason for Transfer
              </label>
              <input
                type="text"
                name="condition"
                value={form.condition}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Remarks
              </label>
              <input
                type="text"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm py-2.5 rounded-lg shadow-sm transition mt-2"
            >
              Submit Entry
            </button>
          </form>
        </div>

        {/* Structured Logs Table Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-3 h-full flex flex-col">
          <div className="border-b border-slate-100 p-4 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Movement Records Table
            </h2>
          </div>

          <div className="overflow-x-auto flex-1 max-h-170">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm relative">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                <tr>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                    Personnel
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                    Item Description
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                    Asset Tag / Serial
                  </th>
                  <th className="px-4 py-3.5 text-center font-semibold text-slate-700 whitespace-nowrap">
                    Qty
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                    From Location
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                    To Location
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                    Reason
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {movements.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/30"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {item.personnel}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 min-w-45">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap bg-slate-50/50 rounded border border-slate-100">
                      {item.serial}
                    </td>
                    <td className="px-4 py-3 text-slate-900 text-center font-semibold">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {item.from}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {item.to}
                    </td>
                    <td className="px-4 py-3 text-slate-600 min-w-37.5">
                      {item.condition}
                    </td>
                    <td
                      className="px-4 py-3 text-slate-500 max-w-50 truncate"
                      title={item.remarks}
                    >
                      {item.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {movements.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-slate-300 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <div className="text-sm font-medium text-slate-500">
                  No movement records found
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  New equipment entries will appear in this log sequence.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
