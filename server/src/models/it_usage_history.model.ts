import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

interface ITUsageHistoryAttributes {
  id: number;
  asset_id: number;
  quantity: number;
  usage_date: string | Date; // DATEONLY is returned as an 'YYYY-MM-DD' string from Sequelize
  created_at?: Date;
}

interface ITUsageHistoryCreationAttributes extends Optional<
  ITUsageHistoryAttributes,
  "id"
> {}

class ITUsageHistory
  extends Model<ITUsageHistoryAttributes, ITUsageHistoryCreationAttributes>
  implements ITUsageHistoryAttributes
{
  public id!: number;
  public asset_id!: number;
  public quantity!: number;
  public usage_date!: string | Date;

  // Timestamps
  public readonly created_at!: Date;
}

ITUsageHistory.init(
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
    tableName: "it_usage_history",
    freezeTableName: true,
    timestamps: false,
  },
);

export default ITUsageHistory;
