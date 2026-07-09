import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

//console.log("✅ category model loaded");

interface CategoryAttributes {
  id: number;
  name: string | null;
}

interface CategoryCreationAttributes extends Optional<
  CategoryAttributes,
  "id"
> {}

class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: number;
  public name!: string | null;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "categories",
    freezeTableName: true,
    timestamps: false,
  },
);

export default Category;
