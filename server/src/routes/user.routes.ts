import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { getUsers } from "../controllers/user/getUsers";
import { createUser } from "../controllers/user/createUser";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin";
import { getCurrentUser } from "../controllers/user/getCurrentUser";

const router = Router();

router.use(authenticate);

router.get("/me", getCurrentUser);
router.get("/", getUsers);
router.post("/", requireSuperAdmin, createUser);

export default router;
