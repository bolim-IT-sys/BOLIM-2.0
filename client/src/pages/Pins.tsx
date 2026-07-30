import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import { Modal } from "../modals/Modal";
import { Plus, FileDown, Search } from "lucide-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

type PinsStock = {
  id: number;
  image?: string;
  pin_name: string;
  specification: string;
  category: string;
  unit_price: number;
  company: string;
  stock: number;
  avg_monthly_usage: number;
  safety_stock: number;
  securement_rate: number;
  excess_shortage: number;
  regular_order_qty: number;
};

type Column = {
  key: string;
  label: string;
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const BASE_URL = "http://172.17.49.40:3000";

const INITIAL_FORM_STATE = {
  itemName: "",
  specification: "",
  category: "",
  unitPrice: "",
  company: "",
};

export default function Pins() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [stocksData, setStocksData] = useState<PinsStock[]>([]);
  const [editingItem, setEditingItem] = useState<PinsStock | null>(null);
  const [deleteItem, setDeleteItem] = useState<PinsStock | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Grouped form states
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { itemName, specification, category, unitPrice, company } = formState;

  // Export to excel states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  // Memoized columns array
  const columns: Column[] = useMemo(
    () => [
      { key: "image", label: "Image" },
      { key: "pin_name", label: "Pin Name" },
      { key: "specification", label: "Specifications" },
      { key: "category", label: "Category" },
      { key: "unit_price", label: "Unit Price (₩)" },
      { key: "company", label: "Company" },
      { key: "stock", label: "Current Stocks" },
      { key: "action", label: "Action" },
      { key: "securement_rate", label: "Securement Rate" },
      { key: "excess_shortage", label: "Excess/Shortage Qty" },
      { key: "regular_order_qty", label: "Regular Order Qty" },
    ],
    [],
  );

  const filteredStocks = stocksData.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.pin_name?.toLowerCase().includes(keyword) ||
      item.specification?.toLowerCase().includes(keyword) ||
      item.category?.toLowerCase().includes(keyword) ||
      item.company?.toLowerCase().includes(keyword)
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const loadStocks = async () => {
    try {
      const response = await api.get("/pins-inventory/view");
      setStocksData(response.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to load inventory", { variant: "error" });
    }
  };

  useEffect(() => {
    loadStocks();
  }, []);

  // Cleanup object URL preview safely
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const resetForm = () => {
    setEditingItem(null);
    setFormState(INITIAL_FORM_STATE);
    setImage(null);
    setImagePreview("");
    setIsModalOpen(false);
  };

  // Reusable frontend validation pipeline
  const validateForm = (parsedPrice: number, isEditMode: boolean): boolean => {
    if (!itemName.trim()) {
      enqueueSnackbar("Pin name is required", { variant: "warning" });
      return false;
    }
    if (!specification.trim()) {
      enqueueSnackbar("Specification is required", { variant: "warning" });
      return false;
    }
    if (!category.trim()) {
      enqueueSnackbar("Category is required", { variant: "warning" });
      return false;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      enqueueSnackbar("Please enter a valid unit price", {
        variant: "warning",
      });
      return false;
    }
    if (!company.trim()) {
      enqueueSnackbar("Company is required", { variant: "warning" });
      return false;
    }
    // Image is only required for new items
    if (!isEditMode && !image) {
      enqueueSnackbar("Please upload an Pin image", { variant: "error" });
      return false;
    }
    if (image && !ALLOWED_IMAGE_TYPES.includes(image.type)) {
      enqueueSnackbar(
        "Invalid file type. Please upload a JPEG, PNG, WEBP, or GIF.",
        { variant: "error" },
      );
      return false;
    }
    return true;
  };

  const createFormData = (parsedPrice: number) => {
    const formData = new FormData();
    formData.append("pin_name", itemName.trim());
    formData.append("specification", specification.trim());
    formData.append("category", category.trim());
    formData.append("unit_price", parsedPrice.toString());
    formData.append("company", company.trim());
    if (image) formData.append("image", image);
    return formData;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const price = parseFloat(unitPrice.replace(/,/g, ""));

    if (!validateForm(price, false)) return;

    try {
      setLoading(true);
      const formData = createFormData(price);
      await api.post("/pins-inventory/create", formData);

      enqueueSnackbar("Pin added successfully", { variant: "success" });
      resetForm();
      await loadStocks();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to add Pin", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const price = parseFloat(unitPrice.replace(/,/g, ""));
    if (!validateForm(price, true)) return;

    try {
      setLoading(true);
      const formData = createFormData(price);
      await api.put(`/pins-inventory/update/${editingItem.id}`, formData);

      enqueueSnackbar("Pin updated successfully", { variant: "success" });
      resetForm();
      await loadStocks();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to update pin", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderCell = (item: PinsStock, column: Column) => {
    switch (column.key) {
      case "image":
        return (
          <img
            src={item.image ? `${BASE_URL}${item.image}` : "/no-image.png"}
            alt={item.pin_name}
            className="w-20 h-20 object-contain mx-auto"
          />
        );

      case "unit_price":
        return `₩${Number(item.unit_price || 0).toLocaleString()}`;

      case "stock":
        return (
          <span
            className={
              Number(item.stock || 0) <= Number(item.safety_stock || 0)
                ? "text-red-600 font-bold"
                : "text-green-600 font-semibold"
            }
          >
            {item.stock}
          </span>
        );

      case "securement_rate": {
        const rate = Number(item.securement_rate);
        if (item.securement_rate == null || isNaN(rate)) return "-";

        // Converts decimal ratio (0.50) into percentage string (50%)
        return `${Math.round(rate * 100)}%`;
      }

      case "excess_shortage": {
        const val = Number(item.excess_shortage || 0);
        return (
          <span
            className={
              val < 0
                ? "text-red-600 font-bold"
                : val > 0
                  ? "text-green-600 font-bold"
                  : "text-slate-500 font-medium"
            }
          >
            {val > 0 ? `+${val}` : val}
          </span>
        );
      }

      case "regular_order_qty":
        return (
          <span
            className={
              Number(item.regular_order_qty || 0) > 0
                ? "text-amber-600 font-bold"
                : "text-slate-600"
            }
          >
            {item.regular_order_qty}
          </span>
        );

      case "action":
        return (
          <div className="flex justify-center gap-1">
            <button
              onClick={() => navigate(`/pins-stock/${item.id}`)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
            >
              {t("buttons.view", "View")}
            </button>
            <button
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
              onClick={() => {
                setEditingItem(item);
                setFormState({
                  itemName: item.pin_name,
                  specification: item.specification || "",
                  category: item.category || "",
                  unitPrice: Number(item.unit_price).toLocaleString(),
                  company: item.company || "",
                });
                setIsModalOpen(true);
              }}
            >
              {t("buttons.edit", "Edit")}
            </button>
            <button
              onClick={() => setDeleteItem(item)}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
            >
              {t("buttons.delete", "Delete")}
            </button>
          </div>
        );

      default:
        return String(item[column.key as keyof PinsStock] ?? "");
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/pins-inventory/export/`, {
        params: {
          from: exportFrom,
          to: exportTo,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(response.data);

      const link = document.createElement("a");
      link.href = url;

      const fileName = `Pins_Stock_Report from ${exportFrom} to ${exportTo}.xlsx`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      setIsExportModalOpen(false);
      enqueueSnackbar("Excel exported successfully", { variant: "success" });
    } catch (error) {
      console.error("Export error:", error);
      enqueueSnackbar("Failed to export Excel", { variant: "error" });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Search and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder={t(
              "table.search",
              "Search item name, specification, category...",
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setFormState(INITIAL_FORM_STATE);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{t("buttons.addItem", "Add Pin")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <FileDown size={16} strokeWidth={2.5} />
            <span>{t("buttons.exportExcel", "Export Excel")}</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-auto max-h-205 bg-white rounded-xl shadow border border-slate-100">
        <table className="min-w-full text-sm border-collapse text-center">
          <thead className="sticky top-0 z-20 bg-blue-600 text-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 font-semibold whitespace-nowrap border-b border-blue-700"
                >
                  {t(`table.headers.${column.key}`, column.label)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredStocks.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-slate-700 align-middle"
                  >
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))}
            {filteredStocks.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-slate-400 italic"
                >
                  {t("table.noData", "No stock records found")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={
          editingItem
            ? t("forms.editPin", "Edit Pin")
            : t("forms.addNewPin", "Add New Pin")
        }
        size="md"
      >
        <form
          onSubmit={editingItem ? handleUpdate : handleSubmit}
          className="space-y-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t("forms.pinName", "Pin Name")}
            </label>
            <input
              type="text"
              name="itemName"
              value={itemName}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t("forms.specs", "Specification")}
            </label>
            <input
              type="text"
              name="specification"
              value={specification}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t("forms.category", "Category")}
            </label>
            <input
              type="text"
              name="category"
              value={category}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t("forms.unitPrice", "Unit Price")}
            </label>
            <input
              type="text"
              name="unitPrice"
              value={unitPrice}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t("forms.company", "Company")}
            </label>
            <input
              type="text"
              name="company"
              value={company}
              onChange={handleInputChange}
              //placeholder="e.g. F1/F2"
              required
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t("forms.upload", "Upload Image")}
            </label>
            <input
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImage(file);
                setImagePreview(URL.createObjectURL(file));
              }}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
            {editingItem?.image && !imagePreview && (
              <img
                src={`${BASE_URL}${editingItem.image}`}
                alt=""
                className="w-full max-h-28 object-contain rounded-lg bg-white mt-2"
              />
            )}

            {imagePreview && (
              <div className="mt-4 border rounded-xl p-3 bg-slate-50">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  {t("forms.image", "Image Preview")}
                </p>
                <img
                  src={imagePreview}
                  alt="Pin Preview"
                  className="w-full max-h-28 object-contain rounded-lg bg-white"
                />
              </div>
            )}
          </div>

          {/* Form Action Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              {t("buttons.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading
                ? t("buttons.saving", "Saving...")
                : editingItem
                  ? t("buttons.update", "Update Pin")
                  : t("buttons.addPin", "Add Pin")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title={t("modal.deletePin", "Delete Pin")}
        size="sm"
      >
        <div className="space-y-4">
          <p>
            {t("modal.confirmDel", "Are you sure you want to delete")}
            <strong> {deleteItem?.pin_name}</strong>?
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteItem(null)}
              className="px-4 py-2 border rounded"
            >
              {t("buttons.cancel", "Cancel")}
            </button>

            <button
              onClick={async () => {
                if (!deleteItem) return;

                try {
                  await api.delete(`/pins-inventory/delete/${deleteItem.id}`);

                  enqueueSnackbar("Pin deleted successfully", {
                    variant: "success",
                  });

                  setDeleteItem(null);

                  await loadStocks();
                } catch (error) {
                  console.error(error);
                  enqueueSnackbar("Failed to delete pin", {
                    variant: "error",
                  });
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              {t("buttons.delete", "Delete")}
            </button>
          </div>
        </div>
      </Modal>

      {/*Export to excel modal*/}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={t("modal.exportHistory", "Export Inventory History")}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("modal.fromDate", "From Date")}
            </label>

            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("modal.toDate", "To Date")}
            </label>

            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 border rounded-lg"
            >
              {t("buttons.cancel", "Cancel")}
            </button>

            <button
              onClick={handleExport}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg"
            >
              {t("buttons.export", "Export")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
