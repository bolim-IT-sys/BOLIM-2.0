import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import api from "../api/axios";

export type Repair = {
  id: number;
  serial_number: string;
  reported_date: string;
  issue_description: string;
  status: string;
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
  const API_URL = "http://localhost:3000/api";
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
  }, [serialNumber, API_URL]); //  FIX 2: Properly added dependency array to prevent infinite re-fetches

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
  };

  const handleUpdate = async () => {
    try {
      if (!editData) return;

      if (editData.completed_date && !file) {
        enqueueSnackbar("After picture is required when repair is completed.", {
          variant: "warning",
        });
        return;
      }

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

      await api.put(`/repairs/${editingId}`, formData);

      if (editData.completed_date && file) {
        await api.post(`/it-inventory/repair/complete/${selectedId}`);
      }

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

  return (
    <div className="mb-2">
      <h4 className="font-bold text-center border-gray-200">{t("rh.RH")}</h4>
      <div className="overflow-y-auto">
        {repairs.length === 0 ? (
          <p className="text-gray-500 text-center">{t("rh.nrh")}</p>
        ) : (
          repairs.map((r) => {
            const isEditable =
              r.status === "pending" || r.status === "in_progress";
            return (
              <div
                key={r.id}
                className={`rounded gap-4 border-s-2 p-3 mt-1 ${
                  r.status === "pending"
                    ? "bg-red-100 text-red-800 border-red-500"
                    : r.status === "in_progress"
                      ? "bg-blue-100 text-blue-800 border-blue-500"
                      : "bg-green-100 text-green-800 border-green-500"
                }`}
              >
                <div className="text-start">
                  {editingId !== r.id ? (
                    <>
                      <table className="text-center w-full">
                        <thead>
                          <tr>
                            <th className="p-2 border">{t("rh.RD")}</th>
                            <th className="p-2 border">{t("rh.ID")}</th>
                            <th className="p-2 border">{t("rh.Pers")}</th>
                            <th className="p-2 border">{t("rh.SD")}</th>
                            <th className="p-2 border">{t("rh.CD")}</th>
                            <th className="p-2 border">{t("rh.RS")}</th>
                            <th className="p-2 border">{t("rh.Bef")}</th>
                            <th className="p-2 border">{t("rh.Aft")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 border">
                              {formatLongDate(String(r.reported_date))}
                            </td>
                            <td className="p-2 border">
                              {r.issue_description}
                            </td>
                            <td className="p-2 border">{r.personnel}</td>
                            <td className="p-2 border">
                              {formatLongDate(String(r.started_date))}
                            </td>
                            <td className="p-2 border">
                              {formatLongDate(String(r.completed_date))}
                            </td>
                            <td className="p-2 border">{r.status}</td>
                            <td className="p-2 border">
                              <img
                                src={
                                  r.before_picture
                                    ? `${API_BASE}/${r.before_picture.replace(/^\/+/, "")}`
                                    : "/placeholder.png"
                                }
                                alt="Before"
                                className="w-40 h-40 object-cover rounded border cursor-pointer"
                                onClick={() =>
                                  setSelectedImage(
                                    `${API_BASE}/${r.before_picture.replace(/^\/+/, "")}`,
                                  )
                                }
                              />
                            </td>
                            <td className="p-2 border">
                              <img
                                src={
                                  r.after_picture
                                    ? `${API_BASE}/${r.after_picture.replace(/^\/+/, "")}`
                                    : "/placeholder.png"
                                }
                                alt="After"
                                className="w-40 h-40 object-cover rounded border cursor-pointer"
                                onClick={() =>
                                  setSelectedImage(
                                    `${API_BASE}/${r.after_picture.replace(/^\/+/, "")}`,
                                  )
                                }
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      {isEditable && (
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
                          onClick={() => handleEdit(r)}
                        >
                          {t("rh.Upt")}
                        </button>
                      )}
                    </>
                  ) : (
                    <div>
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th>{t("rh.Sta")}</th>
                            <th>{t("rh.UAI")}</th>
                            <th>{t("rh.DS")}</th>
                            <th>{t("rh.DC")}</th>
                          </tr>
                        </thead>
                        <tbody className="text-center">
                          <tr>
                            <td>
                              <select
                                value={editData?.status || ""}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  setEditData((prev) => {
                                    if (!prev) return prev;
                                    const updated: Repair = {
                                      ...prev,
                                      status: newStatus,
                                    };
                                    if (
                                      newStatus === "in_progress" &&
                                      !prev.started_date
                                    ) {
                                      updated.started_date = getNowLocal();
                                    }
                                    if (
                                      newStatus === "completed" &&
                                      !prev.completed_date
                                    ) {
                                      updated.completed_date = getNowLocal();
                                      if (!updated.started_date) {
                                        updated.started_date = subtractOneHour(
                                          updated.completed_date!,
                                        );
                                      }
                                    }
                                    return updated;
                                  });
                                }}
                                className="border p-2 mb-2 w-fit"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="file"
                                onChange={(e) =>
                                  setFile(
                                    e.target.files ? e.target.files[0] : null,
                                  )
                                }
                                className="mb-2"
                              />
                            </td>
                            <td>
                              <input
                                type="datetime-local"
                                value={formatForInput(
                                  editData?.started_date || "",
                                )}
                                disabled
                              />
                            </td>
                            <td>
                              <input
                                type="datetime-local"
                                value={formatForInput(
                                  editData?.completed_date || "",
                                )}
                                disabled
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="flex gap-2">
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded"
                          onClick={handleUpdate}
                        >
                          Save
                        </button>
                        <button
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            className="max-w-[90%] max-h-[90%] rounded shadow-lg"
            alt="Zoomed"
          />
        </div>
      )}
    </div>
  );
};

export default RepairHistory;
