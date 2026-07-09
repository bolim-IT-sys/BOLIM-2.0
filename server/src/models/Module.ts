import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize";

export class Module extends Model {
  declare id: number;
  declare code: string;
  declare name: string;
}

Module.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "modules",
    timestamps: false,
  },
);
