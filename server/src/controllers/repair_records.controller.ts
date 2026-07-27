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

    // 1. Handle "In Progress" -> Set started_date
    if (status === "In Progress" && !repair.started_date) {
      repair.started_date = new Date();
    }

    // 2. Require image ONLY if status is "Completed"
    if (
      status === "Completed" &&
      !repair.completed_date &&
      !req.file &&
      !repair.after_picture
    ) {
      return res.status(400).json({
        error: "After picture is required when repair is completed",
      });
    }

    // 3. Terminal states ("Completed" OR "Failed") -> Stamp completed_date
    if (status === "Completed" || status === "Failed") {
      // Set completed_date if not already set
      if (!repair.completed_date) {
        repair.completed_date = new Date();
      }

      // Attach after_picture if provided (even for failed ones if available)
      if (req.file) {
        repair.after_picture = `/uploads/repairs/${req.file.filename}`;
      }
    }

    // 4. Update basic fields & save
    repair.status = status || repair.status;
    repair.personnel = personnel || repair.personnel;

    await repair.save();

    return res.json(repair);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Update failed" });
  }
};
