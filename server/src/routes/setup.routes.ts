import { Router } from "express";
import { createSuperAdmin } from "../controllers/superAdmin";

const router = Router();

router.post("/superadmin", createSuperAdmin);

export default router;
