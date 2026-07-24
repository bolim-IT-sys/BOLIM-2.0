import { Router, Request, Response } from "express";
import ITAsset from "../models/it_assets.model";
import PINSAsset from "../models/pins_assets.model";
import ITUsageHistory from "../models/it_usage_history.model";
import PinsUsageHistory from "../models/pins_usage_history.model";
import ITAssetSerial from "../models/it_asset_serial.model";
import pinUpload from "../middlewares/pinsUpload";
import fs from "fs";
import ExcelJS from "exceljs";
import PINSAssetSerialInbound from "../models/pins_asset_inbound.model";
import { calculateInventoryMetrics } from "../utils/metricsHelper";
import PINSAssetSerialOutbound from "../models/pins_asset_outbound.model";

const router = Router();

// --- TYPE INTERFACES ---
interface CreateAssetBody {
  pin_name: string;
  specification?: string;
  category?: string;
  company?: string;
  unit_price?: number;
  stock?: number;
}

interface UpdateAssetBody {
  pin_name?: string;
  specification?: string;
  category?: string;
  company?: string;
  unit_price?: string | number;
  stock?: string | number;
}

interface UpdateData {
  pin_name?: string;
  specification?: string | null;
  category?: string | null;
  company?: string | null;
  unit_price?: number;
  stock?: number;
  image?: string;
}

// --- ROUTES ---

