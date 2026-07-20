import { useState, useEffect } from "react";
import { Search, RotateCcw, ShieldAlert, Activity, Filter } from "lucide-react";
import api from "../api/axios";

type AuditLog = {
  id: number;
  username: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "TOGGLE_STATUS" | "LOGIN" | "LOGOUT";
  details: string;
  createdAt: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // Default: Newest first

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/logs");
      setLogs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filter & Search Logic
  const filteredLogs = logs
    .filter((log) => {
      const matchesSearch =
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction =
        selectedAction === "ALL" || log.action === selectedAction;

      return matchesSearch && matchesAction;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });

  // Helper Badge Color Styling based on Action Type
  const getActionBadge = (action: AuditLog["action"]) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "UPDATE":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "TOGGLE_STATUS":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/60";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600" />
            System Audit Logs
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Read-only chronological record of user actions and inventory
            adjustments.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm shadow-sm transition-all self-start sm:self-auto"
        >
          <RotateCcw size={15} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by user or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Created</option>
              <option value="UPDATE">Updated</option>
              <option value="DELETE">Deleted</option>
              <option value="TOGGLE_STATUS">Status Change</option>
            </select>
          </div>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th
                  className="p-4 pl-6 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  onClick={() =>
                    setSortDirection((prev) =>
                      prev === "asc" ? "desc" : "asc",
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Timestamp</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sortDirection === "asc" ? "▲ Oldest" : "▼ Newest"}
                    </span>
                  </div>
                </th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4 pr-6">Details / Description</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {/* Timestamp */}
                  <td className="p-4 pl-6 text-xs text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>

                  {/* Username Identity */}
                  <td className="p-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900">
                      @{log.username}
                    </span>
                  </td>

                  {/* Action Badge */}
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${getActionBadge(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  {/* Description Details */}
                  <td className="p-4 pr-6 text-slate-600 font-normal">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EMPTY / LOADING STATES */}
        {loading && (
          <div className="p-12 text-center text-slate-400 font-medium">
            Fetching system logs...
          </div>
        )}

        {!loading && filteredLogs.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
            <ShieldAlert size={24} className="text-slate-300" />
            <span>No activity records match your current filter criteria.</span>
          </div>
        )}
      </div>
    </div>
  );
}
