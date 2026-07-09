import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { getModules } from "../controllers/module/getModules";

const router = Router();

router.use(authenticate);

router.get("/", getModules);

export default router;
