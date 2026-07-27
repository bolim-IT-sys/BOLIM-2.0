import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import api from "../api/axios";

export type Repair = {
  id: number;
  serial_number: string;
  reported_date: string;
  issue_description: string;
  status: "Pending" | "In Progress" | "Completed" | "Failed";
  started_date: string;
  completed_date: string;
  before_picture: string;
  after_picture: string;
  personnel: string;
  createdAt: string;
};

type Props = {
  serialNumber: string;
  selectedId: number;
  onRefresh?: () => void;
};

const RepairHistory = ({ serialNumber, selectedId, onRefresh }: Props) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const API_BASE = "http://localhost:3000";
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Repair | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!serialNumber) return;

    const fetchData = async () => {
      try {
        const res = await api.get(`/repairs/${serialNumber}`);
        setRepairs(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [serialNumber]);

  // Helper function to resolve media URLs safely
  const getImageUrl = (path?: string) => {
    if (!path) return "/placeholder.png";
    return `${API_BASE}/${path.replace(/^\/+/, "")}`;
  };

  const formatLongDate = (dateInput?: string | Date | null): string => {
    if (!dateInput) return "N/A";

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "N/A";

    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const timePart = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${datePart} • ${timePart}`;
  };

  const handleEdit = (repair: Repair) => {
    setEditingId(repair.id);
    setEditData(repair);
    setFile(null);
  };

  const handleUpdate = async () => {
    try {
      if (!editData) return;

      // 1. Validation: "After picture" is required ONLY for "Completed" status
      if (editData.status === "Completed" && !file && !editData.after_picture) {
        enqueueSnackbar("After picture is required when repair is completed.", {
          variant: "warning",
        });
        return;
      }

      // 2. Build form payload
      const formData = new FormData();
      formData.append("status", editData.status);
      if (editData.started_date) {
        formData.append("started_date", editData.started_date);
      }
      if (editData.completed_date) {
        formData.append("completed_date", editData.completed_date);
      }
      if (file) {
        formData.append("after_picture", file);
      }

      // 3. Update repair ticket details
      await api.put(`/repairs/${editingId}`, formData);

      // 4. Update main inventory status depending on repair result
      if (editData.status === "Completed") {
        await api.post(`/it-inventory/repair/complete/${selectedId}`, {
          status: "REPAIRED: AVAILABLE",
        });
      } else if (editData.status === "Failed") {
        await api.post(`/it-inventory/repair/complete/${selectedId}`, {
          status: "Repair Failed",
        });
      }

      // 5. Refresh tables and feedback
      if (onRefresh) {
        onRefresh();
      }

      const res = await api.get(`/repairs/${serialNumber}`);
      setRepairs(res.data);

      enqueueSnackbar("Repair updated!", { variant: "success" });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Failed to update repair.", { variant: "error" });
    }
  };

  const getNowLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const subtractOneHour = (dateStr: string) => {
    const date = new Date(dateStr);
    const newDate = new Date(date.getTime() - 60 * 60 * 1000);
    const offset = newDate.getTimezoneOffset();
    return new Date(newDate.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const formatForInput = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const getStatusCardStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-red-100 text-red-800 border-red-500";
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-500";
      case "completed":
        return "bg-green-100 text-green-800 border-green-500";
      case "failed":
        return "bg-amber-100 text-amber-800 border-amber-500";
      default:
        return "bg-gray-100 text-gray-800 border-gray-500";
    }
  };

  return (
    <div className="mb-2 max-w-6xl mx-auto p-4">
      <h4 className="text-xl font-bold text-center mb-4 text-gray-800 border-b pb-2">
        {t("rh.RH")}
      </h4>

      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
        {repairs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t("rh.nrh")}</p>
        ) : (
          repairs.map((r) => {
            const statusNormalized = r.status.toLowerCase();
            const isEditable =
              statusNormalized === "pending" ||
              statusNormalized === "in progress";
            const isEditing = editingId === r.id;

            return (
              <div
                key={r.id}
                className={`rounded-lg border-s-4 p-4 bg-white shadow-sm transition-all hover:shadow-md ${getStatusCardStyles(
                  r.status,
                )}`}
              >
                {!isEditing ? (
                  /* Read View */
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Main Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-lg text-gray-900">
                          {r.issue_description}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-800 border">
                          {r.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">
                          {t("rh.Pers")}:
                        </span>{" "}
                        {r.personnel || "—"}
                      </p>

                      {/* Dates Timeline */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <div>
                          <span className="font-medium block text-gray-700">
                            {t("rh.RD")}
                          </span>
                          {formatLongDate(String(r.reported_date))}
                        </div>
                        <div>
                          <span className="font-medium block text-gray-700">
                            {t("rh.SD")}
                          </span>
                          {r.started_date
                            ? formatLongDate(String(r.started_date))
                            : "—"}
                        </div>
                        <div>
                          <span className="font-medium block text-gray-700">
                            {t("rh.CD")}
                          </span>
                          {r.completed_date
                            ? formatLongDate(String(r.completed_date))
                            : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Images & Actions */}
                    <div className="flex items-center gap-3 self-end lg:self-center">
                      <div className="flex gap-2">
                        {/* Before Image */}
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">
                            {t("rh.Bef")}
                          </span>
                          <img
                            src={getImageUrl(r.before_picture)}
                            alt="Before repair"
                            className="w-20 h-20 object-cover rounded border hover:opacity-90 cursor-pointer transition"
                            onClick={() =>
                              setSelectedImage(getImageUrl(r.before_picture))
                            }
                          />
                        </div>

                        {/* After Image */}
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">
                            {t("rh.Aft")}
                          </span>
                          <img
                            src={getImageUrl(r.after_picture)}
                            alt="After repair"
                            className="w-20 h-20 object-cover rounded border hover:opacity-90 cursor-pointer transition"
                            onClick={() =>
                              r.after_picture &&
                              setSelectedImage(getImageUrl(r.after_picture))
                            }
                          />
                        </div>
                      </div>

                      {isEditable && (
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition shadow-sm ml-2"
                          onClick={() => handleEdit(r)}
                        >
                          {t("rh.Upt")}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Edit View Form */
                  <div className="p-2 space-y-4">
                    <h5 className="font-semibold text-gray-700 text-sm border-b pb-1">
                      Edit Repair Entry
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Status Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">
                          {t("rh.Sta")}
                        </label>
                        <select
                          value={editData?.status || "Pending"}
                          onChange={(e) => {
                            const newStatus = e.target
                              .value as Repair["status"];
                            setEditData((prev) => {
                              if (!prev) return prev;
                              const updated: Repair = {
                                ...prev,
                                status: newStatus,
                              };

                              if (
                                newStatus === "In Progress" &&
                                !prev.started_date
                              ) {
                                updated.started_date = getNowLocal();
                              }
                              if (
                                (newStatus === "Completed" ||
                                  newStatus === "Failed") &&
                                !prev.completed_date
                              ) {
                                updated.completed_date = getNowLocal();
                                if (!updated.started_date) {
                                  updated.started_date = subtractOneHour(
                                    updated.completed_date,
                                  );
                                }
                              }
                              return updated;
                            });
                          }}
                          className="border border-gray-300 p-2 text-sm bg-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>

                      {/* File Upload */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">
                          {t("rh.UAI")}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setFile(e.target.files ? e.target.files[0] : null)
                          }
                          className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>

                      {/* Start Date */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">
                          {t("rh.DS")}
                        </label>
                        <input
                          type="datetime-local"
                          value={formatForInput(editData?.started_date || "")}
                          onChange={(e) =>
                            setEditData((prev) =>
                              prev
                                ? { ...prev, started_date: e.target.value }
                                : prev,
                            )
                          }
                          className="border border-gray-300 p-1.5 text-sm rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Completion Date */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">
                          {t("rh.DC")}
                        </label>
                        <input
                          type="datetime-local"
                          value={formatForInput(editData?.completed_date || "")}
                          onChange={(e) =>
                            setEditData((prev) =>
                              prev
                                ? { ...prev, completed_date: e.target.value }
                                : prev,
                            )
                          }
                          className="border border-gray-300 p-1.5 text-sm rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Edit Actions */}
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded-md text-sm font-medium transition"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition shadow-sm"
                        onClick={handleUpdate}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
            alt="Zoomed preview"
          />
        </div>
      )}
    </div>
  );
};

export default RepairHistory;
