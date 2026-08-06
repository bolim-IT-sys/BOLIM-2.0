import { Router } from "express";
import ITAsset from "../models/it_assets.model";
import ITAssetSerial from "../models/it_asset_serial.model";
import { calculateInventoryMetrics } from "../utils/metricsHelper";
import { calculateAssetUsage } from "../utils/usageHelpers";
import { fn, col, Op } from "sequelize";

const router = Router();

router.get("/dashboard/kpis", async (req, res) => {
  try {
    const year = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();
    const assets = await ITAsset.findAll();

    let totalAssets = assets.length;
    let currentStocks = 0;
    let lowStocks = 0;
    let inventoryValue = 0;

    // Use for...of loop to handle async database queries inside the loop safely
    for (const item of assets) {
      const stock = Number(item.stock) || 0;
      const unitPrice = Number(item.unit_price) || 0;

      // 1. Fetch serials for this specific asset
      const serials = await ITAssetSerial.findAll({
        where: { asset_id: item.id },
      });

      // 2. Extract usage metrics using our new helper
      const { totalUsage, monthsUsed } = calculateAssetUsage(serials, year);

      // 3. Feed those stats into your original metrics helper!
      const metrics = calculateInventoryMetrics(stock, totalUsage, monthsUsed);

      // 4. Aggregate dashboard totals
      currentStocks += stock;
      inventoryValue += stock * unitPrice;

      // Dynamic check using your custom formula's safety stock
      if (stock <= metrics.safetyStock) {
        lowStocks++;
      }
    }

    res.json({
      totalAssets,
      currentStocks,
      lowStocks,
      inventoryValue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/dashboard/monthly", async (req, res) => {
  try {
    const year = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch ONLY records that fall within the requested year
    const records = await ITAssetSerial.findAll({
      where: {
        [Op.or]: [
          { received_date: { [Op.between]: [startOfYear, endOfYear] } },
          { deployed_date: { [Op.between]: [startOfYear, endOfYear] } },
        ],
      },
    });

    const inbound = Array(12).fill(0);
    const outbound = Array(12).fill(0);

    records.forEach((record) => {
      if (record.received_date) {
        const date = new Date(record.received_date);
        if (date.getFullYear() === year) {
          inbound[date.getMonth()]++;
        }
      }

      if (record.deployed_date) {
        const date = new Date(record.deployed_date);
        if (date.getFullYear() === year) {
          outbound[date.getMonth()]++;
        }
      }
    });

    res.json({
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      inbound,
      outbound,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/dashboard/status-distribution", async (req, res) => {
  const serials = await ITAssetSerial.findAll();

  const summary: Record<string, number> = {};

  serials.forEach((serial) => {
    const status = serial.remarks || "Unknown";

    summary[status] = (summary[status] || 0) + 1;
  });

  res.json(summary);
});

router.get("/dashboard/low-stocks", async (req, res) => {
  try {
    const year = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();
    const assets = await ITAsset.findAll();

    const assetsWithDynamicMetrics = [];

    // 1. Calculate dynamic safety stock for every asset
    for (const item of assets) {
      const stock = Number(item.stock) || 0;

      // Fetch serials to calculate dynamic usage
      const serials = await ITAssetSerial.findAll({
        where: { asset_id: item.id },
      });
      const { totalUsage, monthsUsed } = calculateAssetUsage(serials, year);

      // Get metrics from your helper formula
      const metrics = calculateInventoryMetrics(stock, totalUsage, monthsUsed);

      // Push a combined object so we can filter/sort by the dynamic safetyStock
      assetsWithDynamicMetrics.push({
        ...item.toJSON(), // Converts Sequelize instance to plain JS object
        dynamicSafetyStock: metrics.safetyStock,
        regularOrderQty: metrics.regularOrderQty, // Useful addition for a low-stock list!
      });
    }

    // 2. Filter, sort, and slice using the freshly calculated metrics
    const lowStocks = assetsWithDynamicMetrics
      .filter((item) => Number(item.stock) <= item.dynamicSafetyStock)
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 10);

    res.json(lowStocks);
  } catch (error) {
    console.error("Error fetching low stock assets:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/dashboard/activities", async (req, res) => {
  const records = await ITAssetSerial.findAll({
    order: [["updatedAt", "DESC"]],
    limit: 10,
  });

  const activities = records.map((record) => ({
    text: record.deployed_date
      ? `${record.serial_number} deployed`
      : `${record.serial_number} received`,
    time: record.updatedAt,
    type: record.deployed_date ? "outbound" : "inbound",
  }));

  res.json(activities);
});

router.get("/dashboard/category-stocks", async (req, res) => {
  try {
    const data = await ITAsset.findAll({
      attributes: ["category", [fn("SUM", col("stock")), "count"]],
      group: ["category"],
      raw: true,
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to load category stocks",
    });
  }
});

export default router;
