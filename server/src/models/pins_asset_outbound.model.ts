import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize";

class PINSAssetSerialOutbound extends Model {
  public id!: number;
  public asset_id!: number;
  public outbound_personnel!: string | null;
  public receiver!: string | null;
  public outbound_quantity!: number;
  public outbound_date!: Date;
  public createdAt!: Date;
}

PINSAssetSerialOutbound.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "asset_id",
    },
    outbound_personnel: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    receiver: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    outbound_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    outbound_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "pins_assets_outbound",
    freezeTableName: true,
    timestamps: true,
  },
);

export default PINSAssetSerialOutbound;
