import { Router, Request, Response } from "express";
import ITAsset from "../models/it_assets.model";
import ITUsageHistory from "../models/it_usage_history.model";
import ITAssetSerial from "../models/it_asset_serial.model";
import upload from "../middlewares/upload";
import fs from "fs";
import ExcelJS from "exceljs";
import { Op } from "sequelize";

const router = Router();

// --- TYPE INTERFACES ---
interface CreateAssetBody {
  item_name: string;
  specification?: string;
  category?: string;
  company?: string;
  unit_price?: number;
  stock?: number;
}

interface UpdateAssetBody {
  item_name?: string;
  specification?: string;
  category?: string;
  company?: string;
  unit_price?: string | number;
  stock?: string | number;
}

interface UpdateData {
  item_name?: string;
  specification?: string | null;
  category?: string | null;
  company?: string | null;
  unit_price?: number;
  stock?: number;
  image?: string;
}

// --- ROUTES ---

// Create Item Route
router.post(
  "/create",
  upload.single("image"),
  async (req: Request<{}, {}, CreateAssetBody>, res: Response) => {
    try {
      const image = req.file ? `/uploads/it-assets/${req.file.filename}` : null;

      const item = await ITAsset.create({
        item_name: req.body.item_name,
        specification: req.body.specification || null,
        category: req.body.category || null,
        company: req.body.company || null,
        unit_price: req.body.unit_price ? Number(req.body.unit_price) : 0,
        stock: req.body.stock ? Number(req.body.stock) : 0,
        image,
      });

      return res.status(201).json(item);
    } catch (error) {
      console.error("Database save failed. Starting file cleanup...", error);
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("❌ Failed to delete orphan file:", err);
        });
      }
      return res.status(500).json({ message: "Failed to create item" });
    }
  },
);

// View Catalog & Analytical Metrics Route (Optimized Memory Allocation)
router.get("/view", async (_req: Request, res: Response) => {
  try {
    const assets = await ITAsset.findAll();
    const usageRecords = await ITUsageHistory.findAll();

    // Map aggregate index to prevent O(N^2) inner looping scans
    const usageMap: Record<number, typeof usageRecords> = {};
    usageRecords.forEach((record) => {
      if (!usageMap[record.asset_id]) usageMap[record.asset_id] = [];
      usageMap[record.asset_id].push(record);
    });

    const results = assets.map((asset) => {
      const records = usageMap[asset.id] || [];
      let totalUsage = 0;
      const usedMonths = new Set<number>();

      records.forEach((record) => {
        totalUsage += Number(record.quantity);
        const month = new Date(record.usage_date as string | Date).getMonth();
        usedMonths.add(month);
      });

      const monthsUsed = usedMonths.size;
      const avgMonthlyUsage = monthsUsed > 0 ? totalUsage / monthsUsed : 0;

      const safetyStock =
        Math.ceil(Math.max(avgMonthlyUsage * 2, 10) / 10) * 10;
      const securementRate =
        safetyStock > 1 ? Number(asset.stock) / safetyStock : 0;
      const excessShortage = Number(asset.stock) - safetyStock;
      const regularOrderQty =
        securementRate < 1 ? Math.ceil(-excessShortage / 10) * 10 : 0;

      return {
        ...asset.toJSON(),
        avg_monthly_usage: Number(avgMonthlyUsage.toFixed(2)),
        safety_stock: safetyStock,
        securement_rate: securementRate,
        excess_shortage: excessShortage,
        regular_order_qty: regularOrderQty,
      };
    });

    return res.json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// Record Stock Usage (Transactional Atomic Operations)
router.post("/usage", async (req: Request, res: Response) => {
  if (!ITAsset.sequelize) {
    return res.status(500).json({ message: "Database connection unavailable" });
  }

  const transaction = await ITAsset.sequelize.transaction();
  try {
    const { asset_id, quantity, usage_date } = req.body;
    const asset = await ITAsset.findByPk(asset_id, { transaction });

    if (!asset) {
      await transaction.rollback();
      return res.status(404).json({ message: "Item not found" });
    }

    if (Number(asset.stock) < Number(quantity)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Insufficient stock" });
    }

    asset.stock = Number(asset.stock) - Number(quantity);
    await asset.save({ transaction });

    await ITUsageHistory.create(
      { asset_id, quantity, usage_date },
      { transaction },
    );
    await transaction.commit();

    return res.json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: "Failed to record usage" });
  }
});

// Update Item Route
router.put(
  "/update/:id",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const item = await ITAsset.findByPk(id);

      if (!item) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Item not found" });
      }

      const body = req.body as UpdateAssetBody;
      const updateData: UpdateData = {
        item_name: body.item_name,
        specification: body.specification ?? null,
        category: body.category ?? null,
        company: body.company ?? null,
        unit_price: body.unit_price ? Number(body.unit_price) : undefined,
        stock: body.stock ? Number(body.stock) : undefined,
      };

      if (req.file) {
        updateData.image = `/uploads/it-assets/${req.file.filename}`;
        // Optional: Delete old image from disk here if item.image exists
      }

      await item.update(updateData);
      return res.json(item);
    } catch (error) {
      console.error(error);
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: "Failed to update item" });
    }
  },
);

