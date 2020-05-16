Reef.debug(true) 

const printToServer = msg => {
  apiRequest("POST", "/debug", { msg })
}

const titleCase = (str) => {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase())
  }).join(' ')
}

const toggleMenu = () => {
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

//close menu when clicking outside or on links
window.addEventListener('click', function(e){   
  let menuDiv = document.getElementById('dropdown').contains(e.target)
  let menuButton = document.getElementById('menuButton').contains(e.target)
  let menuDivDisp = document.getElementById('dropdown').style.display
  console.log(menuDiv)
  console.log(menuDivDisp)
  //if user clicks outside of dropdown and it's open, close it
  if (!menuDiv && menuDivDisp==="block" && !menuButton){
    console.log("try to close")
    document.getElementById('dropdown').setAttribute("style", "display: none")
  }
});


const editItem = (event, itemID) => {
  printToServer("editItem() press/click event: " + event)
  let element = document.getElementById("statusButton-" + itemID)

  if (element.contentEditable === "true") {
    element.contentEditable = "false"
    element.classList.remove("edit")
  } else {
    element.onclick = ""
    element.contentEditable = "true"
    element.focus()
    element.classList.add("edit")
    element.contentEditable = "true"
    element.focus()
    
    printToServer("onclick: " + element.onclick)

    event.preventDefault()

  }
}

const handleOnBlurEdit = (itemID) => {
  printToServer("handleOnBlurEdit() called")

  let element = document.getElementById("statusButton-" + itemID)
  element.onclick = () => store.do("toggleStatus", itemID)
  element.contentEditable = "false"
  element.classList.remove("edit")

  let newName = document.getElementById("statusButton-"+itemID).innerText

  store.do("updateFoodItem", itemID, newName)
}

const handleOnEnterEdit = (event, id) => {
  printToServer("handleOnEnterEdit() press/click event: " + event)
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
      stockComponent.render()
    },
    toggleStatus: (props, id) => {
      printToServer("toggleStatus() called")
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
      stockComponent.render()
    },
    updateFoodItem: (props, id, name) => {
      props.foodItems = props.foodItems.map(foodItem => {
        if (foodItem.id === id) {
          apiRequest("PUT", "/foodItems/" + id, { "id": id, "name": name })
          console.log("Food Item: ", foodItem)
          console.log("New name: ", name)
          return { ...foodItem, name: name }
        } else {
          return foodItem
        }
      })
      stockComponent.render()
    }
  }
})

let stockComponent = new Reef('#stock', {
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
                  <button type="button" id="delButton-${foodItem.id}" class="delItem" onclick="store.do('removeFoodItem', ${foodItem.id})"}>
                    <li id="delIcon-${foodItem.id}" class="fas fa-trash" aria-hidden="true"></li>
                  </button>
                </div>
                <div id="itemName-${foodItem.id}" class="groceryName col-10 p-2 text-center align-self-center">
                  <p id="statusButton-${foodItem.id}" class="groceryItem ${foodItem.status.toLowerCase()}" onblur="handleOnBlurEdit(${foodItem.id})" contentEditable="false" onclick="store.do('toggleStatus', ${foodItem.id})" onkeydown="handleOnEnterEdit(event, ${foodItem.id})">${foodItem.name}</p>
                </div>
                <div id="editItem-${foodItem.id}" class="editItem col-1 text-center align-self-center">
                  <button type="button" id="editButton-${foodItem.id}" class="editButton" onmousedown="editItem(event, ${foodItem.id})">
                    <li id="editIcon-${foodItem.id}" class="fas fa-pen" aria-hidden="true"></li>
                  </button>
                </div>
              </div>`
          }).join('')}`
        }).join('')}
      </div>
      <div id="addButton" class="addItem">
        <button type="button" onclick="store.do('addFoodItem')">
          <i class="fas fa-cart-plus"></i>
        </button>
      </div>
    </div>`
  }
})

let storeComponent;

stockComponent.render()
