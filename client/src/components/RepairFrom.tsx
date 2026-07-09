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
  status: string;
  started_date: string;
  completed_date: string;
  personnel: string;
  before_picture: File | null;
  after_picture: File | null;
};

const RepairForm = ({ serialNumber, onClose, onCancel }: RepairFormProps) => {
  const API_URL = "http://localhost:3000/api";
  const [form, setForm] = useState<RepairFormData>({
    serial_number: serialNumber,
    reported_date: "",
    issue_description: "",
    status: "pending",
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

  const getStatus = (data: RepairFormData) => {
    if (data.completed_date) return "completed";
    if (data.started_date) return "in_progress";
    return "pending";
  };

  const subtractOneHour = (dateStr: string) => {
    const date = new Date(dateStr);
    const newDate = new Date(date.getTime() - 60 * 60 * 1000);

    const offset = newDate.getTimezoneOffset();
    return new Date(newDate.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const name = e.target.name as keyof RepairFormData;

    if (e.target instanceof HTMLInputElement && e.target.files) {
      const file = e.target.files[0];

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
          [name]: e.target.value,
        };

        if (updated.completed_date) {
          if (!updated.started_date) {
            updated.started_date = subtractOneHour(updated.completed_date!);
          }
        }

        return {
          ...updated,
          status: getStatus(updated),
        };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    for (const key in form) {
      const typedKey = key as keyof RepairFormData;
      const value = form[typedKey];

      if (!value) continue;

      formData.append(typedKey, value as string | Blob);
    }
    if (form.completed_date && !form.after_picture) {
      enqueueSnackbar("After picture is required when repair is completed.", {
        variant: "error",
      });
      return;
    }
    try {
      await axios.post(`${API_URL}/repairs`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      enqueueSnackbar("Repair saved!", { variant: "success" });
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error saving repair!", { variant: "error" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="flex flex-col items-center p-4 gap-2"
    >
      <h4 className="text-red-500">Required fields *</h4>
      <div className="w-full flex gap-4 justify-between">
        <div className="relative flex-1 flex flex-col gap-2">
          <label htmlFor="Reported Date" className="text-red-500">
            *Reported Date
          </label>
          <input
            type="datetime-local"
            name="reported_date"
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
            value={form.reported_date}
            required
          />
          <label htmlFor="Reported Date">Serial Number</label>
          <input
            name="serial_number"
            placeholder="Serial Number"
            value={form.serial_number}
            readOnly
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />
          <label htmlFor="Issue" className="text-red-500">
            *Issue Description
          </label>
          <textarea
            name="issue_description"
            placeholder="Issue Description"
            onChange={handleChange}
            required
            className="p-2 w-full border border-gray-400 outline-none"
          />
          <label htmlFor="Personnel" className="text-red-500">
            *Personnel
          </label>
          <input
            name="personnel"
            placeholder="Personnel"
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
            required
          />
        </div>
        <div className="relative flex-1 flex flex-col gap-2">
          <label htmlFor="Repair Status">Repair Status</label>
          <input
            value={form.status}
            readOnly
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />
          <label htmlFor="Date Started">Date Started</label>
          <input
            type="datetime-local"
            name="started_date"
            value={form.started_date}
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />
          <label htmlFor="Date Completed">Date Completed</label>
          <input
            type="datetime-local"
            name="completed_date"
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />
          <label htmlFor="Before Picture" className="text-red-500">
            *Before Picture
          </label>
          <input
            type="file"
            name="before_picture"
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
            required
          />
          {preview.before_picture && (
            <img
              src={preview.before_picture}
              className="w-40 h-40 object-cover rounded border"
            />
          )}
          <label htmlFor="After Picture">After Picture</label>
          <input
            type="file"
            name="after_picture"
            onChange={handleChange}
            className="p-2 w-full border border-gray-400 rounded-xl outline-none"
          />
          {preview.after_picture && (
            <img
              src={preview.after_picture}
              className="w-40 h-40 object-cover rounded border"
            />
          )}
        </div>
      </div>
      <div className="flex gap-4 w-1/2 justify-center mt-2">
        <button
          type="submit"
          className="border border-orange-400 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded flex-1 transition"
        >
          Save Repair
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-400 hover:bg-gray-200 text-gray-700 p-2 rounded flex-1 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RepairForm;