// Delete Item Route
router.delete("/delete/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ITAsset.destroy({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete item" });
  }
});

// Export to excel ItStocks.tsx
router.get("/export/", async (req, res) => {
  try {
    const assets = await ITAsset.findAll();
    const usageRecords = await ITUsageHistory.findAll();
    const serialRecords = await ITAssetSerial.findAll();
    const BLUE = "00B0F0";
    const GREEN = "C6E0B4";
    const ORANGE = "F4B183";
    const DARK_ORANGE = "E6A57A";
    const PEACH = "F4C7A1";
    const LIGHT_BLUE = "D9E2F3";
    const PURPLE = "D9D2E9";
    const GRAY = "D9D9D9";
    const RED = "F4CCCC";

    // Map & Compute Data FIRST
    const items = assets.map((asset) => {
      const inbound = {
        JAN: 0,
        FEB: 0,
        MAR: 0,
        APR: 0,
        MAY: 0,
        JUN: 0,
        JUL: 0,
        AUG: 0,
        SEP: 0,
        OCT: 0,
        NOV: 0,
        DEC: 0,
      };
      const usage = {
        JAN: 0,
        FEB: 0,
        MAR: 0,
        APR: 0,
        MAY: 0,
        JUN: 0,
        JUL: 0,
        AUG: 0,
        SEP: 0,
        OCT: 0,
        NOV: 0,
        DEC: 0,
      };

      const monthsArr = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];

      // Filter Serials for this specific asset
      const serials = serialRecords.filter((r) => r.asset_id === asset.id);
      serials.forEach((record) => {
        if (!record.received_date) return;
        const date = new Date(record.received_date);
        const month = monthsArr[date.getMonth()];
        if (month) inbound[month as keyof typeof inbound]++;
      });

      // Filter Usage for this specific asset
      const assetUsage = usageRecords.filter((u) => u.asset_id === asset.id);
      assetUsage.forEach((record) => {
        if (!record.usage_date) return;
        const date = new Date(record.usage_date);
        const month = monthsArr[date.getMonth()];
        if (month)
          usage[month as keyof typeof usage] += Number(record.quantity || 0);
      });

      const totalInbound = Object.values(inbound).reduce((a, b) => a + b, 0);
      const totalUsage = Object.values(usage).reduce((a, b) => a + b, 0);
      const monthsUsed = Object.values(usage).filter((v) => v > 0).length;

      const averageMonthlyUsage = monthsUsed > 0 ? totalUsage / monthsUsed : 0;
      const safetyStock =
        Math.ceil(Math.max(averageMonthlyUsage * 2, 10) / 10) * 10;
      const securementRate =
        safetyStock > 0 ? Number(asset.stock) / safetyStock : 0;
      const excessShortage = Number(asset.stock) - safetyStock;
      const orderQty =
        securementRate < 1 ? Math.ceil(Math.abs(excessShortage) / 10) * 10 : 0;

      return {
        part_number: asset.item_name,
        specification: asset.specification,
        category: asset.category,
        unit_price: asset.unit_price,
        company: asset.company,
        start_stock: asset.stock,
        inbound,
        usage,
        totalInbound,
        totalUsage,
        averageMonthlyUsage,
        safetyStock,
        currentStock: asset.stock,
        securementRate,
        excessShortage,
        orderQty,
      };
    });

    // Setup ExcelJS workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Stock Report");

    sheet.columns = [
      { width: 18 }, // A Part Number
      { width: 50 }, // B Specifications
      { width: 15 }, // C Category
      { width: 15 }, // D Unit Price
      { width: 18 }, // E Company
      { width: 10 }, // F Start Stock
      // Inbound Months (G - R)
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 12 }, // S Total Inbound
      // Usage Months (T - AE)
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 6 },
      { width: 12 }, // AF Total Usage
      { width: 18 }, // AG Avg Monthly Usage
      { width: 12 }, // AH Safety Stock
      { width: 12 }, // AI Current Stock
      { width: 14 }, // AJ Securement Rate
      { width: 14 }, // AK Excess/Shortage
      { width: 12 }, // AL Order Qty
    ];

    sheet.getRow(1).height = 30;
    sheet.getRow(2).height = 25;

    // PRIMARY HEADERS (Rows 1 & 2)
    const mainHeaders = [
      { cell: "A1:A2", val: "Part Number" },
      { cell: "B1:B2", val: "Specifications" },
      { cell: "C1:C2", val: "Category" },
      { cell: "D1:D2", val: "Unit Price" },
      { cell: "E1:E2", val: "Company" },
      { cell: "F1:F2", val: "Start Stock" },
    ];

    mainHeaders.forEach(({ cell, val }) => {
      sheet.mergeCells(cell);
      sheet.getCell(cell.split(":")[0]).value = val;
    });

    sheet.mergeCells("G1:R1");
    sheet.getCell("G1").value = "INBOUND";

    sheet.mergeCells("S1:S2");
    sheet.getCell("S1").value = "Total Inbound";

    sheet.mergeCells("T1:AE1");
    sheet.getCell("T1").value = "USAGE";

    // KPI Summary Columns after Usage
    const endHeaders = [
      "Total Usage",
      "Avg Monthly Usage",
      "Safety Stock",
      "Current Stock",
      "Securement Rate",
      "Excess/Shortage",
      "Order Qty",
    ];
    endHeaders.forEach((header, index) => {
      const colNum = 32 + index; // Starts at Column AF (32)
      sheet.mergeCells(1, colNum, 2, colNum);
      sheet.getCell(1, colNum).value = header;
    });

    // GENERATE MONTH SUB-HEADERS (Row 2)
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    months.forEach((month, index) => {
      sheet.getCell(2, 7 + index).value = month;
      sheet.getCell(2, 20 + index).value = month;
    });

    // Color Setup for main column structures (Headers Row 1 & 2)
    for (let col = 1; col <= 6; col++) {
      ["1", "2"].forEach((row) => {
        sheet.getCell(`${String.fromCharCode(64 + col)}${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: BLUE },
        };
      });
    }

    sheet.getCell("G1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: GREEN },
    };

    // Setting light green sub-heading for inbound months
    for (let col = 7; col <= 18; col++) {
      sheet.getCell(2, col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E2F0D9" },
      };
    }

    sheet.getCell("S1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "A9D18E" },
    };
    sheet.getCell("S2").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "A9D18E" },
    };

    sheet.getCell("T1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: ORANGE },
    };

    // Setting light peach sub-heading for usage months
    for (let col = 20; col <= 31; col++) {
      sheet.getCell(2, col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FCE4D6" },
      };
    }

    // Mapping master header colors to match column structural backgrounds perfectly
    const columnColors: Record<string, string> = {
      F: BLUE, // Start Stock matches BLUE header
      S: "A9D18E", // Total Inbound header color
      AF: DARK_ORANGE, // Total Usage header color
      AG: PEACH, // Avg Monthly Usage header color
      AH: LIGHT_BLUE, // Safety Stock header color
      AI: GREEN, // Current Stock header color
      AJ: PURPLE, // Securement Rate header color
      AK: GRAY, // Excess/Shortage header color
      AL: RED, // Order Qty header color
    };

    Object.entries(columnColors).forEach(([col, color]) => {
      if (col !== "F" && col !== "S") {
        // Ignore individual headers handled separately upstream
        sheet.getCell(`${col}1`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color },
        };
        sheet.getCell(`${col}2`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color },
        };
      }
    });

    // POPULATE DATA ROWS
    items.forEach((item) => {
      sheet.addRow([
        item.part_number,
        item.specification,
        item.category,
        item.unit_price,
        item.company,
        item.start_stock,

        item.inbound.JAN,
        item.inbound.FEB,
        item.inbound.MAR,
        item.inbound.APR,
        item.inbound.MAY,
        item.inbound.JUN,
        item.inbound.JUL,
        item.inbound.AUG,
        item.inbound.SEP,
        item.inbound.OCT,
        item.inbound.NOV,
        item.inbound.DEC,

        item.totalInbound,

        item.usage.JAN,
        item.usage.FEB,
        item.usage.MAR,
        item.usage.APR,
        item.usage.MAY,
        item.usage.JUN,
        item.usage.JUL,
        item.usage.AUG,
        item.usage.SEP,
        item.usage.OCT,
        item.usage.NOV,
        item.usage.DEC,

        item.totalUsage,
        item.averageMonthlyUsage,
        item.safetyStock,
        item.currentStock,
        item.securementRate,
        item.excessShortage,
        item.orderQty,
      ]);
    });

    // GLOBAL ROW STYLING & FORMATTING
    sheet.eachRow((row, rowNumber) => {
      row.height = rowNumber > 2 ? 90 : rowNumber === 1 ? 30 : 25;

      row.eachCell((cell) => {
        // Apply Global Borders & Alignments
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };

        // Match requested column bodies to their respective header colors dynamically
        if (rowNumber > 2) {
          const colLetter = cell.address.replace(/[0-9]/g, ""); // Extract letter (e.g., 'F', 'S', 'AF')
          if (columnColors[colLetter]) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: columnColors[colLetter] },
            };
          }
        }
      });

      // Handle standalone styling specific to numeric presentation on the data rows
      if (rowNumber > 2) {
        const cellAJ = row.getCell(36); // Column AJ Securement Rate index
        cellAJ.numFmt = "0%";
      }
    });

    // Alignment corrections for specifications column
    sheet.getColumn("B").width = 30;
    sheet.getColumn("B").alignment = {
      wrapText: true,
      vertical: "middle",
      horizontal: "left",
    };

    sheet.views = [{ state: "frozen", ySplit: 2 }];

    // SEND RESPONSE
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=IT_STOCK_REPORT.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export failed:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Export to excel ItStockDetailsPage.tsx
router.get("/export-serials/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assetId = Number(req.params.id);

    if (isNaN(assetId)) {
      return res.status(400).json({ error: "Invalid Asset ID format" });
    }

    const { from, to } = req.query;

    const asset = await ITAsset.findByPk(assetId, {
      attributes: ["specification"],
    });

    // Fallback if the asset doesn't exist
    const specificationText = asset?.specification || "N/A";

    const where: any = {
      asset_id: id,
    };

    if (from && to) {
      where.received_date = {
        [Op.between]: [from, to],
      };
    }

    const records = await ITAssetSerial.findAll({
      where,
      order: [["received_date", "ASC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("IT Asset Details");

    sheet.columns = [
      { header: "Serial Number", key: "serial_number", width: 30 },
      { header: "Specifications", key: "specification", width: 35 },
      { header: "PR Date", key: "pr_date", width: 18 },
      { header: "Received Date", key: "received_date", width: 18 },
      { header: "Deployed Date", key: "deployed_date", width: 18 },
      { header: "Station", key: "station", width: 22 },
      { header: "Department", key: "department", width: 22 },
      {
        header: "Outbound Personnel",
        key: "outbound_personnel",
        width: 22,
      },
      { header: "Receiver", key: "receiver", width: 18 },
      { header: "Status", key: "status", width: 18 },
      { header: "Remarks", key: "remarks", width: 18 },
      { header: "Reason", key: "reason", width: 35 },
    ];

    const formatDate = (date: any) => {
      if (!date) return "";

      return new Date(date).toLocaleDateString("en-CA");
    };

    records.forEach((record) => {
      const mappedStatus = record.remarks?.includes("AVAILABLE")
        ? "BRAND NEW"
        : record.remarks;

      sheet.addRow({
        serial_number: record.serial_number,
        specification: specificationText, // Use the variable fetched from the single asset query
        pr_date: formatDate(record.pr_date),
        received_date: formatDate(record.received_date),
        deployed_date: formatDate(record.deployed_date),
        station: record.station ?? "",
        department: record.department ?? "",
        outbound_personnel: record.outbound_personnel ?? "",
        receiver: record.receiver ?? "",
        status: mappedStatus,
        remarks: record.remarks,
        reason: record.reason ?? "",
      });
    });

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "000000" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    const headerColors = {
      1: "A9C4E4", // Serial Number
      2: "A9C4E4", // Specification
      3: "FFD966", // PR
      4: "FFD966", // Received
      5: "F4B183", // Deployed
      6: "F4B183", // Station
      7: "F4B183", // Department
      8: "F4B183", // Authorized
      9: "F4B183", // Receiver
      10: "9FC5E8", // Status
      11: "9FC5E8", // Remarks
      12: "9FC5E8", // Reason
    };

    sheet.getRow(1).eachCell((cell, col) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: headerColors[col as keyof typeof headerColors] || "FFFFFF",
        },
      };

      cell.font = {
        bold: true,
        color: { argb: "000000" },
      };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };

        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
      });

      for (let i = 2; i <= sheet.rowCount; i++) {
        sheet.getRow(i).getCell(10).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D9F2D9" },
        };
      }

      for (let i = 2; i <= sheet.rowCount; i++) {
        sheet.getRow(i).getCell(11).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F4CCCC" },
        };
      }
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=IT_SERIAL_REPORT_${id}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting serials:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export excel spreadsheet" });
    }
  }
});

// Load data
router.get("/serials/:id", async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    const search = String(req.query.search || "");

    const serials = await ITAssetSerial.findAll({
      where: {
        asset_id: assetId,
      },
      order: [["received_date", "DESC"]],
    });

    let results = serials;

    if (search.trim()) {
      const keyword = search.toLowerCase();

      results = serials.filter(
        (item) =>
          item.serial_number?.toLowerCase().includes(keyword) ||
          item.station?.toLowerCase().includes(keyword) ||
          item.department?.toLowerCase().includes(keyword) ||
          item.authorized_personnel?.toLowerCase().includes(keyword) ||
          item.receiver?.toLowerCase().includes(keyword),
      );
    }

    return res.json(results);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch serial records",
    });
  }
});

router.get("/monthly-summary/:id", async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);

    const year = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();

    const item = await ITAsset.findByPk(assetId);

    if (!item) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const serials = await ITAssetSerial.findAll({
      where: {
        asset_id: assetId,
      },
    });

    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    const inbound: Record<string, number> = {};
    const outbound: Record<string, number> = {};

    months.forEach((month) => {
      inbound[month] = 0;
      outbound[month] = 0;
    });

    let totalInbound = 0;
    let totalOutbound = 0;

    const usedMonths = new Set<number>();

    serials.forEach((serial) => {
      // INBOUND

      if (serial.received_date) {
        const receivedDate = new Date(serial.received_date);

        if (receivedDate.getFullYear() === year) {
          const month = months[receivedDate.getMonth()];

          inbound[month] += 1;
          totalInbound += 1;
        }
      }

      // OUTBOUND

      if (serial.deployed_date) {
        const deployedDate = new Date(serial.deployed_date);

        if (deployedDate.getFullYear() === year) {
          const month = months[deployedDate.getMonth()];

          outbound[month] += 1;
          totalOutbound += 1;

          usedMonths.add(deployedDate.getMonth());
        }
      }
    });

    // Current available stock

    const currentStock = serials.filter((serial) =>
      [
        "BRAND NEW: AVAILABLE",
        "REPAIRED: AVAILABLE",
        "RETURNED: AVAILABLE",
        "AVAILABLE",
        "UNDER WARRANTY",
      ].includes(serial.remarks),
    ).length;

    const monthsUsed = usedMonths.size;

    const averageMonthlyUsage =
      monthsUsed > 0 ? Number((totalOutbound / monthsUsed).toFixed(2)) : 0;

    const safetyStock =
      Math.ceil(Math.max(averageMonthlyUsage * 2, 10) / 10) * 10;

    const securementRate =
      safetyStock > 0 ? Number((currentStock / safetyStock).toFixed(2)) : 0;

    const excessShortage = currentStock - safetyStock;

    const regularOrderQty =
      excessShortage < 0 ? Math.ceil(Math.abs(excessShortage) / 10) * 10 : 0;

    return res.json({
      item: {
        id: item.id,
        item_name: item.item_name,
        currentStock,
      },

      summary: {
        inbound,
        outbound,

        totalInbound,
        totalOutbound,

        averageMonthlyUsage,

        safetyStock,

        securementRate,

        excessShortage,

        regularOrderQty,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to generate monthly summary",
    });
  }
});

// Inbound Item Route (With Transaction Counter Adjustments)
router.post("/inbound", async (req, res) => {
  if (!ITAsset.sequelize)
    return res.status(500).json({ message: "Database connection unavailable" });

  const transaction = await ITAsset.sequelize.transaction();
  try {
    const {
      asset_id,
      serial_number,
      pr_date,
      received_date,
      inbound_personnel,
    } = req.body;

    // 1. Check for an existing duplicate serial number
    const existingSerial = await ITAssetSerial.findOne({
      where: { serial_number },
      transaction, // Keep this inside the transaction for data consistency
    });

    if (existingSerial) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Serial number '${serial_number}' already exists in the inventory.`,
      });
    }

    // 2. Verify parent asset exists
    const parentAsset = await ITAsset.findByPk(asset_id, { transaction });
    if (!parentAsset) {
      await transaction.rollback();
      return res.status(404).json({ message: "Parent Asset ID not found" });
    }

    // 3. Create the inbound record if all checks pass
    const serial = await ITAssetSerial.create(
      {
        asset_id,
        serial_number,
        pr_date,
        received_date,
        inbound_personnel,
        remarks: "BRAND NEW: AVAILABLE",
      },
      { transaction },
    );

    // Auto increment parent counter cache tracking
    parentAsset.stock = Number(parentAsset.stock) + 1;
    await parentAsset.save({ transaction });

    await transaction.commit();
    return res.status(201).json(serial);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: "Failed to inbound item" });
  }
});

