const csv = require('csvtojson')
const db = require('../models')

const importCsv = async () => {
  const foodItems = await csv().fromFile('./data.csv')
  console.log(foodItems)

  const household = await db.Household.create({
    name: '311'
  })

  foodItems.forEach(async foodItem => {
    await db.FoodItem.create(
      {
        name: foodItem.FOOD,
        status: foodItem.STATUS,
        category: foodItem.CATEGORY,
        householdId: household.id
      }
    )
    console.log("CREATED: ", foodItem)
  })
}

(async () => await importCsv())()
