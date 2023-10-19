'use strict';

const Household = require('./household')

module.exports = (sequelize, DataTypes) => {
  const FoodItem = sequelize.define('FoodItem', {
    name: DataTypes.STRING,
    status: DataTypes.STRING,
    category: DataTypes.STRING,
    note: DataTypes.TEXT,
    householdId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {});
  FoodItem.associate = function(models) {
    FoodItem.belongsTo(
      models.Household,
      { foreignKey: 'householdId' }
    )
  };
  return FoodItem;
};
