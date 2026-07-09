import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

//console.log("✅ spare parts model loaded");

interface SpareAttributes {
  id: number;
  category_id: number | null;
  part_number: string | null;
  product_name: string | null;
  num: number | null;
  specification: string | null;
  maker: string | null;
  stock: number | null;
  unit_price: number | null;
  remarks: string | null;
  app_holder: string | null;
  category: string | null;
  created_at?: Date;
}

interface SpareCreationAttributes extends Optional<SpareAttributes, "id"> {}

class Spare
  extends Model<SpareAttributes, SpareCreationAttributes>
  implements SpareAttributes
{
  public id!: number;
  public category_id!: number | null;
  public part_number!: string | null;
  public product_name!: string | null;
  public num!: number | null;
  public specification!: string | null;
  public maker!: string | null;
  public stock!: number | null;
  public unit_price!: number | null;
  public remarks!: string | null;
  public app_holder!: string | null;
  public category!: string | null;

  // Timestamps
  public readonly created_at!: Date;
}

Spare.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    part_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    product_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    num: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    specification: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maker: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    app_holder: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "spare_parts",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default Spare;
