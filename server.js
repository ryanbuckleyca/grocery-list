const express = require('express')
const app = express()
const port = 3000
const db = require('./models')
var path = require('path')

app.use(express.static('public'))

app.get('/', async function(req, res) {
  // res.sendFile(path.join(__dirname + '/index.html'))
  const foodItems = await db.FoodItem.findAll()
  return res.send(foodItems)
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))