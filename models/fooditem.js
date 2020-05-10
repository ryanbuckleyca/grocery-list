'use strict';
module.exports = (sequelize, DataTypes) => {
  const FoodItem = sequelize.define('FoodItem', {
    name: DataTypes.STRING,
    status: DataTypes.STRING,
    category: DataTypes.STRING,
    note: DataTypes.TEXT
  }, {});
  FoodItem.associate = function(models) {
    // associations can be defined here
  };
  return FoodItem;
};