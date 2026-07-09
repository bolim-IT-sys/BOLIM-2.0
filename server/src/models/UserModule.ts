import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize";

export class UserModule extends Model {}

UserModule.init(
  {
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },

    moduleId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: "user_modules",
    timestamps: false,
  },
);
