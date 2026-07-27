import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

interface RepairAttributes {
  id: number;
  serial_number: string | null;
  reported_date: Date | string | null;
  issue_description: string;
  status: "Pending" | "In Progress" | "Completed" | "Failed";
  started_date: Date | string | null;
  completed_date: Date | string | null;
  personnel: string | null;
  before_picture: string | null;
  after_picture: string | null;
  created_at?: Date;
  updatedAt?: Date;
}

interface RepairCreationAttributes extends Optional<
  RepairAttributes,
  | "id"
  | "status"
  | "serial_number"
  | "reported_date"
  | "started_date"
  | "completed_date"
  | "personnel"
  | "before_picture"
  | "after_picture"
> {}

class Repair
  extends Model<RepairAttributes, RepairCreationAttributes>
  implements RepairAttributes
{
  public id!: number;
  public serial_number!: string | null;
  public reported_date!: Date | string | null;
  public issue_description!: string;
  public status!: "Pending" | "In Progress" | "Completed" | "Failed";
  public started_date!: Date | string | null;
  public completed_date!: Date | string | null;
  public personnel!: string | null;
  public before_picture!: string | null;
  public after_picture!: string | null;

  public readonly created_at!: Date;
  public readonly updatedAt!: Date;
}

Repair.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    serial_number: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    reported_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    issue_description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM("Pending", "In Progress", "Completed", "Failed"),
      allowNull: false,
      defaultValue: "Pending",
    },
    started_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    personnel: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    before_picture: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    after_picture: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "repair_records",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
  },
);

export default Repair;
