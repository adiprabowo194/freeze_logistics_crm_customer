import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";

const Carriers = sequelize.define(
  "Carriers",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    carrier_code: { type: DataTypes.STRING(100), unique: true },
    carrier_name: DataTypes.STRING(50),
    image_path: DataTypes.TEXT(),
    image_name: DataTypes.STRING(100),
    user_inp: DataTypes.STRING(100),
    is_active: { type: DataTypes.INTEGER, defaultValue: 1 },
  },
  {
    tableName: "carriers",
    timestamps: true,
    freezeTableName: true,
  },
);

export default Carriers;
