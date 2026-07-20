// models/AuditLog.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize";

export class AuditLog extends Model {
  public id!: number;
  public username!: string;
  public action!: string; // "CREATE", "UPDATE", "DELETE", "TOGGLE_STATUS"
  public details!: string; // "Changed Dell Laptop stock from 10 to 15"
  public readonly createdAt!: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, modelName: "audit_logs" },
);
