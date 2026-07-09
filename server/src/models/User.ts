import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize";
import { Module } from "./Module";

export class User extends Model {
  declare id: number;
  declare username: string;
  declare passwordHash: string;
  declare role: string;
  declare active: boolean;
  declare modules?: Module[];
}

User.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "password_hash", // if your DB column is password_hash
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    createdAt: "created_at",
    updatedAt: false,
  },
);
