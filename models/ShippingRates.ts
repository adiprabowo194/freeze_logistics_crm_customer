import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";

const ShippingRates = sequelize.define(
  "ShippingRates",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_code: { type: DataTypes.STRING(20), allowNull: false },
    carrier_code: { type: DataTypes.STRING(20), allowNull: false }, // Foreign Key ke Carriers
    pickup_type: { type: DataTypes.INTEGER, defaultValue: 1 },
    origin_state: DataTypes.STRING(5),
    dest_state: DataTypes.STRING(5),
    zone_type: DataTypes.ENUM("METRO", "REGIONAL", "ANY"),
    package_type: DataTypes.ENUM("box", "pallet"),
    carrier_price: DataTypes.DECIMAL(15, 2),
    next_price_carrier: DataTypes.DECIMAL(15, 2),
    unit_threshold: { type: DataTypes.INTEGER, defaultValue: 1 },
    margin_fuel_levy: DataTypes.DECIMAL(15, 2),
    margin_percent: DataTypes.DECIMAL(5, 2),
    markup_fixed: DataTypes.DECIMAL(15, 2),
    tax_percent: DataTypes.DECIMAL(5, 2),
  },
  {
    tableName: "shipping_rates",
    timestamps: true,
    freezeTableName: true,
  },
);

export default ShippingRates;
