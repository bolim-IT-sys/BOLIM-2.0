import { Router } from "express";
import ITAsset from "../models/it_assets.model";
import ITAssetSerial from "../models/it_asset_serial.model";
import { calculateInventoryMetrics } from "../utils/metricsHelper";
import { calculateAssetUsage } from "../utils/usageHelpers";
import { fn, col } from "sequelize";
import PINSAsset from "../models/pins_assets.model";
import PINSAssetSerialInbound from "../models/pins_asset_inbound.model";
import PINSAssetSerialOutbound from "../models/pins_asset_outbound.model";

const router = Router();

router.get("/dashboard/kpis", async (req, res) => {
  try {
    const year = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();

    // 1. Fetch all PIN assets and outbound transaction records
    const assets = await PINSAsset.findAll();
    const outboundRecords = await PINSAssetSerialOutbound.findAll();

    const totalAssets = assets.length;
    let currentStocks = 0;
    let lowStocks = 0;
    let inventoryValue = 0;

    // 2. Iterate through assets to calculate KPI aggregates
    for (const item of assets) {
      const stock = Number(item.stock) || 0;
      const unitPrice = Number(item.unit_price) || 0;

      // Accumulate totals
      currentStocks += stock;
      inventoryValue += stock * unitPrice;

      // Filter outbound transactions for this asset and requested year
      const assetOutbounds = outboundRecords.filter((record) => {
        if (record.asset_id !== item.id) return false;
        const dateVal = record.outbound_date || record.createdAt;
        if (!dateVal) return false;
        return new Date(dateVal).getFullYear() === year;
      });

      // Calculate total usage and active usage months for safety stock evaluation
      const activeMonths = new Set<number>();
      let totalUsage = 0;

      assetOutbounds.forEach((record) => {
        const qty = Number(record.outbound_quantity) || 1;
        totalUsage += qty;

        const dateVal = record.outbound_date || record.createdAt;
        if (dateVal) {
          activeMonths.add(new Date(dateVal).getMonth());
        }
      });

      const monthsUsed = activeMonths.size > 0 ? activeMonths.size : 1;
      const avgMonthlyUsage = totalUsage / monthsUsed;

      // Dynamic Safety Stock calculation (ceiling of average monthly usage)
      const dynamicSafetyStock = Math.ceil(avgMonthlyUsage);

      // Check if item is in low stock condition
      if (stock <= dynamicSafetyStock) {
        lowStocks++;
      }
    }

    // 3. Return summary KPIs
    res.json({
      totalAssets,
      currentStocks,
      lowStocks,
      inventoryValue,
    });
  } catch (error) {
    console.error("Error calculating PINS dashboard KPIs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//🗸
router.get("/dashboard/monthly", async (req, res) => {
  try {
    // 1. Fetch all records from both tables
    const inbounds = await PINSAssetSerialInbound.findAll();
    const outbounds = await PINSAssetSerialOutbound.findAll();

    const inbound = Array(12).fill(0);
    const outbound = Array(12).fill(0);

    // 2. Sum inbound quantities by month
    inbounds.forEach((record) => {
      const dateVal = record.inbound_date || record.createdAt;
      if (dateVal) {
        const monthIndex = new Date(dateVal).getMonth(); // 0 to 11
        if (monthIndex >= 0 && monthIndex < 12) {
          const qty = Number(record.inbound_quantity) || 1;
          inbound[monthIndex] += qty;
        }
      }
    });

    // 3. Sum outbound quantities by month
    outbounds.forEach((record) => {
      const dateVal = record.outbound_date || record.createdAt;
      if (dateVal) {
        const monthIndex = new Date(dateVal).getMonth(); // 0 to 11
        if (monthIndex >= 0 && monthIndex < 12) {
          const qty = Number(record.outbound_quantity) || 1;
          outbound[monthIndex] += qty;
        }
      }
    });

    // 4. Return formatted JSON response for chart rendering
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
    console.error("Error generating monthly dashboard stats:", error);
    res.status(500).json({ message: "Failed to load monthly statistics" });
  }
});
//🗸
router.get("/dashboard/low-stocks", async (req, res) => {
  try {
    const year = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();

    // 1. Fetch all PIN assets and all Outbound records
    const assets = await PINSAsset.findAll();
    const outboundRecords = await PINSAssetSerialOutbound.findAll();

    const lowStocks = [];

    for (const item of assets) {
      const stock = Number(item.stock) || 0;

      // 2. Filter outbound records for this specific asset & year
      const assetOutbounds = outboundRecords.filter((record) => {
        if (record.asset_id !== item.id) return false;
        const dateVal = record.outbound_date || record.createdAt;
        if (!dateVal) return false;
        return new Date(dateVal).getFullYear() === year;
      });

      // 3. Calculate total usage and active usage months for the target year
      const activeMonths = new Set<number>();
      let totalUsage = 0;

      assetOutbounds.forEach((record) => {
        const qty = Number(record.outbound_quantity) || 1;
        totalUsage += qty;

        const dateVal = record.outbound_date || record.createdAt;
        if (dateVal) {
          activeMonths.add(new Date(dateVal).getMonth());
        }
      });

      // Default to 1 to avoid division by zero
      const monthsUsed = activeMonths.size > 0 ? activeMonths.size : 1;

      // 4. Calculate dynamic metrics inline
      const avgMonthlyUsage = totalUsage / monthsUsed;
      // Example: Setting safety stock based on 1 month's average usage (adjust multiplier if needed)
      const dynamicSafetyStock = Math.ceil(avgMonthlyUsage);
      const regularOrderQty = Math.max(0, dynamicSafetyStock - stock);

      // 5. Filter for items at or below their safety stock threshold
      if (stock <= dynamicSafetyStock) {
        lowStocks.push({
          ...item.toJSON(),
          totalUsage,
          avgMonthlyUsage: Math.round(avgMonthlyUsage * 10) / 10,
          dynamicSafetyStock,
          regularOrderQty,
        });
      }
    }

    // 6. Sort by lowest remaining stock first and limit to top 10
    lowStocks.sort((a, b) => Number(a.stock) - Number(b.stock));

    res.json(lowStocks.slice(0, 10));
  } catch (error) {
    console.error("Error fetching low stock PIN assets:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//🗸
router.get("/dashboard/activities", async (req, res) => {
  try {
    // 1. Fetch latest 10 Inbound & Outbound records
    const inbounds = await PINSAssetSerialInbound.findAll({
      order: [["inbound_date", "DESC"]],
      limit: 10,
    });

    const outbounds = await PINSAssetSerialOutbound.findAll({
      order: [["outbound_date", "DESC"]],
      limit: 10,
    });

    // 2. Extract asset IDs and fetch matching Assets in one query
    const assetIds = [
      ...new Set([
        ...inbounds.map((i) => i.asset_id),
        ...outbounds.map((o) => o.asset_id),
      ]),
    ];

    const assets = await PINSAsset.findAll({
      where: { id: assetIds },
      attributes: ["id", "pin_name"],
    });

    // Map for quick ID -> pin_name lookup
    const assetMap = new Map(assets.map((a) => [a.id, a.pin_name]));

    // 3. Format Inbound activities
    const inboundActivities = inbounds.map((record) => {
      const pinName =
        assetMap.get(record.asset_id) || `Asset #${record.asset_id}`;
      const qty = record.inbound_quantity || 1;
      const lot = record.lot_number ? ` (Lot: ${record.lot_number})` : "";

      return {
        id: `in-${record.id}`,
        text: `${pinName} Inbound (${qty} pcs)${lot}`,
        time: record.inbound_date || record.createdAt,
        type: "inbound",
        personnel: record.inbounding_personnel,
      };
    });

    // 4. Format Outbound activities
    const outboundActivities = outbounds.map((record) => {
      const pinName =
        assetMap.get(record.asset_id) || `Asset #${record.asset_id}`;
      const qty = record.outbound_quantity || 1;
      const rcv = record.receiver ? ` to ${record.receiver}` : "";

      return {
        id: `out-${record.id}`,
        text: `${pinName} Outbound (${qty} pcs)${rcv}`,
        time: record.outbound_date || record.createdAt,
        type: "outbound",
        personnel: record.outbound_personnel,
      };
    });

    // 5. Merge, sort chronologically, and take top 10
    const activities = [...inboundActivities, ...outboundActivities]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);

    res.json(activities);
  } catch (error) {
    console.error("Error fetching dashboard activities:", error);
    res.status(500).json({ message: "Failed to fetch dashboard activities" });
  }
});
//🗸
router.get("/dashboard/category-stocks", async (req, res) => {
  try {
    const data = await PINSAsset.findAll({
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
