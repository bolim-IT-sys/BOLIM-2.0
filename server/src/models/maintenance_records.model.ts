import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

//console.log("✅ Maintenance model loaded");

export interface MaintenanceAttributes {
  id: number;
  date: string | null;
  formNumber: string | null;
  line: string | null;
  process: string | null;
  code: string | null;
  phenomenon: string | null;
  detail: string | null;
  material: string | null;
  qty: number | null;
  occurTime: string | null;
  finishTime: string | null;
  downTime: number | null;
  incharge: string | null;
  shift: string | null;
  type: string | null;
  labelSN: string | null;
  holderNumber: string | null;
  pin: string | null;
  pinSpec: string | null;
  pinHeight: string | null;
  pinDeformation: string | null;
  pinSpring: string | null;
  kyungshinLabel: string | null;
  remarks: string | null;
}

export interface MaintenanceCreationAttributes extends Optional<
  MaintenanceAttributes,
  "id"
> {}

class Maintenance
  extends Model<MaintenanceAttributes, MaintenanceCreationAttributes>
  implements MaintenanceAttributes
{
  public id!: number;
  public date!: string | null;
  public formNumber!: string | null;
  public line!: string | null;
  public process!: string | null;
  public code!: string | null;
  public phenomenon!: string | null;
  public detail!: string | null;
  public material!: string | null;
  public qty!: number | null;
  public occurTime!: string | null;
  public finishTime!: string | null;
  public downTime!: number | null;
  public incharge!: string | null;
  public shift!: string | null;
  public type!: string | null;
  public labelSN!: string | null;
  public holderNumber!: string | null;
  public pin!: string | null;
  public pinSpec!: string | null;
  public pinHeight!: string | null;
  public pinDeformation!: string | null;
  public pinSpring!: string | null;
  public kyungshinLabel!: string | null;
  public remarks!: string | null;
}

Maintenance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    formNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    line: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    process: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phenomenon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    detail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    material: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { isInt: true },
    },
    occurTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    finishTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    downTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { isInt: true, min: 0 },
    },
    incharge: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    shift: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    labelSN: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    holderNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pin: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pinSpec: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pinHeight: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pinDeformation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pinSpring: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    kyungshinLabel: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "maintenance_records",
    freezeTableName: true,
    timestamps: false,
  },
);

export default Maintenance;