// Outbound Deploy Route (With Transaction Counter Adjustments)
router.post("/outbound", async (req, res) => {
  if (!ITAsset.sequelize)
    return res.status(500).json({ message: "Database connection unavailable" });

  const transaction = await ITAsset.sequelize.transaction();
  try {
    const {
      serial_number,
      station,
      department,
      authorized_personnel,
      receiver,
      outbound_personnel,
      reason,
      deployed_date,
    } = req.body;

    // 1. Find the asset serial
    const serial = await ITAssetSerial.findOne({
      where: { serial_number },
      transaction,
    });

    // Check if it exists at all
    if (!serial) {
      await transaction.rollback();
      return res.status(404).json({
        message: `Serial number '${serial_number}' was not found in the system.`,
      });
    }

    // 2. State Guard Check: Reject if it's not explicitly available
    const validStatuses = [
      "BRAND NEW: AVAILABLE",
      "REPAIRED: AVAILABLE",
      "RETURNED: AVAILABLE",
      "AVAILABLE",
    ];

    if (!validStatuses.includes(serial.remarks)) {
      await transaction.rollback();

      // Dynamic helpful error message based on current status
      let customFeedback = `This item cannot be deployed because its current status is '${serial.remarks}'.`;
      if (serial.remarks === "DEPLOYED") {
        customFeedback = `Action Denied: Serial '${serial_number}' is already deployed to station/dept: ${serial.station || "Unknown"} (${serial.department || "No Dept"}).`;
      } else if (serial.remarks === "UNDER REPAIR") {
        customFeedback = `Action Denied: Serial '${serial_number}' is currently flagged as UNDER REPAIR and cannot be assigned.`;
      }

      return res.status(400).json({ message: customFeedback });
    }

    // 3. Adjust cached parent asset stock counter downwards
    const parentAsset = await ITAsset.findByPk(serial.asset_id, {
      transaction,
    });
    if (parentAsset) {
      parentAsset.stock = Math.max(0, Number(parentAsset.stock) - 1);
      await parentAsset.save({ transaction });
    }

    // 4. Perform assignment updates
    await serial.update(
      {
        station,
        department,
        authorized_personnel,
        receiver,
        outbound_personnel,
        reason,
        deployed_date,
        remarks: "DEPLOYED",
      },
      { transaction },
    );

    await transaction.commit();
    return res.json(serial);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: "Failed to deploy item" });
  }
});

