const express = require('express')
const app = express()
const port = 3000
const db = require('./models')
var path = require('path')

app.use(express.static('public'))
app.use(express.json())

app.get('/', async function(req, res) {
  return res.sendFile(path.join(__dirname + '/index.html'))
})

app.get('/stock', async function(req, res) {
  return res.sendFile(path.join(__dirname + '/index.html'))
});

app.get('/shop', async function(req, res) {
  return res.sendFile(path.join(__dirname + '/index.html'))
});

app.get('/about', async function(req, res) {
  return res.sendFile(path.join(__dirname + '/index.html'))
})

app.get('/foodItems', async function(req, res) {
  console.log('GET /foodItems')
  const foodItems = await db.FoodItem.findAll(
    {order: [
      ['category', 'DESC'],
      ['status', 'DESC']
    ]}
  )
  return res.send(foodItems)
})

app.post('/foodItems', async function(req, res) {
  console.log('POST /foodItems - Body: ', req.body)
  const { name, category, notes, status } = req.body
  const foodItem = await db.FoodItem.create({ name, category, notes, status })

  return res.send(foodItem)
})

app.get('/foodItems/:id', async function (req, res) {
  console.log('GET /foodItems/:id - ID: ', req.params.id)
  const id = req.params.id
  const { name, category } = req.body
  const foodItem = await db.FoodItem.findOne({ where: { id } })

  return res.send(foodItem)
})

app.put('/foodItems/:id', async function (req, res) {
  console.log('PUT /foodItems/:id - ID: ', req.params.id, ' Body: ', req.body)
  const id = req.params.id
  const { name, category, status, notes } = req.body
  const foodItem = await db.FoodItem.findOne({ where: { id } })
  if (name) foodItem.name = name
  if (category) foodItem.category = category
  if (status) foodItem.status = status
  if (notes) foodItem.notes = notes
  await foodItem.save()

  res.sendStatus(200)
})

app.delete('/foodItems/:id', async function (req, res) {
  console.log('DELETE /foodItems/:id - ID: ', req.params.id)
  const id = req.params.id
  const foodItem = await db.FoodItem.findOne({ where: { id } })
  await foodItem.destroy()

  res.sendStatus(200)
})

app.post('/debug', function (req, res) {
  const { msg } = req.body
  console.log("FRONTEND DEBUG: ", msg)
  res.send({})
})

app.listen(port, () => console.log(`Grocery List app listening at http://localhost:${port}`))