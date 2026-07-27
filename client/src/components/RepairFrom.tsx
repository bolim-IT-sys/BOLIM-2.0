import { useState, useEffect } from "react";
import axios from "axios";
import { enqueueSnackbar } from "notistack";

type RepairFormProps = {
  serialNumber: string;
  onClose: () => void;
  onCancel: () => void;
};

type RepairFormData = {
  serial_number: string;
  reported_date: string;
  issue_description: string;
  status: "Pending" | "In Progress" | "Completed" | "Failed";
  started_date: string;
  completed_date: string;
  personnel: string;
  before_picture: File | null;
  after_picture: File | null;
};

// Helper function to format current date to local YYYY-MM-DDTHH:mm
const getNowLocalISO = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

const RepairForm = ({ serialNumber, onClose, onCancel }: RepairFormProps) => {
  const API_URL = "http://localhost:3000/api";

  const [form, setForm] = useState<RepairFormData>({
    serial_number: serialNumber,
    reported_date: getNowLocalISO(), // ✅ Fixed: Uses local time instead of raw UTC ISO
    issue_description: "",
    status: "Pending",
    started_date: "",
    completed_date: "",
    personnel: "",
    before_picture: null,
    after_picture: null,
  });

  const [preview, setPreview] = useState({
    before_picture: null as string | null,
    after_picture: null as string | null,
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      serial_number: serialNumber,
    }));
  }, [serialNumber]);

  useEffect(() => {
    return () => {
      if (preview.before_picture) URL.revokeObjectURL(preview.before_picture);
      if (preview.after_picture) URL.revokeObjectURL(preview.after_picture);
    };
  }, [preview]);

  // Helper to auto-determine default status unless explicitly set to Failed
  const getAutoStatus = (
    startedDate: string,
    completedDate: string,
    currentStatus: string,
  ): "Pending" | "In Progress" | "Completed" | "Failed" => {
    if (currentStatus === "Failed") return "Failed";
    if (completedDate) return "Completed";
    if (startedDate) return "In Progress";
    return "Pending";
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.files) {
      const file = e.target.files[0];
      if (!file) return;

      setForm((prev) => ({
        ...prev,
        [name]: file,
      }));

      const imageUrl = URL.createObjectURL(file);
      setPreview((prev) => ({
        ...prev,
        [name]: imageUrl,
      }));
    } else {
      setForm((prev) => {
        const updated = {
          ...prev,
          [name]: value,
        };

        const newStatus = getAutoStatus(
          updated.started_date,
          updated.completed_date,
          name === "status" ? value : prev.status,
        );

        return {
          ...updated,
          status: newStatus,
        };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Require after_picture ONLY when status is "Completed"
    if (form.status === "Completed" && !form.after_picture) {
      enqueueSnackbar("After picture is required when repair is completed.", {
        variant: "error",
      });
      return;
    }

    const formData = new FormData();

    for (const key in form) {
      const typedKey = key as keyof RepairFormData;
      const value = form[typedKey];

      if (value !== null && value !== "") {
        formData.append(typedKey, value as string | Blob);
      }
    }

    try {
      await axios.post(`${API_URL}/repairs`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      enqueueSnackbar("Repair recorded successfully!", { variant: "success" });
      onClose();
    } catch (error: unknown) {
      console.error(error);
      let errorMsg = "Error saving repair record!";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.error || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      enqueueSnackbar(errorMsg, { variant: "error" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="flex flex-col items-center p-4 gap-2"
    >
      <h4 className="text-red-500 font-medium">Required fields *</h4>

      <div className="w-full flex gap-4 justify-between">
        {/* LEFT COLUMN */}
        <div className="relative flex-1 flex flex-col gap-2">
          <label className="text-red-500">*Reported Date</label>
          <input
            type="datetime-local"
            name="reported_date"
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
            value={form.reported_date}
            required
          />

          <label>Serial Number</label>
          <input
            name="serial_number"
            placeholder="Serial Number"
            value={form.serial_number}
            readOnly
            className="p-2 w-full border border-gray-200 bg-gray-50 rounded-xl outline-none text-gray-600"
          />

          <label className="text-red-500">*Issue Description</label>
          <textarea
            name="issue_description"
            placeholder="Describe the defect or issue..."
            onChange={handleChange}
            value={form.issue_description}
            required
            rows={3}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />

          <label className="text-red-500">*Personnel</label>
          <input
            name="personnel"
            placeholder="I.T. Personnel"
            value={form.personnel}
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
            required
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="relative flex-1 flex flex-col gap-2">
          <label>Repair Status</label>
          <input
            value={form.status}
            readOnly
            className="p-2 w-full border border-gray-200 bg-gray-50 rounded-xl outline-none text-gray-600"
          />

          <label>Date Started</label>
          <input
            type="datetime-local"
            name="started_date"
            value={form.started_date}
            required
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />

          <label>Date Completed / Failed</label>
          <input
            type="datetime-local"
            name="completed_date"
            value={form.completed_date}
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />

          <label className="text-red-500">*Before Picture</label>
          <input
            type="file"
            accept="image/*"
            name="before_picture"
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
            required
          />
          {preview.before_picture && (
            <img
              src={preview.before_picture}
              alt="Before Repair Preview"
              className="w-32 h-32 object-cover rounded border"
            />
          )}

          <label>
            After Picture{" "}
            {form.status === "Completed" && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="file"
            accept="image/*"
            name="after_picture"
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />
          {preview.after_picture && (
            <img
              src={preview.after_picture}
              alt="After Repair Preview"
              className="w-32 h-32 object-cover rounded border"
            />
          )}
        </div>
      </div>

      <div className="flex gap-4 w-1/2 justify-center mt-4">
        <button
          type="submit"
          className="border border-orange-400 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-xl flex-1 transition font-medium"
        >
          Save Repair
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-400 hover:bg-gray-100 text-gray-700 p-2 rounded-xl flex-1 transition font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RepairForm;