// Return Item Route
router.put("/return/:id", async (req, res) => {
  if (!ITAsset.sequelize) {
    return res.status(500).json({ message: "Database connection unavailable" });
  }

  const transaction = await ITAsset.sequelize.transaction();
  try {
    const serial = await ITAssetSerial.findByPk(req.params.id, { transaction });
    if (!serial) {
      await transaction.rollback();
      return res.status(404).json({ message: "Item not found" });
    }

    const parentAsset = await ITAsset.findByPk(serial.asset_id, {
      transaction,
    });

    // Check if it's actually deployed so we don't accidentally double-increment stock
    if (parentAsset && serial.remarks === "DEPLOYED") {
      // Cleaner, atomic way to handle incrementing in Sequelize
      await parentAsset.increment("stock", { by: 1, transaction });
    }

    await serial.update(
      {
        station: null,
        department: null,
        receiver: null,
        authorized_personnel: null,
        outbound_personnel: null,
        reason: null,
        deployed_date: null,
        remarks: "RETURNED: AVAILABLE",
      },
      { transaction },
    );

    await transaction.commit();
    return res.json(serial);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to execute return operation" });
  }
});

// Hold Item Route
router.put("/hold/:id", async (req: Request, res: Response) => {
  if (!ITAsset.sequelize) {
    return res.status(500).json({ message: "Database connection unavailable" });
  }

  const transaction = await ITAsset.sequelize.transaction();

  try {
    const serial = await ITAssetSerial.findByPk(req.params.id as string, {
      transaction,
    });

    if (!serial) {
      await transaction.rollback();
      return res.status(404).json({ message: "Serial not found" });
    }

    await serial.update({ remarks: "ON HOLD" }, { transaction });

    await transaction.commit();

    return res.json(serial);
  } catch (error) {
    await transaction.rollback();
    console.error(error);

    return res.status(500).json({
      message: "Failed to place asset on hold.",
    });
  }
});