// Create Pin Route 🗸
router.post(
  "/create",
  pinUpload.single("image"),
  async (req: Request<{}, {}, CreateAssetBody>, res: Response) => {
    try {
      const image = req.file
        ? `/uploads/pins-assets/${req.file.filename}`
        : null;

      const item = await PINSAsset.create({
        pin_name: req.body.pin_name,
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

// View Catalog & Analytical Metrics Route (Optimized Memory Allocation) 🗸
router.get("/view", async (_req: Request, res: Response) => {
  try {
    const assets = await PINSAsset.findAll();
    const usageRecords = await PinsUsageHistory.findAll();

    // Group usage records by asset_id
    const usageMap: Record<number, typeof usageRecords> = {};
    usageRecords.forEach((record) => {
      if (!usageMap[record.asset_id]) usageMap[record.asset_id] = [];
      usageMap[record.asset_id].push(record);
    });

    const results = assets.map((asset) => {
      const records = usageMap[asset.id] || [];

      // Calculate inputs for your helper function
      let totalUsage = 0;
      const usedMonths = new Set<number>();

      records.forEach((record) => {
        totalUsage += Number(record.quantity);
        const month = new Date(record.usage_date as string | Date).getMonth();
        usedMonths.add(month);
      });

      const monthsUsed = usedMonths.size;

      // 🔑 Call your exact helper function!
      const metrics = calculateInventoryMetrics(
        Number(asset.stock),
        totalUsage,
        monthsUsed,
      );

      return {
        ...asset.toJSON(),
        avg_monthly_usage: Number(metrics.avgMonthlyUsage.toFixed(2)),
        safety_stock: metrics.safetyStock,
        securement_rate: metrics.securementRate,
        excess_shortage: metrics.excessShortage,
        regular_order_qty: metrics.regularOrderQty,
      };
    });

    return res.json(results);
  } catch (error) {
    console.error("Error fetching inventory view:", error);
    return res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// Update Pin Route 🗸
router.put(
  "/update/:id",
  pinUpload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const item = await PINSAsset.findByPk(id);

      if (!item) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Item not found" });
      }

      const body = req.body as UpdateAssetBody;
      const updateData: UpdateData = {
        pin_name: body.pin_name,
        specification: body.specification ?? null,
        category: body.category ?? null,
        company: body.company ?? null,
        unit_price: body.unit_price ? Number(body.unit_price) : undefined,
        stock: body.stock ? Number(body.stock) : undefined,
      };

      if (req.file) {
        updateData.image = `/uploads/pins-assets/${req.file.filename}`;
        // Delete old image from disk here if item.image exists
      }

      await item.update(updateData);
      return res.json(item);
    } catch (error) {
      console.error(error);
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: "Failed to update pin" });
    }
  },
);

// Delete Item Route 🗸
router.delete("/delete/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await PINSAsset.destroy({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete item" });
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

// Export to excel ItStocks.tsx
router.get("/export/", async (req, res) => {
  try {
    const assets = await PINSAsset.findAll();
    // 1. Fetch BOTH Inbound and Outbound serial/transaction records
    const inboundRecords = await PINSAssetSerialInbound.findAll();
    const outboundRecords = await PINSAssetSerialOutbound.findAll();

    const monthsArr = [
      "JA",
      "FE",
      "M1",
      "AP",
      "M2",
      "JU1",
      "JU2",
      "AU",
      "SE",
      "OC",
      "NO",
      "DE",
    ];

    // 2. Map & Compute Data per Asset
    const items = assets.map((asset) => {
      const inbound = {
        JA: 0,
        FE: 0,
        M1: 0,
        AP: 0,
        M2: 0,
        JU1: 0,
        JU2: 0,
        AU: 0,
        SE: 0,
        OC: 0,
        NO: 0,
        DE: 0,
      };
      const usage = {
        JA: 0,
        FE: 0,
        M1: 0,
        AP: 0,
        M2: 0,
        JU1: 0,
        JU2: 0,
        AU: 0,
        SE: 0,
        OC: 0,
        NO: 0,
        DE: 0,
      };

      // Calculate INBOUND count by month for this asset
      const assetInbounds = inboundRecords.filter(
        (r) => r.asset_id === asset.id,
      );
      assetInbounds.forEach((record) => {
        const dateVal = record.inbound_date || record.createdAt;
        if (!dateVal) return;
        const date = new Date(dateVal);
        const monthKey = monthsArr[date.getMonth()];
        if (monthKey) {
          // If the model records quantity per row, use record.quantity, otherwise count 1 per serial
          const qty = Number(record.inbound_quantity || 1);
          inbound[monthKey as keyof typeof inbound] += qty;
        }
      });

      // Calculate USAGE (Outbound) count by month for this asset
      const assetOutbounds = outboundRecords.filter(
        (r) => r.asset_id === asset.id,
      );
      assetOutbounds.forEach((record) => {
        const dateVal = record.outbound_date || record.createdAt;
        if (!dateVal) return;
        const date = new Date(dateVal);
        const monthKey = monthsArr[date.getMonth()];
        if (monthKey) {
          const qty = Number(record.outbound_quantity || 1);
          usage[monthKey as keyof typeof usage] += qty;
        }
      });

      return {
        part_number: asset.pin_name,
        specification: asset.specification || "전핀(원형일자핀)",
        category: asset.category || "검사핀",
        unit_price: asset.unit_price || 0,
        company: asset.company || "하닉스",
        start_stock: asset.stock || 0,
        inbound,
        usage,
        safetyStock: 10, // Default safety stock base
      };
    });

    // Setup ExcelJS workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Stock Report");

    // Grid lines & frozen headers
    sheet.views = [{ state: "frozen", ySplit: 2, showGridLines: true }];

    // Column Dimensions
    sheet.columns = [
      { width: 16 }, // A Part Number
      { width: 22 }, // B Specifications
      { width: 12 }, // C Category
      { width: 14 }, // D Unit Price
      { width: 12 }, // E Company
      { width: 12 }, // F STOCKS end of JUL 2026
      // Inbound Months (G - R)
      ...Array(12).fill({ width: 4 }),
      { width: 12 }, // S Total Inbound
      // Usage Months (T - AE)
      ...Array(12).fill({ width: 4 }),
      { width: 12 }, // AF Total Usage
      { width: 18 }, // AG Avg Monthly Usage 2026
      { width: 16 }, // AH Avg Monthly Usage
      { width: 12 }, // AI Safety Stock
      { width: 16 }, // AJ STOCKS end of JUL 2026
      { width: 14 }, // AK Securement Rate
      { width: 16 }, // AL Excess/Insufficient
      { width: 20 }, // AM Urgent Request
      { width: 20 }, // AN Order Quantity
    ];

    sheet.getRow(1).height = 36;
    sheet.getRow(2).height = 18;

    // 3. HEADERS SETUP (Rows 1 & 2)
    sheet.getRow(1).values = [
      "Part Number",
      "Specifications(Description)\n규격(설명)",
      "Category\n(유형)",
      "UNIT PRICE\n(Korean won)",
      "Company\n(업체)",
      "STOCKS end of JUL 2026",
      "INBOUND",
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
      "Total Inbound",
      "USAGE",
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
      "Total Usage\n(ea)",
      "Average Monthly Usage:\n2026 (12 mos)\n월평균사용량 2026 (12mos)",
      "Average monthly usage\n(월평균사용량)",
      "safety stock\n[안전재고]",
      "STOCKS end of JUL 2026(ea)",
      "Securement rate\n(확보율)",
      "Excess/Insufficient quantity\n(과부족수량)",
      "Urgent Request (Secure Rate Less than 50%)\n[긴급 요청(확보율 50%이하)]",
      "Order Quantity (Regular Order)\n[발주 수량(정기발주)]",
    ];

    // Sub-headers for Months
    const monthHeaders = [
      "JA",
      "FE",
      "M",
      "AP",
      "M",
      "JU",
      "JU",
      "AU",
      "SE",
      "OC",
      "NO",
      "DE",
    ];
    monthHeaders.forEach((month, idx) => {
      sheet.getCell(2, 7 + idx).value = month; // Cols G to R
      sheet.getCell(2, 20 + idx).value = month; // Cols T to AE
    });

    // Merge Header Cells
    [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "S",
      "AF",
      "AG",
      "AH",
      "AI",
      "AJ",
      "AK",
      "AL",
      "AM",
      "AN",
    ].forEach((col) => {
      sheet.mergeCells(`${col}1:${col}2`);
    });
    sheet.mergeCells("G1:R1"); // INBOUND
    sheet.mergeCells("T1:AE1"); // USAGE

    // 4. HEADER COLOR PALETTE & STYLES
    const COLOR_GRAY = "EFEFEF";
    const COLOR_GREEN_INBOUND = "D9EAD3";
    const COLOR_GREEN_TOTAL = "B6D7A8";
    const COLOR_ORANGE_USAGE = "FCE5CD";
    const COLOR_ORANGE_TOTAL = "F9CB9C";
    const COLOR_PURPLE_STOCKS = "E1D5E7";

    const bodyColumnColors: Record<string, string> = {
      F: "D9EAD3",
      S: "C6E0B4",
      AF: "FCE5CD",
      AG: "FCE5CD",
      AH: "EFEFEF",
      AI: "E1D5E7",
      AJ: "E1D5E7",
      AK: "E1D5E7",
      AL: "E1D5E7",
    };

    for (let col = 1; col <= 40; col++) {
      let bgHex = COLOR_GRAY;
      if (col >= 7 && col <= 18) bgHex = COLOR_GREEN_INBOUND;
      else if (col === 19) bgHex = COLOR_GREEN_TOTAL;
      else if (col >= 20 && col <= 31) bgHex = COLOR_ORANGE_USAGE;
      else if (col >= 32 && col <= 34) bgHex = COLOR_ORANGE_TOTAL;
      else if (col >= 35 && col <= 38) bgHex = COLOR_PURPLE_STOCKS;

      const styleCell = (cell: ExcelJS.Cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgHex },
        };
        cell.font = { bold: true, size: 8, name: "Calibri" };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      };

      styleCell(sheet.getCell(1, col));
      styleCell(sheet.getCell(2, col));
    }

    // 5. POPULATE DATA ROWS & FORMULAS
    const startRow = 3;
    items.forEach((item, idx) => {
      const r = startRow + idx;

      sheet.addRow([
        item.part_number,
        item.specification,
        item.category,
        item.unit_price,
        item.company,
        item.start_stock,

        // Inbound Months G - R
        item.inbound.JA || null,
        item.inbound.FE || null,
        item.inbound.M1 || null,
        item.inbound.AP || null,
        item.inbound.M2 || null,
        item.inbound.JU1 || null,
        item.inbound.JU2 || null,
        item.inbound.AU || null,
        item.inbound.SE || null,
        item.inbound.OC || null,
        item.inbound.NO || null,
        item.inbound.DE || null,

        null, // S: Total Inbound Formula

        // Usage Months T - AE
        item.usage.JA || null,
        item.usage.FE || null,
        item.usage.M1 || null,
        item.usage.AP || null,
        item.usage.M2 || null,
        item.usage.JU1 || null,
        item.usage.JU2 || null,
        item.usage.AU || null,
        item.usage.SE || null,
        item.usage.OC || null,
        item.usage.NO || null,
        item.usage.DE || null,

        null, // AF: Total Usage Formula
        null, // AG: Avg Monthly Usage Formula
        null, // AH: Static Avg
        item.safetyStock, // AI: Safety Stock
        null, // AJ: Stocks End of Month Formula
        null, // AK: Securement Rate Formula
        null, // AL: Excess/Shortage Formula
        null, // AM: Urgent Request Formula
        null, // AN: Order Qty Formula
      ]);

      // Dynamic Excel Formulas
      sheet.getCell(`S${r}`).value = { formula: `SUM(G${r}:R${r})` };
      sheet.getCell(`AF${r}`).value = { formula: `SUM(T${r}:AE${r})` };
      sheet.getCell(`AG${r}`).value = { formula: `AVERAGE(T${r}:AE${r})` };
      sheet.getCell(`AJ${r}`).value = { formula: `F${r}+S${r}-AF${r}` };
      sheet.getCell(`AK${r}`).value = {
        formula: `IF(AI${r}>0, AJ${r}/AI${r}, 0)`,
      };
      sheet.getCell(`AL${r}`).value = { formula: `AJ${r}-AI${r}` };
      sheet.getCell(`AM${r}`).value = {
        formula: `IF(AK${r}<0.5, ABS(AL${r}), 0)`,
      };
      sheet.getCell(`AN${r}`).value = {
        formula: `IF(AK${r}<1, ABS(AL${r}), 0)`,
      };
    });

    // 6. BODY CELL STYLING
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < 3) return;

      row.height = 18;

      row.eachCell((cell, colNumber) => {
        const colLetter = sheet.getColumn(colNumber).letter;

        cell.border = {
          top: { style: "thin", color: { argb: "D9D9D9" } },
          left: { style: "thin", color: { argb: "D9D9D9" } },
          bottom: { style: "thin", color: { argb: "D9D9D9" } },
          right: { style: "thin", color: { argb: "D9D9D9" } },
        };

        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 2 ? "left" : "center",
        };
        cell.font = { size: 9, name: "Calibri" };

        if (bodyColumnColors[colLetter]) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: bodyColumnColors[colLetter] },
          };
        }

        if (colLetter === "D") cell.numFmt = "#,##0"; // Currency format
        if (colLetter === "AK") cell.numFmt = "0%"; // Percentage format
      });
    });

    // 7. SEND RESPONSE
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=JUL_2026_SPARE_PARTS_SUMMARY.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export failed:", error);
    res.status(500).send("Internal Server Error");
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

