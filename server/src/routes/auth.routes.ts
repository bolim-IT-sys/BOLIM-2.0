import { Router } from "express";
import { login } from "../controllers/auth/login";
import { logout } from "../controllers/auth/logout";
import { refresh } from "../controllers/auth/refresh";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);

export default router;
