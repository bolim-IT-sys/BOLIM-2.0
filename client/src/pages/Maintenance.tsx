import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  type CellValueChangedEvent,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
import debounce from "lodash.debounce";
import TimeCellEditor from "../components/TimePicker";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import { Download, Plus } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function MaterialControl() {
  const [rowData, setRowData] = useState<Row[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>();
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<"month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const columnDefs: (ColDef<Row> | ColGroupDef<Row>)[] = [
    {
      headerName: t("mainRec.date"),
      field: "date",
      headerClass: "bg-[#FCE4D6]",
    },
    {
      headerName: t("mainRec.formNumber"),
      field: "formNumber",
      headerClass: "bg-[#FCE4D6]",
    },
    {
      headerName: t("mainRec.line"),
      field: "line",
      headerClass: "bg-[#FCE4D6]",
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: [
          "L1",
          "L2",
          "L3",
          "L4",
          "L5",
          "L6",
          "L7",
          "L8",
          "L9",
          "L10",
          "L11",
          "L12",
          "L13",
          "L14",
          "L15",
          "L16",
          "L17",
          "L18",
          "L19",
          "ABAG",
        ],
      },
    },
    {
      headerName: t("mainRec.process"),
      field: "process",
      headerClass: "bg-[#FCE4D6]",
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: [
          "CIRCUIT",
          "DIMENSION",
          "PRODUCT INPECTION",
          "GROMMET",
          "VISION",
          "TORQUE",
          "ASSEMBLY BOARD",
          "PCB BLOCK",
          "FUSE AND RELAY",
          "WRAP UP",
          "PACKING",
          "SUB",
          "DIM/CIR/WRAP/PROD",
        ],
      },
    },
    {
      headerName: t("mainRec.code"),
      field: "code",
      headerClass: "bg-[#FCE4D6]",
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["A", "B", "C", "D", "E", "F"],
      },
    },
    {
      headerName: t("mainRec.phenomenon"),
      field: "phenomenon",
      headerClass: "bg-[#D9E1F2]",
      width: 250,
    },
    {
      headerName: t("mainRec.detail"),
      field: "detail",
      headerClass: "bg-[#D9E1F2]",
      width: 300,
    },
    {
      headerName: t("mainRec.material"),
      field: "material",
      headerClass: "bg-[#D9E1F2]",
    },
    {
      headerName: t("mainRec.qty"),
      field: "qty",
      headerClass: "bg-[#D9E1F2]",
      cellEditor: "agNumberCellEditor",
      cellEditorParams: { min: 0 },
      valueParser: (params) => {
        const val = Number(params.newValue);
        return isNaN(val) ? null : val;
      },
    },
    {
      headerName: t("mainRec.occurTime"),
      field: "occurTime",
      cellEditor: TimeCellEditor,
      valueFormatter: (params) => formatTo12Hour(params.value),
      headerClass: "bg-[#E2EFDA]",
    },
    {
      headerName: t("mainRec.finishTime"),
      field: "finishTime",
      cellEditor: TimeCellEditor,
      valueFormatter: (params) => formatTo12Hour(params.value),
      headerClass: "bg-[#E2EFDA]",
    },
    {
      headerName: t("mainRec.downTime"),
      field: "downTime",
      headerClass: "bg-[#E2EFDA]",
    },
    {
      headerName: t("mainRec.incharge"),
      field: "incharge",
      headerClass: "bg-[#E2EFDA]",
    },
    {
      headerName: t("mainRec.shift"),
      field: "shift",
      headerClass: "bg-[#E2EFDA]",
    },

    {
      headerName: t("mainRec.repairComp"),
      headerClass: "bg-[#FFF2CC]",
      children: [
        {
          headerName: t("mainRec.type"),
          field: "type",
          headerClass: "bg-[#FFF2CC]",
          cellEditor: "agSelectCellEditor",
          cellEditorParams: {
            values: ["CHANGE PIN", "CHANGE HOLDER", "CHECK"],
          },
        },
        {
          headerName: t("mainRec.labelSN"),
          field: "labelSN",
          headerClass: "bg-[#FFF2CC]",
        },
        {
          headerName: t("mainRec.holderNumber"),
          field: "holderNumber",
          headerClass: "bg-[#FFF2CC]",
        },
        {
          headerName: t("mainRec.pin"),
          field: "pin",
          headerClass: "bg-[#FFF2CC]",
        },
      ],
    },

    {
      headerName: t("mainRec.pinCheck"),
      headerClass: "bg-[#D9D9D9]",
      children: [
        {
          headerName: t("mainRec.pinSpec"),
          field: "pinSpec",
          headerClass: "bg-[#D9D9D9]",
        },
        {
          headerName: t("mainRec.pinHeight"),
          field: "pinHeight",
          headerClass: "bg-[#D9D9D9]",
        },
        {
          headerName: t("mainRec.pinDeformation"),
          field: "pinDeformation",
          headerClass: "bg-[#D9D9D9]",
        },
        {
          headerName: t("mainRec.pinSpring"),
          field: "pinSpring",
          headerClass: "bg-[#D9D9D9]",
        },
      ],
    },

    {
      headerName: t("mainRec.kyungshinLabel"),
      field: "kyungshinLabel",
      headerClass: "bg-[#D9D9D9]",
    },
    {
      headerName: t("mainRec.remarks"),
      field: "remarks",
      headerClass: "bg-[#F8CBAD]",
    },
  ];

  type Row = {
    id?: number;
    date: string;
    formNumber: string;
    line: string;
    process: string;
    code: string;
    phenomenon: string;
    detail: string;
    material: string;
    qty: number | null;
    occurTime: string;
    finishTime: string;
    downTime: number | null;
    incharge: string;
    shift: string;
    type: string;
    labelSN: string;
    holderNumber: string;
    pin: string;
    pinSpec: string;
    pinHeight: string;
    pinDeformation: string;
    pinSpring: string;
    kyungshinLabel: string;
    remarks: string;
  };

  const defaultColDef = {
    editable: true,
    resizable: true,
    sortable: true,
    filter: true,

    singleClickEdit: true,

    wrapText: true,
    autoHeight: true,

    flex: 1,
    minWidth: 120,

    cellStyle: {
      textAlign: "center",
      border: "1px solid #d1d5db", // softer border
    },
  };

  const formatTo12Hour = (time?: string) => {
    if (!time) return "";

    const [hour, minute] = time.split(":").map(Number);

    const suffix = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;

    return `${h}:${minute.toString().padStart(2, "0")} ${suffix}`;
  };

  const saveToServer = async (row: Row) => {
    try {
      if (row.id) {
        await axios.put(`http://localhost:3000/api/maintenance/${row.id}`, row);
      } else {
        const res = await axios.post(
          "http://localhost:3000/api/maintenance",
          row,
        );

        row.id = res.data.id; // assign ID after insert
      }

      //console.log("Saved ✅");
    } catch (error) {
      console.error("Save failed ❌", error);
    }
  };

  const debouncedSave = debounce(saveToServer, 800);

  const createEmptyRow = useCallback(
    (): Row => ({
      date: "",
      formNumber: "",
      line: "",
      process: "",
      code: "",
      phenomenon: "",
      detail: "",
      material: "",
      qty: null,
      occurTime: "",
      finishTime: "",
      downTime: null,
      incharge: "",
      shift: "",
      type: "",
      labelSN: "",
      holderNumber: "",
      pin: "",
      pinSpec: "",
      pinHeight: "",
      pinDeformation: "",
      pinSpring: "",
      kyungshinLabel: "",
      remarks: "",
    }),
    [],
  );

  const calculateDownTime = (start?: string, end?: string) => {
    if (!start || !end) return "";

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    const diff = endMinutes - startMinutes;

    return diff >= 0 ? diff : null; // prevent negative
  };

  {
    /*useEffect(() => {
    setRowData([createEmptyRow()]);
  }, [createEmptyRow]);*/
  }

  const onCellValueChanged = (params: CellValueChangedEvent<Row>) => {
    //console.log("UPDATED:", params.data);
    const row = params.data;

    // auto compute downtime
    if (
      params.colDef.field === "occurTime" ||
      params.colDef.field === "finishTime"
    ) {
      const downTime = calculateDownTime(row.occurTime, row.finishTime);

      params.node.setDataValue("downTime", downTime);
    }

    // skip empty rows
    const isEmpty = Object.values(row).every((v) => !v);
    if (isEmpty) return;

    // auto-add new row
    if (params.node.rowIndex === 0) {
      // save row
      debouncedSave(row);

      // move row down and create new input row
      setRowData((prev) => [
        createEmptyRow(), // new input row
        row, // move edited row down
        ...prev.slice(1), // keep rest
      ]);
    } else {
      // normal update for existing rows
      debouncedSave(row);
    }

    // console.log("CHANGED:", params.data);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsFetching(true);

        const res = await axios.get(
          "http://localhost:3000/api/maintenance/view",
        );

        setRowData(res.data);
      } catch (error) {
        console.error("Fetch failed", error);
      } finally {
        setIsFetching(false);
      }
    };

    loadData();
  }, []);

  const handleExport = async () => {
    if (filterType === "month" && !selectedMonth) {
      enqueueSnackbar(`Please select a month`, {
        variant: "error",
      });
      return;
    }

    if (filterType === "year" && !selectedYear) {
      enqueueSnackbar(`Please enter a year`, {
        variant: "error",
      });
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/api/maintenance/export-items-to-excel",
        {
          month: filterType === "month" ? selectedMonth : null,
          year: filterType === "year" ? selectedYear : null,
        },
        {
          responseType: "blob",
        },
      );

      let filename = "Maintenance_Records.xlsx";

      if (filterType === "month") {
        filename = `Maintenance Records_${selectedMonth}.xlsx`;
      } else if (filterType === "year") {
        filename = `Maintenance Records_${selectedYear}.xlsx`;
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url); // cleanup
    } catch (error) {
      console.error("Export failed ❌", error);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full gap-4 p-4 bg-gray-50">
      {/* 🛠️ Top Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => {
              const value = e.target.value as "month" | "year";
              setFilterType(value);
              if (value === "month") setSelectedYear("");
              if (value === "year") setSelectedMonth("");
            }}
            className="border border-gray-300 bg-white px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">By Month</option>
            <option value="year">By Year</option>
          </select>

          {/* Conditional Date Pickers */}
          {filterType === "month" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {filterType === "year" && (
            <input
              type="number"
              placeholder="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {/* Real-time Status Text */}
          <span className="text-xs font-medium text-gray-400 ml-1 transition-all">
            {filterType === "month" &&
              selectedMonth &&
              `Exporting: ${selectedMonth}`}
            {filterType === "year" &&
              selectedYear &&
              `Exporting: ${selectedYear}`}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRowData((prev) => [createEmptyRow(), ...prev])}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* 📊 AG-Grid Container */}
      <div className="flex-1 w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-1">
        <div className="ag-theme-alpine w-full h-full">
          <AgGridReact
            theme="legacy"
            headerHeight={36} // Slightly larger for better modern proportions
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            enterNavigatesVertically={true}
            enterNavigatesVerticallyAfterEdit={true}
            suppressCellFocus={false}
            loading={isFetching}
            overlayLoadingTemplate={`<span class="text-sm text-gray-500 font-medium">Loading maintenance records...</span>`}
            overlayNoRowsTemplate={`<span class="text-sm text-gray-400">No data available</span>`}
            onCellValueChanged={onCellValueChanged}
          />
        </div>
      </div>
    </div>
  );
}
