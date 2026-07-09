import express, { Request, Response, Router } from "express";
import Movement from "../models/movement.model";
import ExcelJS from "exceljs";
import { Op } from "sequelize";

const router: Router = express.Router();

// Define a type interface matching your Movement model attributes for raw queries
interface MovementAttributes {
  personnel?: string;
  date: string | Date;
  description?: string;
  serial?: string;
  quantity?: number;
  from?: string;
  to?: string;
  condition?: string;
  remarks?: string;
}

// GET View
router.get("/view", async (req: Request, res: Response): Promise<void> => {
  try {
    const movement = await Movement.findAll({
      order: [["date", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: movement,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch",
    });
  }
});

// POST Create
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const row = await Movement.create(req.body);
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

// POST Excel export
router.post(
  "/export-items-to-excel",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromDate, toDate } = req.body;

      // Type the return records array as an array of our Movement attributes
      const records = (await Movement.findAll({
        where: {
          date: {
            [Op.gte]: new Date(`${fromDate} 00:00:00`),
            [Op.lte]: new Date(`${toDate} 23:59:59`),
          },
        },
        order: [["date", "ASC"]],
        raw: true,
      })) as unknown as MovementAttributes[];

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Equipment Movement");

      // Title
      sheet.mergeCells("A1:I1");
      const cellA1 = sheet.getCell("A1");
      cellA1.value = "EQUIPMENT MOVEMENT REPORT";
      cellA1.font = { bold: true, size: 16 };
      cellA1.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Date Range
      sheet.mergeCells("A2:I2");
      const cellA2 = sheet.getCell("A2");
      cellA2.value = `FROM ${fromDate} TO ${toDate}`;
      cellA2.alignment = { horizontal: "center" };

      // Headers
      sheet.getRow(4).values = [
        "Personnel",
        "Date",
        "Item Description",
        "Asset Tag / Serial No.",
        "Quantity",
        "From Location / Line",
        "To Location / Line",
        "Reason",
        "Remarks",
      ];

      sheet.columns = [
        { key: "personnel", width: 20 },
        { key: "date", width: 18 },
        { key: "description", width: 30 },
        { key: "serial", width: 25 },
        { key: "quantity", width: 12 },
        { key: "from", width: 25 },
        { key: "to", width: 25 },
        { key: "condition", width: 25 },
        { key: "remarks", width: 25 },
      ];

      // Header Style
      const headerRow = sheet.getRow(4);
      headerRow.font = { bold: true };
      headerRow.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D9EAF7" },
        };

        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Data Rows
      records.forEach((item) => {
        const row = sheet.addRow([
          item.personnel,
          new Date(item.date).toLocaleDateString(),
          item.description,
          item.serial,
          item.quantity,
          item.from,
          item.to,
          item.condition,
          item.remarks,
        ]);

        row.eachCell((cell) => {
          row.getCell(1).alignment = { horizontal: "left", vertical: "middle" }; // Personnel
          row.getCell(2).alignment = {
            horizontal: "center",
            vertical: "middle",
          }; // Date
          row.getCell(3).alignment = { horizontal: "left", vertical: "middle" }; // Description
          row.getCell(4).alignment = {
            horizontal: "center",
            vertical: "middle",
          }; // Serial
          row.getCell(5).alignment = {
            horizontal: "center",
            vertical: "middle",
          }; // Qty
          row.getCell(6).alignment = {
            horizontal: "center",
            vertical: "middle",
          }; // From
          row.getCell(7).alignment = {
            horizontal: "center",
            vertical: "middle",
          }; // To
          row.getCell(8).alignment = { horizontal: "left", vertical: "middle" }; // Condition
          row.getCell(9).alignment = { horizontal: "left", vertical: "middle" }; // Remarks

          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Download response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Equipment_Movement_${fromDate}_to_${toDate}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Export failed.",
      });
    }
  },
);

export default router;
