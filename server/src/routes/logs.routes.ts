import { Router } from "express";
import { getLogs } from "../controllers/logs.controller";

const router = Router();

// GET /api/logs
router.get("/logs", getLogs);

export default router;
