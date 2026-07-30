import { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import api from "../api/axios";

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

  safety_stock: number;
  securement_rate: number;
  excess_shortage: number;
  regular_order_qty: number;
  avg_monthly_usage: number;
};
type Category = {
  id: number;
  name: string;
};
type Column = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

export default function InventoryDashboard() {
  const { t } = useTranslation();
  const [inventoryData, setInventoryData] = useState<SpareData[]>([]);
  const [category, setCategory] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(1);
  const [openAddModal, setOpenAddModal] = useState(false);
  const filteredInventory = useMemo(() => {
    return selectedCategory === null
      ? inventoryData
      : inventoryData.filter((item) => item.category_id === selectedCategory);
  }, [inventoryData, selectedCategory]);
  const [formData, setFormData] = useState({
    category_id: "",
    part_number: "",
    product_name: "",
    specification: "",
    maker: "",
    num: "",
    unit_price: "",
    remarks: "",
    app_holder: "",
    category: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const searchedInventory = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return filteredInventory.filter((item) => {
      return (
        item.part_number?.toLowerCase().includes(search) ||
        item.product_name?.toLowerCase().includes(search) ||
        item.specification?.toLowerCase().includes(search) ||
        item.maker?.toLowerCase().includes(search) ||
        item.app_holder?.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search)
      );
    });
  }, [filteredInventory, searchTerm]);

  const isProductCategory = selectedCategory === 1 || selectedCategory === 2;
  const columns: Column[] = isProductCategory
    ? [
        { key: "no", label: "No." },
        { key: "part_number", label: t("pininv.prodnum") },
        { key: "product_name", label: t("pininv.prodname") },
        { key: "specification", label: t("pininv.specs") },
        { key: "maker", label: t("pininv.maker") },
        { key: "stock", label: t("pininv.stock"), align: "right" },
        { key: "safety_stock", label: t("pininv.safesto"), align: "right" },
        { key: "securement_rate", label: t("pininv.sr"), align: "right" },
        { key: "excess_shortage", label: t("pininv.esq"), align: "right" },
        { key: "regular_order_qty", label: t("pininv.roq"), align: "right" },
      ]
    : [
        { key: "no", label: "No." },
        { key: "part_number", label: t("pininv.prodnum") },
        { key: "app_holder", label: t("pininv.appHol") },
        { key: "specification", label: t("pininv.specs") },
        { key: "category", label: t("pininv.category") },
        { key: "stock", label: t("pininv.stock"), align: "right" },
      ];
  const renderCell = (item: SpareData, column: Column, index: number) => {
    if (column.key === "no") {
      return index + 1;
    }

    if (column.key === "stock") {
      return Number(item.stock || 0).toLocaleString();
    }

    // This shi is for the percentage eg. 0.6 -> 60%; 1.25 -> 125%;
    if (column.key === "securement_rate") {
      return `${(Number(item.securement_rate) * 100).toFixed(0)}%`;
    }

    if (column.key === "excess_shortage") {
      const value = Number(item.excess_shortage || 0);

      return (
        <span
          className={
            value < 0
              ? "font-semibold text-red-600"
              : value > 0
                ? "font-semibold text-green-600"
                : "text-slate-600"
          }
        >
          {value.toLocaleString()}
        </span>
      );
    }

    const fieldKey = column.key as keyof SpareData;
    return item[fieldKey];
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post(`/spare/create`, formData);

      setOpenAddModal(false);

      fetchMovements();

      setFormData({
        category_id: "",
        part_number: "",
        product_name: "",
        specification: "",
        maker: "",
        num: "",
        unit_price: "",
        remarks: "",
        app_holder: "",
        category: "",
      });
      enqueueSnackbar(`Saved!`, {
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      enqueueSnackbar(`Error saving!`, {
        variant: "error",
      });
    }
  };

  const fetchMovements = useCallback(async () => {
    try {
      const res = await api.get(`/spare/view`);
      const ress = await api.get(`/spare/category`);
      setInventoryData(res.data);
      setCategory(ress.data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, []);
  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="h-full bg-slate-50 p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-400 mx-auto space-y-6">
        {/* Page Header Banner */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("pininv.spi", "Master Spare Parts Inventory")}
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {t("pininv.manage")}
            </p>
          </div>

          <div className="flex shrink-0">
            <button
              onClick={() => setOpenAddModal(true)}
              className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              + {t("pininv.addPart")}
            </button>
          </div>
        </div>

        {/* Analytical Tab Navigation & Search Filters Bar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {category.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const itemCount = inventoryData.filter(
                (item) => item.category_id === cat.id,
              ).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat.name}
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {itemCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search part number or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Main Catalog Inventory Management Grid */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-170 overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-20 bg-slate-800 text-white">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`whitespace-nowrap px-4 py-3 font-semibold text-xs uppercase tracking-wider border-b border-slate-700 ${
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                            ? "text-center"
                            : "text-left"
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {searchedInventory?.length > 0 ? (
                  searchedInventory.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/30"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 text-slate-600 font-medium ${
                            column.align === "right" ? "text-right" : ""
                          }`}
                        >
                          {renderCell(item, column, index)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-12 text-center text-sm font-medium text-slate-400 bg-slate-50/50"
                    >
                      No inventory data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Creation/Modification Modal Dialog Backdrop */}
      {openAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-h-[90vh] w-full max-w-2xl flex flex-col rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden transform transition-all">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">
                {t("pininv.asp")}
              </h2>
              <button
                onClick={() => setOpenAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Dialog Form Container */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col overflow-hidden"
            >
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      No.
                    </label>
                    <input
                      type="text"
                      name="num"
                      value={formData.num}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("pininv.prodnum")}
                    </label>
                    <input
                      type="text"
                      name="part_number"
                      value={formData.part_number}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("pininv.prodname")}
                    </label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("pininv.maker")}
                    </label>
                    <input
                      type="text"
                      name="maker"
                      value={formData.maker}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("pininv.appHol")}
                    </label>
                    <input
                      type="text"
                      name="app_holder"
                      value={formData.app_holder}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("pininv.category")}
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("pininv.unitprice")}
                    </label>
                    <input
                      type="number"
                      name="unit_price"
                      value={formData.unit_price}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("pininv.tab")}
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                    >
                      <option value="">{t("pininv.select")}</option>
                      {category.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t("pininv.specs")}
                  </label>
                  <input
                    type="text"
                    name="specification"
                    value={formData.specification}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Dialog Action Elements */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenAddModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {t("pininv.cancel")}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  {t("pininv.savepart")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
