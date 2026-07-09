import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";
import Spare from "./spare_parts.model";

//console.log("✅ inbound history model loaded");

interface InboundHistoryAttributes {
  id: number;
  spare_part_id: number;
  quantity: number;
  inbound_date: string; // DATEONLY maps to string in JavaScript/TypeScript
  created_at?: Date;
}

interface InboundHistoryCreationAttributes extends Optional<
  InboundHistoryAttributes,
  "id"
> {}

class InboundHistory
  extends Model<InboundHistoryAttributes, InboundHistoryCreationAttributes>
  implements InboundHistoryAttributes
{
  public id!: number;
  public spare_part_id!: number;
  public quantity!: number;
  public inbound_date!: string;

  // Timestamps
  public readonly created_at!: Date;
}

InboundHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    spare_part_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    inbound_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "inbound_history",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

InboundHistory.belongsTo(Spare, {
  foreignKey: "spare_part_id",
});

export default InboundHistory;
