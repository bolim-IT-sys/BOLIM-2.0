import express, { Request, Response, Router } from "express";
import Maintenance from "../models/maintenance_records.model";
import ExcelJS from "exceljs";
import { Op, WhereOptions } from "sequelize";

const router: Router = express.Router();

// 1. Define an interface representing the attributes on your Maintenance model
interface MaintenanceAttributes {
  id?: number;
  date: string | Date;
  formNumber?: string;
  line?: string;
  process?: string;
  code?: string;
  phenomenon?: string;
  detail?: string;
  material?: string;
  qty?: number | null;
  occurTime?: string;
  finishTime?: string;
  downTime?: number | null;
  incharge?: string;
  shift?: string;
  type?: string;
  labelSN?: string;
  holderNumber?: string;
  pin?: string;
  pinSpec?: string;
  pinHeight?: string;
  pinDeformation?: string;
  pinSpring?: string;
  kyungshinLabel?: string;
  remarks?: string;
}

// Helper to sanitize input numbers safely
const toIntOrNull = (val: any): number | null =>
  val !== "" && val != null ? parseInt(val, 10) : null;

// 2. VIEW ALL RECORDS
router.get("/view", async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await Maintenance.findAll();
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// 3. CREATE RECORD
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const data: MaintenanceAttributes = { ...req.body };

    data.qty = toIntOrNull(data.qty);
    data.downTime = toIntOrNull(data.downTime);

    const row = await Maintenance.create(data as any);
    res.json(row);
  } catch (error: any) {
    console.error("❌ FULL ERROR:", error);
    console.error("❌ SQL MESSAGE:", error?.parent?.sqlMessage);
    console.error("❌ SQL:", error?.parent?.sql);

    res.status(500).json({
      error: error.message,
      sqlMessage: error?.parent?.sqlMessage,
    });
  }
});

// 4. UPDATE RECORD BY ID
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data: MaintenanceAttributes = { ...req.body };

    data.qty = toIntOrNull(data.qty);
    data.downTime = toIntOrNull(data.downTime);

    await Maintenance.update(data as any, {
      where: { id },
    });

    const updated = await Maintenance.findByPk(id);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
});

// 5. EXPORT MAINTENANCE RECORDS TO EXCEL
router.post(
  "/export-items-to-excel",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { month, year } = req.body;
      let where: WhereOptions = {};

      if (year && !month) {
        where.date = {
          [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
        };
      }

      if (month) {
        const [y, m] = month.split("-");
        const start = new Date(parseInt(y), parseInt(m) - 1, 1);
        const end = new Date(parseInt(y), parseInt(m), 0);

        where.date = {
          [Op.between]: [start, end],
        };
      }

      let filename = "Maintenance Records.xlsx";

      if (month) {
        filename = `Maintenance Records_${month}.xlsx`;
      } else if (year) {
        filename = `Maintenance Records_${year}.xlsx`;
      }

      // Cast the returned array to our defined model properties structure
      const data = (await Maintenance.findAll({
        where,
      })) as unknown as MaintenanceAttributes[];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Maintenance");

      // HEADER ROW 1 (GROUPS)
      worksheet.addRow([
        "DATE",
        "FORM SN",
        "LINE",
        "PROCESS",
        "CODE",
        "PHENOMENON",
        "DETAIL OF ACTION",
        "MATERIAL",
        "QTY",
        "OCCUR TIME",
        "FINISH TIME",
        "DOWN TIME (mins)",
        "INCHARGE",
        "SHIFT",
        "REPAIR COMPLETED STICKER SN",
        "",
        "",
        "",
        "PIN CHECK",
        "",
        "",
        "",
        "KYUNGSHIN LABEL",
        "REMARKS",
      ]);

      // HEADER ROW 2 (SUB HEADERS)
      worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "TYPE",
        "LABEL SN",
        "HOLDER NO.",
        "PIN NO",
        "PIN SPEC",
        "PIN HEIGHT",
        "PIN DEFORMATION",
        "PIN SPRING",
        "",
        "",
      ]);

      const merge = (range: string) => worksheet.mergeCells(range);

      // Vertical Merging
      [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "W",
        "X",
      ].forEach((col) => merge(`${col}1:${col}2`));

      // Horizontal Group Merging
      merge("O1:R1"); // repair
      merge("S1:V1"); // pin check

      const setHeaderStyle = (cell: ExcelJS.Cell, color: string) => {
        cell.font = { bold: true };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color },
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      };

      const row1 = worksheet.getRow(1);
      const row2 = worksheet.getRow(2);

      // ORANGE (A–E)
      ["A", "B", "C", "D", "E"].forEach((col) => {
        setHeaderStyle(row1.getCell(col), "FFFCE4D6");
        setHeaderStyle(row2.getCell(col), "FFFCE4D6");
      });

      // BLUE (F–I)
      ["F", "G", "H", "I"].forEach((col) => {
        setHeaderStyle(row1.getCell(col), "FFD9E1F2");
        setHeaderStyle(row2.getCell(col), "FFD9E1F2");
      });

      // GREEN (J–N)
      ["J", "K", "L", "M", "N"].forEach((col) => {
        setHeaderStyle(row1.getCell(col), "FFE2EFDA");
        setHeaderStyle(row2.getCell(col), "FFE2EFDA");
      });

      // YELLOW (O–R)
      ["O", "P", "Q", "R"].forEach((col) => {
        setHeaderStyle(row1.getCell(col), "FFF2CC");
        setHeaderStyle(row2.getCell(col), "FFF2CC");
      });

      // GRAY (S–W)
      ["S", "T", "U", "V", "W"].forEach((col) => {
        setHeaderStyle(row1.getCell(col), "FFD9D9D9");
        setHeaderStyle(row2.getCell(col), "FFD9D9D9");
      });

      // REMARKS (X)
      setHeaderStyle(row1.getCell("X"), "FFF8CBAD");
      setHeaderStyle(row2.getCell("X"), "FFF8CBAD");

      // Loop data using typed rows safely
      data.forEach((row) => {
        worksheet.addRow([
          row.date,
          row.formNumber,
          row.line,
          row.process,
          row.code,
          row.phenomenon,
          row.detail,
          row.material,
          row.qty,
          row.occurTime,
          row.finishTime,
          row.downTime,
          row.incharge,
          row.shift,
          row.type,
          row.labelSN,
          row.holderNumber,
          row.pin,
          row.pinSpec,
          row.pinHeight,
          row.pinDeformation,
          row.pinSpring,
          row.kyungshinLabel,
          row.remarks,
        ]);
      });

      // Auto-adjust column widths dynamically
      worksheet.columns.forEach((col) => {
        let max = 10;
        col.eachCell?.({ includeEmpty: true }, (cell) => {
          const val = cell.value ? cell.value.toString() : "";
          max = Math.max(max, val.length);
        });
        col.width = max + 2;
      });

      worksheet.views = [{ state: "frozen", ySplit: 2 }];

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("❌ EXPORT ERROR:", error);
      res.status(500).json({ error: "Export failed" });
    }
  },
);

export default router;
