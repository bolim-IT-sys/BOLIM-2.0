import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

//console.log("✅ Movement model loaded");

interface MovementAttributes {
  id: number;
  personnel: string;
  date: Date | string;
  description: string;
  serial: string;
  quantity: number;
  from: string;
  to: string;
  condition: string;
  remarks: string;
}

interface MovementCreationAttributes extends Optional<
  MovementAttributes,
  "id"
> {}

class Movement
  extends Model<MovementAttributes, MovementCreationAttributes>
  implements MovementAttributes
{
  public id!: number;
  public personnel!: string;
  public date!: Date | string;
  public description!: string;
  public serial!: string;
  public quantity!: number;
  public from!: string;
  public to!: string;
  public condition!: string;
  public remarks!: string;
}

Movement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    personnel: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    serial: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    from: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    to: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    condition: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize, // Pass the connection instance
    tableName: "equipment_movement",
    freezeTableName: true,
    timestamps: false,
  },
);

export default Movement;
