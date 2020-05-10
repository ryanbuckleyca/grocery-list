const csv = require('csvtojson')
const db = require('../models')

const importCsv = async () => {
  const foodItems = await csv().fromFile('./data.csv')
  console.log(foodItems)

  foodItems.forEach(async foodItem => {
    await db.FoodItem.create(
      {
        name: foodItem.FOOD,
        status: foodItem.STATUS,
        category: foodItem.CATEGORY 
      }
    )
    console.log("CREATED: ", foodItem)
  })
}

(async () => await importCsv())()