// Resume Item Route
router.put("/resume/:id", async (req: Request, res: Response) => {
  try {
    const serial = await ITAssetSerial.findByPk(req.params.id as string);
    if (!serial) return res.status(404).json({ message: "Serial not found" });

    if (serial.remarks !== "ON HOLD") {
      return res.status(400).json({ message: "Asset is not on hold." });
    }

    serial.remarks = "DEPLOYED";
    await serial.save();

    return res.json(serial);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to resume deployment." });
  }
});

// Mark as available Item Route
router.put("/return-from-hold/:id", async (req: Request, res: Response) => {
  if (!ITAsset.sequelize)
    return res.status(500).json({ message: "Database offline" });

  const transaction = await ITAsset.sequelize.transaction();
  try {
    const serial = await ITAssetSerial.findByPk(req.params.id as string, {
      transaction,
    });
    if (!serial) {
      await transaction.rollback();
      return res.status(404).json({ message: "Serial not found" });
    }

    // 1. Increment Stock now because it's officially going back to inventory
    const parentAsset = await ITAsset.findByPk(serial.asset_id, {
      transaction,
    });
    if (parentAsset) {
      await parentAsset.increment("stock", { by: 1, transaction });
    }

    // 2. Wipe fields and set to AVAILABLE
    await serial.update(
      {
        station: null,
        department: null,
        receiver: null,
        authorized_personnel: null,
        outbound_personnel: null,
        reason: null,
        deployed_date: null,
        remarks: "AVAILABLE", // Per your requirement
      },
      { transaction },
    );

    await transaction.commit();
    return res.json(serial);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to return asset to stock." });
  }
});

