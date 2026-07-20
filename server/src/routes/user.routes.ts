import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { getUsers } from "../controllers/user/getUsers";
import { createUser } from "../controllers/user/createUser";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin";
import { getCurrentUser } from "../controllers/user/getCurrentUser";
import { updateUser } from "../controllers/user/updateUser";
import { toggleUserStatus } from "../controllers/user/userStatus";

const router = Router();

router.use(authenticate);

router.get("/me", getCurrentUser);
router.get("/", getUsers);
router.post("/", requireSuperAdmin, createUser);
router.put("/:id", requireSuperAdmin, updateUser);
router.patch("/:id/status", requireSuperAdmin, toggleUserStatus);

export default router;
