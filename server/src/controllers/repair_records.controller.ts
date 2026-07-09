import { Request, Response } from "express";
import Repair from "../models/repair_records.model";

export const updateRepair = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const repair = await Repair.findByPk(Number(req.params.id));

    if (!repair) {
      return res.status(404).json({ error: "Repair not found" });
    }

    const { status, personnel } = req.body;

    // Auto dates
    if (status === "in_progress" && !repair.started_date) {
      repair.started_date = new Date();
    }

    if (
      status === "completed" &&
      !repair.completed_date &&
      !req.file &&
      !repair.after_picture
    ) {
      return res.status(400).json({
        error: "After picture is required when repair is completed",
      });
    }

    if (status === "completed") {
      repair.completed_date = new Date();

      if (req.file) {
        repair.after_picture = `/uploads/repairs/${req.file.filename}`;
      }
    }

    repair.status = status || repair.status;
    repair.personnel = personnel || repair.personnel;

    await repair.save();

    return res.json(repair);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Update failed" });
  }
};