// Warranty Item Route
router.put("/warranty/:id", async (req: Request, res: Response) => {
  if (!ITAsset.sequelize)
    return res.status(500).json({ message: "Database offline" });

  const transaction = await ITAsset.sequelize.transaction();
  try {
    const serial = await ITAssetSerial.findByPk(req.params.id as string, {
      transaction,
    });

    if (!serial) {
      await transaction.rollback();
      return res.status(404).json({ message: "Serial not found" });
    }

    // STATE GUARD: Enforce your matrix rules
    if (
      serial.remarks !== "DEPLOYED" &&
      !serial.remarks.includes("AVAILABLE")
    ) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Cannot send to warranty. Asset is currently ${serial.remarks}`,
      });
    }

    // STOCK LOGIC: If it was deployed, it's being pulled back, so increment stock
    if (serial.remarks === "DEPLOYED") {
      const parentAsset = await ITAsset.findByPk(serial.asset_id, {
        transaction,
      });
      if (parentAsset) {
        await parentAsset.increment("stock", { by: 1, transaction });
      }
    }

    // Wipe deployment data since it is no longer with a user/station
    await serial.update(
      {
        station: null,
        department: null,
        receiver: null,
        authorized_personnel: null,
        outbound_personnel: null,
        reason: null,
        deployed_date: null,
        remarks: "UNDER WARRANTY",
      },
      { transaction },
    );

    await transaction.commit();
    return res.json(serial); // Clean return for frontend state sync
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: "Failed to update asset status." });
  }
});

// Warranty Complete Item Route
router.put("/warranty-complete/:id", async (req: Request, res: Response) => {
  try {
    const serial = await ITAssetSerial.findByPk(req.params.id as string);

    if (!serial) {
      return res.status(404).json({ message: "Serial not found" });
    }

    // STATE GUARD: Ensure it's actually under warranty
    if (serial.remarks !== "UNDER WARRANTY") {
      return res.status(400).json({ message: "Asset is not under warranty." });
    }

    // Per your matrix, it becomes REPAIRED AVAILABLE (or BRAND NEW AVAILABLE)
    serial.remarks = "AVAILABLE";
    await serial.save();

    return res.json(serial); // Clean return for frontend state sync
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to complete warranty process." });
  }
});

// Deploy Item Route hindi na nagamit kasi sa outbound route ko na pinadaan.
{
  /*router.put("/deploy/:id", async (req: Request, res: Response) => {
  if (!ITAsset.sequelize) {
    return res.status(500).json({ message: "Database connection unavailable" });
  }

  // Start a transaction for safe stock deduction
  const transaction = await ITAsset.sequelize.transaction();

  try {
    const serial = await ITAssetSerial.findByPk(req.params.id as string, {
      transaction,
    });

    if (!serial) {
      await transaction.rollback();
      return res.status(404).json({ message: "Serial not found" });
    }

    // STATE GUARD: Ensure the asset is actually in an available state before deploying
    if (!serial.remarks.includes("AVAILABLE")) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Cannot deploy asset. Current status is ${serial.remarks}, not AVAILABLE.`,
      });
    }

    const {
      deployed_date,
      station,
      department,
      outbound_personnel,
      receiver,
      reason,
    } = req.body;

    // Safely decrement parent asset stock by 1
    const parentAsset = await ITAsset.findByPk(serial.asset_id, {
      transaction,
    });
    if (parentAsset) {
      if (Number(parentAsset.stock) <= 0) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Cannot deploy. Parent asset is out of stock." });
      }
      await parentAsset.decrement("stock", { by: 1, transaction });
    }

    // Update serial tracking data
    await serial.update(
      {
        deployed_date,
        station,
        department,
        outbound_personnel,
        receiver,
        reason,
        remarks: "DEPLOYED",
      },
      { transaction },
    );

    await transaction.commit();

    return res.json(serial);
  } catch (error) {
    await transaction.rollback();
    console.error(error);

    return res.status(500).json({
      message: "Failed to deploy asset.",
    });
  }
});*/
}

