import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

import { sequelize } from "../config/sequelize";

class PINSAssetSerialInbound extends Model<
  InferAttributes<PINSAssetSerialInbound>,
  InferCreationAttributes<PINSAssetSerialInbound>
> {
  declare id: CreationOptional<number>;
  declare asset_id: number;
  declare lot_number: string | null;
  declare inbounding_personnel: string | null;
  declare inbound_quantity: number | null;
  declare inbound_date: Date | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PINSAssetSerialInbound.init(
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
    lot_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    inbounding_personnel: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    inbound_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    inbound_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    createdAt: {
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
    tableName: "pins_assets_inbound",
  },
);

export default PINSAssetSerialInbound;
