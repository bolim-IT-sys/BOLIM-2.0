import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

interface PINSAssetAttributes {
  id: number;
  pin_name: string;
  specification: string | null;
  category: string | null;
  company: string | null;
  unit_price: number;
  stock: number;
  image: string | null;
  created_at?: Date;
}

interface PINSAssetCreationAttributes extends Optional<
  PINSAssetAttributes,
  "id" | "unit_price" | "stock"
> {}

class PINSAsset
  extends Model<PINSAssetAttributes, PINSAssetCreationAttributes>
  implements PINSAssetAttributes
{
  public id!: number;
  public pin_name!: string;
  public specification!: string | null;
  public category!: string | null;
  public company!: string | null;
  public unit_price!: number;
  public stock!: number;
  public image!: string | null;

  // Timestamps
  public readonly created_at!: Date;
}

PINSAsset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pin_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specification: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      get() {
        // Decimal fields return as strings in Sequelize. This ensures TS treats it as a number safely.
        const value = this.getDataValue("unit_price");
        return value ? Number(value) : 0;
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "pins_assets",
    freezeTableName: true,
    timestamps: true,
    updatedAt: false,
  },
);

export default PINSAsset;