// Dispose Item Route
router.put("/dispose/:id", async (req: Request, res: Response) => {
  if (!ITAsset.sequelize) {
    return res.status(500).json({ message: "Database connection unavailable" });
  }

  const transaction = await ITAsset.sequelize.transaction();

  try {
    const { authorized_personnel, reasonFor } = req.body;

    // Validation Guard
    if (!authorized_personnel || !reasonFor) {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Missing audit data. Authorized personnel and reason are required to dispose items.",
      });
    }

    const serial = await ITAssetSerial.findByPk(req.params.id as string, {
      transaction,
    });

    if (!serial) {
      await transaction.rollback();
      return res.status(404).json({ message: "Serial number not found." });
    }

    // STATE GUARD: Only allow disposal if it's currently in an available status
    if (!serial.remarks.includes("AVAILABLE")) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Cannot dispose of asset. Status is "${serial.remarks}". Only available items can be disposed.`,
      });
    }

    // STOCK ADJUSTMENT: Safely decrement 1 from the parent warehouse stock count
    const parentAsset = await ITAsset.findByPk(serial.asset_id, {
      transaction,
    });
    if (parentAsset) {
      if (Number(parentAsset.stock) <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Disposal failed. Parent stock count is already 0.",
        });
      }
      await parentAsset.decrement("stock", { by: 1, transaction });
    }

    // UPDATE FIELDS & LOG AUDIT TRAIL
    serial.remarks = "DISPOSED";
    serial.authorized_personnel = authorized_personnel;
    serial.reasonFor = reasonFor; // Maps directly to your text row view display column

    await serial.save({ transaction });
    await transaction.commit();

    return res.json({
      message: "Asset permanently disposed of and stock updated successfully.",
      serial,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Disposal Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to complete asset disposal workflow." });
  }
});

// Update Item Details
router.put("/serials/:id", async (req: Request, res: Response) => {
  try {
    const serial = await ITAssetSerial.findByPk(Number(req.params.id));

    if (!serial) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    await serial.update(req.body);

    return res.json(serial);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update serial record",
    });
  }
});

// Break Repair down into processing components instead of a double async call step loop
router.post("/repair/start/:id", async (req, res) => {
  try {
    const serial = await ITAssetSerial.findByPk(req.params.id);
    if (!serial) return res.status(404).json({ message: "Item not found" });

    await serial.update({ remarks: "UNDER REPAIR" });
    return res.json({
      message: "Asset status flagged under repair",
      data: serial,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed updating repair entry status" });
  }
});

router.post("/repair/complete/:id", async (req, res) => {
  try {
    const { status } = req.body; // Expect e.g. "REPAIRED: AVAILABLE" or "Repair Failed"

    const serial = await ITAssetSerial.findByPk(req.params.id);
    if (!serial) return res.status(404).json({ message: "Item not found" });

    // Validate allowed status transitions
    const validStatuses = ["REPAIRED: AVAILABLE", "Repair Failed"];
    const newRemarks = validStatuses.includes(status)
      ? status
      : "REPAIRED: AVAILABLE";

    await serial.update({ remarks: newRemarks });

    return res.json({
      message:
        newRemarks === "Repair Failed"
          ? "Asset marked as Repair Failed"
          : "Asset successfully restored to service pool",
      data: serial,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to update asset repair status" });
  }
});

export default router;