//-----------------------------🗸
router.get("/monthly-summary/:id", async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);

    const year = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();

    // 1. Find Parent Asset
    const item = await PINSAsset.findByPk(assetId);

    if (!item) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    // 2. Fetch Inbound and Outbound logs for this asset
    const inbounds = await PINSAssetSerialInbound.findAll({
      where: { asset_id: assetId },
    });

    const outbounds = await PINSAssetSerialOutbound.findAll({
      where: { asset_id: assetId },
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

    // 3. Process INBOUNDs (Sums quantities by month)
    inbounds.forEach((entry: any) => {
      if (entry.inbound_date) {
        const date = new Date(entry.inbound_date);

        if (date.getFullYear() === year) {
          const month = months[date.getMonth()];
          const qty = Number(entry.inbound_quantity || 0);

          inbound[month] += qty;
          totalInbound += qty;
        }
      }
    });

    // 4. Process OUTBOUNDs (Sums quantities by month)
    outbounds.forEach((entry: any) => {
      if (entry.outbound_date) {
        const date = new Date(entry.outbound_date);

        if (date.getFullYear() === year) {
          const month = months[date.getMonth()];
          const qty = Number(entry.outbound_quantity || 0);

          outbound[month] += qty;
          totalOutbound += qty;

          if (qty > 0) {
            usedMonths.add(date.getMonth());
          }
        }
      }
    });

    // 5. Read current stock directly from item
    const currentStock = Number(item.stock || 0);

    // 6. Calculate Metrics using your helper function
    const metrics = calculateInventoryMetrics(
      currentStock,
      totalOutbound,
      usedMonths.size,
    );

    // 7. Return payload ready for UI table
    return res.json({
      item: {
        id: item.id,
        pin_name: item.pin_name,
        currentStock,
      },
      summary: {
        inbound: {
          ...inbound,
          TOTAL: totalInbound,
        },
        outbound: {
          ...outbound,
          TOTAL: totalOutbound,
        },
        totalInbound,
        totalOutbound,
        // Metrics calculated from helper function:
        averageMonthlyUsage: metrics.avgMonthlyUsage,
        safetyStock: metrics.safetyStock,
        securementRate: metrics.securementRate,
        excessShortage: metrics.excessShortage,
        regularOrderQty: metrics.regularOrderQty,
      },
    });
  } catch (error) {
    console.error("Failed to generate monthly summary:", error);

    return res.status(500).json({
      message: "Failed to generate monthly summary",
    });
  }
});

