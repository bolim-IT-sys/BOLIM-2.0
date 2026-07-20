import { Request, Response } from "express";
import { AuditLog } from "../models/AuditLogs";

export const getLogs = async (req: Request, res: Response) => {
  try {
    const logs = await AuditLog.findAll({
      // 🔄 Return newest activity logs first
      order: [["createdAt", "DESC"]],
      limit: 500, // Safety limit to prevent memory spikes
    });

    return res.json(logs);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return res.status(500).json({ message: "Failed to retrieve logs" });
  }
};
