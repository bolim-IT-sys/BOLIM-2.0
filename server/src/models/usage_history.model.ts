import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";
import Spare from "./spare_parts.model";

//console.log("✅ usage history model loaded");

interface UsageHistoryAttributes {
  id: number;
  spare_part_id: number;
  quantity: number;
  usage_date: string; // DATEONLY maps cleanly to string in JS/TS
  created_at?: Date;
}

interface UsageHistoryCreationAttributes extends Optional<
  UsageHistoryAttributes,
  "id"
> {}

class UsageHistory
  extends Model<UsageHistoryAttributes, UsageHistoryCreationAttributes>
  implements UsageHistoryAttributes
{
  public id!: number;
  public spare_part_id!: number;
  public quantity!: number;
  public usage_date!: string;

  // Timestamps
  public readonly created_at!: Date;
}

UsageHistory.init(
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
    usage_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "usage_history",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

UsageHistory.belongsTo(Spare, {
  foreignKey: "spare_part_id",
});

export default UsageHistory;