// Inbound Item Route (With Transaction Counter Adjustments) 🗸
router.post("/inbound", async (req, res) => {
  if (!PINSAsset.sequelize)
    return res.status(500).json({ message: "Database connection unavailable" });

  const transaction = await PINSAsset.sequelize.transaction();
  try {
    const {
      asset_id,
      lot_number,
      inbounding_personnel,
      inbound_quantity,
      inbound_date,
    } = req.body;

    const parentAsset = await PINSAsset.findByPk(asset_id, { transaction });
    if (!parentAsset) {
      await transaction.rollback();
      return res.status(404).json({ message: "Parent Asset ID not found" });
    }

    const serial = await PINSAssetSerialInbound.create(
      {
        asset_id,
        lot_number,
        inbounding_personnel,
        inbound_quantity,
        inbound_date,
      },
      { transaction },
    );

    parentAsset.stock =
      Number(parentAsset.stock || 0) + Number(inbound_quantity);
    await parentAsset.save({ transaction });

    await transaction.commit();
    return res.status(201).json(serial);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: "Failed to inbound pin" });
  }
});

// Outbound Deploy Route (With Transaction Counter Adjustments) 🗸
router.post("/outbound", async (req, res) => {
  if (!PINSAsset.sequelize) {
    return res.status(500).json({ message: "Database connection unavailable" });
  }

  const transaction = await PINSAsset.sequelize.transaction();

  try {
    const {
      asset_id,
      outbound_personnel,
      receiver,
      outbound_quantity,
      outbound_date,
    } = req.body;

    // Guard: Validate asset_id exists before proceeding
    const parsedAssetId = Number(asset_id);
    if (!asset_id || isNaN(parsedAssetId)) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Invalid or missing asset_id in request body" });
    }

    const qty = Number(outbound_quantity);

    // 1. Fetch parent asset using parsed ID
    const parentAsset = await PINSAsset.findByPk(parsedAssetId, {
      transaction,
    });
    if (!parentAsset) {
      await transaction.rollback();
      return res.status(404).json({ message: "Parent Asset ID not found" });
    }

    const currentStock = Number(parentAsset.stock || 0);

    // 2. Stock Guard
    if (qty > currentStock) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Insufficient stock! Remaining stock: ${currentStock}, requested: ${qty}`,
      });
    }

    // 3. Create outbound record
    const outboundRecord = await PINSAssetSerialOutbound.create(
      {
        asset_id: parsedAssetId, // Explicitly pass the validated number
        outbound_personnel,
        receiver,
        outbound_quantity: qty,
        outbound_date,
      },
      { transaction },
    );

    // 4. Deduct stock directly from parent asset
    parentAsset.stock = currentStock - qty;
    await parentAsset.save({ transaction });

    await transaction.commit();
    return res.status(201).json(outboundRecord);
  } catch (error) {
    await transaction.rollback();
    console.error("Outbound Error:", error);
    return res.status(500).json({ message: "Failed to outbound pin" });
  }
});

export default router;
