import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

interface PinsUsageHistoryAttributes {
  id: number;
  asset_id: number;
  quantity: number;
  usage_date: string | Date; // DATEONLY is returned as an 'YYYY-MM-DD' string from Sequelize
  created_at?: Date;
}

interface PinsUsageHistoryCreationAttributes extends Optional<
  PinsUsageHistoryAttributes,
  "id"
> {}

class PinsUsageHistory
  extends Model<PinsUsageHistoryAttributes, PinsUsageHistoryCreationAttributes>
  implements PinsUsageHistoryAttributes
{
  public id!: number;
  public asset_id!: number;
  public quantity!: number;
  public usage_date!: string | Date;

  // Timestamps
  public readonly created_at!: Date;
}

PinsUsageHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    asset_id: {
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
    tableName: "pins_usage_history",
    freezeTableName: true,
    timestamps: false,
  },
);

export default PinsUsageHistory;
