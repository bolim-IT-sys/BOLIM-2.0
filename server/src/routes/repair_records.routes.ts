import express, { Request, Response, Router } from "express";
import { Op } from "sequelize";
import Repair from "../models/repair_records.model";
import { upload } from "../middlewares/repairUploads";
import { updateRepair } from "../controllers/repair_records.controller";

const router: Router = express.Router();

// CREATE repair
router.post(
  "/",
  upload.fields([
    { name: "before_picture", maxCount: 1 },
    { name: "after_picture", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { serial_number } = req.body;

      const existing = await Repair.findOne({
        where: {
          serial_number,
          status: { [Op.in]: ["pending", "in_progress"] },
        },
      });

      if (existing) {
        return res.status(400).json({
          error: "This item is already under repair",
        });
      }

      const formatDateTime = (value: any): string | null => {
        if (!value) return null;
        const date = new Date(value);
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60000);
        return local.toISOString().slice(0, 19).replace("T", " ");
      };

      // Typecast req.files to handle Multer's fields layout safely
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;

      const repair = await Repair.create({
        serial_number: req.body.serial_number,
        reported_date: formatDateTime(req.body.reported_date),
        started_date: formatDateTime(req.body.started_date),
        completed_date: formatDateTime(req.body.completed_date),
        issue_description: req.body.issue_description,
        status: req.body.status,
        personnel: req.body.personnel,

        before_picture: files?.["before_picture"]?.[0]
          ? `/uploads/repairs/${files["before_picture"][0].filename}`
          : null,

        after_picture: files?.["after_picture"]?.[0]
          ? `/uploads/repairs/${files["after_picture"][0].filename}`
          : null,
      });

      return res.status(201).json(repair);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create repair" });
    }
  },
);

// GET all repairs
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const repairs = await Repair.findAll();
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch repairs" });
  }
});

// GET by serial
router.get("/:serial", async (req: Request, res: Response): Promise<void> => {
  try {
    const { serial } = req.params;

    const repairs = await Repair.findAll({
      where: { serial_number: serial },
      order: [["reported_date", "DESC"]],
    });

    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch repairs" });
  }
});

// Update history
router.put("/:id", upload.single("after_picture"), updateRepair);

export default router;
