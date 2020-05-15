Reef.debug(true) 

const printToServer = msg => {
  apiRequest("POST", "/debug", { msg })
}

const titleCase = (str) => {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase())
  }).join(' ')
}

const showMenu = () => {
  var x = document.getElementById("dropdown")
  var y = document.getElementById("groceryMenu")
  if (x.style.display === "block") {
    x.style.display = "none"
    y.style.zIndex = 1

  } else {
    x.style.display = "block"
    y.style.zIndex = 4
  }
}

const editItem = (event, itemID) => {
  console.log(event)
  let element = document.getElementById("statusButton-" + itemID)

  if (element.contentEditable === "true") {
    element.contentEditable = false
    element.classList.remove("edit")
  } else {
    element.onclick = ""
    element.contentEditable = true
    element.focus()
    element.classList.add("edit")
    element.contentEditable = true
    element.focus()
    event.preventDefault()

  }
}

const handleOnBlurEdit = (itemID) => {
  let element = document.getElementById("statusButton-" + itemID)
  element.onclick = () => store.do("toggleStatus", itemID)
  element.contentEditable = false
  element.classList.remove("edit")

  let newName = document.getElementById("itemName-" + itemID + "p").innerText
  apiRequest("PUT", "/foodItems/" + itemID, { "id": itemID, "name": newName })
}

const handleOnEnterEdit = (event, id) => {
  if (event.which == 13 || event.keyCode == 13) {
    event.preventDefault()
    handleOnBlurEdit(id)
  }
}

const getFoodItems = () => {
  let request = new XMLHttpRequest() 
  request.open('GET', '/foodItems', false)
  request.setRequestHeader("Content-Type", "application/json")
  request.send()
  return JSON.parse(request.responseText)
}

const apiRequest = async (action, url, data) => {
  const response = await fetch(url, {
    method: action,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (['GET', 'POST'].includes(action)) {
    const parsedResponse = await response.json()
    return parsedResponse
  }
  return response
}

let store = new Reef.Store({
  data: {
    foodItems: getFoodItems()
  },
  setters: {
    removeFoodItem: (props, id) => {
      if(!confirm("Delete?")) return 
      apiRequest("DELETE", "/foodItems/" + id, { "id": id })
      _.remove(props.foodItems, { id })
    },
    addFoodItem: async (props) => {
      let name = titleCase(prompt("Enter the name of the item:"))
      let category = titleCase(prompt("Enter the category for " + name))
      let newItem = await apiRequest("POST", "/foodItems", { name, category, status: "OUT" })
      props.foodItems.push(newItem)
      app.render()
    },
    editFoodItem: (props, id) => {
      let element = document.getElementById(`statusButton-${id}`)
      element.contentEditable = true
      element.focus()
      element.classList.add("edit")
      //run again to override mobile need to click twice
      element.contentEditable = true
      element.focus()

      //deactivate edit button... this isn't working on mobile
      element.onclick = ""
      _.find(props.foodItems, { id })
    },
    toggleStatus: (props, id) => {
      const newStatus = {
        GOOD: "LOW",
        LOW: "OUT",
        OUT: "GOOD"
      }

      props.foodItems = props.foodItems.map(foodItem => {
        if (foodItem.id === id) {
          apiRequest("PUT", "/foodItems/" + id, { "status": newStatus[foodItem.status] })
          return { ...foodItem, status: newStatus[foodItem.status] }
        } else {
          return foodItem
        }
      })
      app.render()
    }
  }
})

let app = new Reef('#stock', {
  store: store,
  template: (props) => {
    document.addEventListener('render', function (event) {
      console.log("RENDERING")
    }, false)
    let foodItemsByCategory = _.groupBy(props.foodItems, "category")
    return `
      ${_.map(foodItemsByCategory, (foodItems, category) => {
        return `
          <div id="${category}" class="groceryHeader row col-10 no-gutters">
            <div class="col-10 groceryHeaderName">
              ${category}
            </div>
          </div>
          ${_(foodItems).sortBy(foodItem => foodItem.createdAt).map(foodItem => {
            return `
              <div id="groceryRow-${foodItem.id}" class="groceryRow row no-gutters text-center">
                <div id="delItem-${foodItem.id}" class="delItem col-1 text-center align-self-center">
                  <button id="delButton-${foodItem.id}" class="delItem" onclick="store.do('removeFoodItem', ${foodItem.id})"}>
                    <li id="delIcon-${foodItem.id}" class="fas fa-trash" aria-hidden=true></li>
                  </button>
                </div>
                <div id="itemName-${foodItem.id}" class="groceryName col-10 p-2 text-center align-self-center">
                  <button id="statusButton-${foodItem.id}" class="groceryItem ${foodItem.status.toLowerCase()}" onblur="handleOnBlurEdit(${foodItem.id})" 
                          contentEditable=false onclick="store.do('toggleStatus', ${foodItem.id})" onkeydown="handleOnEnterEdit(event, ${foodItem.id})">
                    <p id="itemName-${foodItem.id}p">${foodItem.name}</p>
                  </button>
                </div>
                <div id="editItem-${foodItem.id}" class="editItem col-1 text-center align-self-center">
                  <button id="editButton-${foodItem.id}" class="editButton" onmousedown="editItem(event, ${foodItem.id})">
                    <li id="editIcon-${foodItem.id}" class="fas fa-pen aria-hidden=true"></li>
                  </button>
                </div>
              </div>`
          }).join('')}`
        }).join('')}
      </div>
      <div id="addButton" class="addItem">
        <button onclick="store.do('addFoodItem')">
          <i class="fas fa-cart-plus"></i>
        </button>
      </div>
    </div>`
  }
})

app.render()
