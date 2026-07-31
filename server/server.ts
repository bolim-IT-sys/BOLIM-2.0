import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/auth.routes";
import dotenv from "dotenv";
import setupRoutes from "./src/routes/setup.routes";
import cors from "cors";
import { sequelize } from "./src/config/sequelize";
import "./src/models/associations";
import userRoutes from "./src/routes/user.routes";
import moduleRoutes from "./src/routes/module.routes";
import repairRoutes from "./src/routes/repair_records.routes";
import maintenanceRoutes from "./src/routes/maintenance_records.routes";
import movementRoutes from "./src/routes/movement.routes";
import spareRoutes from "./src/routes/spare_parts.routes";
import itInventoryRoutes from "./src/routes/it_inventory.routes";
import path from "path";
import itDashboardRoutes from "./src/routes/itdasboard.routes";
import logsRoute from "./src/routes/logs.routes";
import pinsInventory from "./src/routes/pins_inventory.routes";
import pinsDashboardRoutes from "./src/routes/pinsdashboard.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const projectRoot = process.cwd();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://172.17.49.40:5173",
      "http://172.17.49.40:8080",
    ],
    credentials: true,
  }),
);

//---------------------------------DEBUGGING ONLY!!! REMOVE ME AFTERWARDS
// app.use((req, res, next) => {
// console.log(req.method, req.url);
// next();
// });
//---------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/users", userRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/repairs", repairRoutes);
app.use(
  "/uploads/repairs",
  express.static(path.join(projectRoot, "src/uploads/repairs")),
);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/movement", movementRoutes);
app.use("/api/spare", spareRoutes);
app.use("/api/it-inventory", itInventoryRoutes, itDashboardRoutes);
app.use("/uploads", express.static(path.join(projectRoot, "src/uploads")));
//console.log("STATIC PATH:", path.join(__dirname, "uploads"));
app.use("/api", logsRoute);
app.use("/api/pins-inventory", pinsInventory, pinsDashboardRoutes);
app.get("/", (req, res) => {
  res.send("IT Inventory API Running");
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // before prod app.listen(PORT, () => {
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
      // before prod http://localhost:${PORT}
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
