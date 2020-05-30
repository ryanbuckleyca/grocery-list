'use strict';

const db = require('./index')

module.exports = (sequelize, DataTypes) => {
  const Household = sequelize.define('Household', {
    name: DataTypes.STRING
  }, {});
  Household.associate = function(models) {
    Household.hasMany(
      models.FoodItem,
      { foreignKey: 'householdId' }
    )
  };
  return Household;
};