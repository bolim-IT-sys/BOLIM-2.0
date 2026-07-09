import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize"; // Assumes database configuration file handles default export

//console.log("✅ it assests model loaded");

// 1. Define the complete attributes present in the database
interface ITAssetAttributes {
  id: number;
  item_name: string;
  specification: string | null;
  category: string | null;
  company: string | null;
  unit_price: number;
  stock: number;
  image: string | null;
  created_at?: Date;
}

// 2. Define attributes required to create a record (id is optional because it auto-increments)
interface ITAssetCreationAttributes extends Optional<
  ITAssetAttributes,
  "id" | "unit_price" | "stock"
> {}

// 3. Extend the Sequelize Model class
class ITAsset
  extends Model<ITAssetAttributes, ITAssetCreationAttributes>
  implements ITAssetAttributes
{
  public id!: number;
  public item_name!: string;
  public specification!: string | null;
  public category!: string | null;
  public company!: string | null;
  public unit_price!: number;
  public stock!: number;
  public image!: string | null;

  // Timestamps
  public readonly created_at!: Date;
}

// 4. Initialize the model schema mapping
ITAsset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    item_name: {
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
    tableName: "it_assets",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default ITAsset;
