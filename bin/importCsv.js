import csv from 'csvtojson'
import { Household, FoodItem } from '../models'

const importCsv = async () => {
  const foodItems = await csv().fromFile('./data.csv')
  console.log(foodItems)

  const household = await Household.create({
    name: '311'
  })

  foodItems.forEach(async foodItem => {
    await FoodItem.create(
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
