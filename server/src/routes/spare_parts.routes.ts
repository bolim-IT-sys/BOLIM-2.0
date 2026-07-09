import express, { Request, Response, Router } from "express";
import ExcelJS from "exceljs";
import { Op } from "sequelize";
import Spare from "../models/spare_parts.model";
import Category from "../models/category.model";
import InboundHistory from "../models/inbound_history.model";
import UsageHistory from "../models/usage_history.model";
import { sequelize } from "../config/sequelize";

const router: Router = express.Router();

// Define reusable local map type definitions
interface UsageMap {
  [partNumber: string]: {
    total_usage: number;
    months: Set<number>;
  };
}

interface SummaryMap {
  [partNumber: string]: {
    part_number: string;
    JAN: number;
    FEB: number;
    MAR: number;
    APR: number;
    MAY: number;
    JUN: number;
    JUL: number;
    AUG: number;
    SEP: number;
    OCT: number;
    NOV: number;
    DEC: number;
    total_inbound?: number;
    total_usage?: number;
    months_used_set?: Set<string>;
    avg_monthly_usage?: number | string;
    [key: string]: any; // Allows dynamic indexing with month strings
  };
}

// view category
router.get("/category", async (req: Request, res: Response) => {
  try {
    const records = await Category.findAll();
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// view
router.get("/view", async (req: Request, res: Response) => {
  try {
    const records = await Spare.findAll();

    const usageRecords = await UsageHistory.findAll({
      include: [
        {
          model: Spare,
          attributes: ["part_number"],
        },
      ],
    });

    const usageMap: UsageMap = {};

    usageRecords.forEach((record: any) => {
      const partNumber = record.Spare.part_number;
      const month = new Date(record.usage_date).getMonth();

      if (!usageMap[partNumber]) {
        usageMap[partNumber] = {
          total_usage: 0,
          months: new Set<number>(),
        };
      }

      usageMap[partNumber].total_usage += Number(record.quantity);
      usageMap[partNumber].months.add(month);
    });

    const result = records.map((part: any) => {
      const usage = usageMap[part.part_number];
      const totalUsage = usage?.total_usage || 0;
      const monthsUsed = usage?.months.size || 0;
      const avgMonthlyUsage = monthsUsed > 0 ? totalUsage / monthsUsed : 0;

      const safetyStock =
        Math.ceil(Math.max(avgMonthlyUsage * 2, 10) / 10) * 10;

      const securementRate =
        safetyStock > 1
          ? Number((Number(part.stock || 0) / safetyStock).toFixed(2))
          : 0;

      const excessShortage = Number(part.stock || 0) - safetyStock;

      const regularOrderQty =
        securementRate < 1 ? Math.ceil(-excessShortage / 10) * 10 : 0;

      return {
        ...part.toJSON(),
        avg_monthly_usage: Number(avgMonthlyUsage.toFixed(2)),
        safety_stock: safetyStock,
        securement_rate: securementRate,
        excess_shortage: excessShortage,
        regular_order_qty: regularOrderQty,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

router.post("/create", async (req: Request, res: Response) => {
  try {
    const record = await Spare.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create spare part" });
  }
});

router.put("/update/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await Spare.update(req.body, {
      where: { id },
    });

    const updatedRecord = await Spare.findByPk(id);
    res.json(updatedRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update part" });
  }
});

// Inbound API
router.post("/inbound", async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { part_number, quantity, inbound_date } = req.body;

    // validation
    if (!part_number || !quantity || !inbound_date) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // quantity validation
    if (Number(quantity) <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    // find part
    const part: any = await Spare.findOne({
      where: { part_number },
      transaction,
    });

    // part not found
    if (!part) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Part number does not exist",
      });
    }

    // update stock
    part.stock = Number(part.stock || 0) + Number(quantity);

    await part.save({ transaction });

    // save inbound history
    await InboundHistory.create(
      {
        spare_part_id: part.id,
        quantity,
        inbound_date,
      },
      { transaction },
    );

    // commit all changes
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Inbound successful",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Inbound History
router.get("/inbound-summary", async (req: Request, res: Response) => {
  try {
    const year = req.query.year || 2026;

    const records = await InboundHistory.findAll({
      include: [
        {
          model: Spare,
          attributes: ["part_number"],
        },
      ],
    });

    const result: SummaryMap = {};

    records.forEach((record: any) => {
      const date = new Date(record.inbound_date);
      const recordYear = date.getFullYear();

      if (recordYear != Number(year)) return;

      const month = date
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();

      const partNumber = record.Spare.part_number;

      if (!result[partNumber]) {
        result[partNumber] = {
          part_number: partNumber,
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
          total_inbound: 0,
        };
      }

      result[partNumber][month] += Number(record.quantity);
      result[partNumber].total_inbound! += Number(record.quantity);
    });

    res.json(Object.values(result));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
});

// Usage API
router.post("/usage", async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { part_number, quantity, usage_date } = req.body;

    if (!part_number || !quantity || !usage_date) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const part: any = await Spare.findOne({
      where: { part_number },
      transaction,
    });

    if (!part) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Part number not found",
      });
    }

    if (Number(part.stock) < Number(quantity)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    part.stock = Number(part.stock) - Number(quantity);
    await part.save({ transaction });

    await UsageHistory.create(
      {
        spare_part_id: part.id,
        quantity,
        usage_date,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Usage recorded",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Usage History
router.get("/usage-summary", async (req: Request, res: Response) => {
  try {
    const year = req.query.year || 2026;

    const records = await UsageHistory.findAll({
      include: [
        {
          model: Spare,
          attributes: ["part_number"],
        },
      ],
    });

    const result: SummaryMap = {};

    records.forEach((record: any) => {
      const date = new Date(record.usage_date);
      const recordYear = date.getFullYear();

      if (recordYear != Number(year)) return;

      const month = date
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();

      const partNumber = record.Spare.part_number;

      if (!result[partNumber]) {
        result[partNumber] = {
          months_used_set: new Set<string>(),
          avg_monthly_usage: 0,
          part_number: partNumber,
          JAN: 0,
          FEB: 0,
          MAR: 0,
          APR: 0,
          MAY: 0,
          JUN: 0,
          text: 0,
          JUL: 0,
          AUG: 0,
          SEP: 0,
          OCT: 0,
          NOV: 0,
          DEC: 0,
          total_usage: 0,
        };
      }

      result[partNumber][month] += Number(record.quantity);
      result[partNumber].total_usage! += Number(record.quantity);
      result[partNumber].months_used_set!.add(month);
    });

    Object.values(result).forEach((item) => {
      const monthsUsed = item.months_used_set!.size;

      item.avg_monthly_usage =
        monthsUsed > 0 ? (item.total_usage! / monthsUsed).toFixed(2) : 0;

      delete item.months_used_set;
    });

    res.json(Object.values(result));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
});

export default router;
