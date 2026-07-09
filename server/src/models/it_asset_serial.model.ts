import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

import { sequelize } from "../config/sequelize";

class ITAssetSerial extends Model<
  InferAttributes<ITAssetSerial>,
  InferCreationAttributes<ITAssetSerial>
> {
  declare id: CreationOptional<number>;

  declare asset_id: number;

  declare serial_number: string;

  declare pr_date: Date | null;

  declare received_date: Date | null;

  declare inbound_personnel: string | null;

  declare deployed_date: Date | null;

  declare station: string | null;

  declare department: string | null;

  declare authorized_personnel: string | null;

  declare receiver: string | null;

  declare outbound_personnel: string | null;

  declare reason: string | null;

  declare reasonFor: string | null;

  declare remarks: string;

  declare created_at: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ITAssetSerial.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    asset_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    serial_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },

    pr_date: DataTypes.DATEONLY,

    received_date: DataTypes.DATEONLY,

    inbound_personnel: DataTypes.STRING,

    deployed_date: DataTypes.DATEONLY,

    station: DataTypes.STRING,

    department: DataTypes.STRING,

    authorized_personnel: DataTypes.STRING,

    receiver: DataTypes.STRING,

    outbound_personnel: DataTypes.STRING,

    reason: DataTypes.TEXT,

    remarks: {
      type: DataTypes.ENUM(
        "BRAND NEW: AVAILABLE",
        "REPAIRED: AVAILABLE",
        "RETURNED: AVAILABLE",
        "DEPLOYED",
        "UNDER REPAIR",
        "UNDER WARRANTY",
        "ON HOLD",
        "DISPOSED",
      ),
      defaultValue: "BRAND NEW: AVAILABLE",
    },

    reasonFor: DataTypes.TEXT,

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "it_asset_serials",
    timestamps: true,
    createdAt: "created_at",
  },
);

export default ITAssetSerial;
