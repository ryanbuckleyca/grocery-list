let connection, clientId

const createUuid = () => {
  let dt = new Date().getTime()
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (dt + Math.random()*16)%16 | 0
      dt = Math.floor(dt/16)
      return (c=='x' ? r :(r&0x3|0x8)).toString(16)
  })
  return uuid
}

const getFoodItems = () => {
  let request = new XMLHttpRequest()
  request.open('GET', '/api/foodItems?householdId='+readCookie('householdId'), false)
  request.setRequestHeader("Content-Type", "application/json")
  request.send()
  return JSON.parse(request.responseText)
}

const getHouseholds = () => {
  let request = new XMLHttpRequest()
  request.open('GET', '/api/households', false)
  request.setRequestHeader("Content-Type", "application/json")
  request.send()
  return JSON.parse(request.responseText)
}

const getHouseholdStatus = (id) => {
  if(id.toString() === readCookie("householdId")) {
    return "good"
  } else {
    return "low"
  }
}

const getFoodItemsForStoredHousehold = () => {
  if(readCookie("householdId")) {
    return getFoodItems()
  } else {
    return []
  }
}

const apiRequest = async (action, url, data) => {
  const response = await fetch(`${url}?clientId=${clientId}`, {
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

let router = new ReefRouter({
	routes: [
    {
      id: 'home',
      title: 'Home',
      url: '/'
    },
    {
      id: 'households',
      title: 'Households',
      url: '/households'
    },
		{
      id: 'stock',
			title: 'Stock',
			url: '/stock'
		},
		{
      id: 'shop',
			title: 'Shop',
			url: '/shop'
		},
		{
      id: 'about',
			title: 'About',
			url: '/about'
		}
	]
})

let store = new Reef.Store({
  data: {
    foodItems: getFoodItemsForStoredHousehold(),
    households: getHouseholds()
  },
  setters: {
    refreshData: (props) => {
      props.foodItems = getFoodItems()
    },
    addHousehold: async (props) => {
      console.log("addHousehold entered")
      let name = titleCase(prompt("Enter the name of the household:"))
      let newItem = await apiRequest(
        "POST",
        "/api/households",
        { name }
      )
      props.households = props.households.concat([newItem])
      app.render()
    },
    selectHousehold: (props, id) => {
      const newStatus = {
        GOOD: "LOW",
        LOW: "GOOD",
      }
      createCookie("householdId", id)
      console.log('householdId = ', id)
      props.foodItems = getFoodItems()
      router.navigate('/stock')
    },
    removeFoodItem: (props, id) => {
      if(!confirm("Delete?")) return
      apiRequest("DELETE", "/api/foodItems/" + id, { "id": id })
      _.remove(props.foodItems, { id })
    },
    addFoodItem: async (props) => {
      console.log('addFoodItem;')
      let name = document.getElementById("foodItemToAdd").value.trim()
      let category = document.getElementById("categoryToAddTo").value.trim()
      let householdId = readCookie("householdId")

      if (name.length < 1 || category.length < 1) {
        alert('Item was not added because it needs both a name and a category');
        return false;
      }

      const itemAlreadyInList = props.foodItems.some((item) =>
        item.name.toLowerCase() === name.toLowerCase() &&
        item.category.toLowerCase() === category.toLowerCase()
      );

      if (itemAlreadyInList) {
        alert('This item is already in your list')
        return false;
      }

      let newItem = await apiRequest(
        "POST",
        "/api/foodItems",
        { name, category, status: "OUT", householdId }
      )
      props.foodItems = props.foodItems.concat([newItem])
      app.render()
      document.getElementById("foodItemToAdd").value = ""
      document.getElementById("categoryToAddTo").value = ""
      document.querySelector(".modal").classList.remove("show-modal")
    },
    toggleStatus: (props, id) => {
      const newStatus = {
        GOOD: "LOW",
        LOW: "OUT",
        OUT: "GOOD"
      }

      props.foodItems = props.foodItems.map(foodItem => {
        if (foodItem.id === id) {
          apiRequest(
            "PUT",
            "/api/foodItems/" + id,
            { "status": newStatus[foodItem.status] }
          )
          return { ...foodItem, status: newStatus[foodItem.status] }
        } else {
          return foodItem
        }
      })
    },
    updateFoodItem: (props, id, name) => {
      props.foodItems = props.foodItems.map(foodItem => {
        if (foodItem.id === id) {
          apiRequest(
            "PUT",
            "/api/foodItems/" + id,
            { "id": id, "name": name }
          )
          return { ...foodItem, name: name }
        } else {
          return foodItem
        }
      })
    },
    buyFoodItem: (props, id)  => {
      console.log("BUYING ITEM: ", id)
      props.foodItems = props.foodItems.map(foodItem => {
        if (foodItem.id === id) {
          apiRequest(
            "PUT",
            "/api/foodItems/" + id,
            { id, status: "GOOD" }
          )
          return { ...foodItem, status: "GOOD" }
        } else {
          return foodItem
        }
      })
    }
  }
})

const app = new Reef('#app', {
  router: router,
  store: store,
  template: (props, route) => {
    document.addEventListener('render', function (event) {
      console.log("RENDERING APP")
    }, false)

    console.log('route object is ', route)

    if (route.url === '/') return determineRootPath(props)
    else if (route.url === '/households') return householdPage(props)
    else if (route.url === '/stock') return stockPage(props)
    else if (route.url === '/shop') return shopPage(props)
    else if (route.url === '/about') return aboutPage(props)
    else return stockPage(props)
  }
})

const determineRootPath = (props) => {
  return readCookie("householdId")
    ? stockPage(props)
    : householdPage(props)
}

const stockPage = (props) => {
  console.log("RENDERING STOCK PAGE")
  if(props.foodItems.length === 0) {
    return `
    ${itemEntryModal()}
    <p align='center'>
      No grocery items yet. Click the + button icon below to start creating your list!
    </p>
    ${addItemComponent()}
    `
  }
  let foodItemsByCategory = _.groupBy(props.foodItems, "category")
  return `
    ${itemEntryModal()}
    ${_.map(foodItemsByCategory, (foodItems, category) => {
      return `
        <div id="${category}" class="row header center">
          <a name="${category}" class="headerName" onClick="collapseCat(${category}, 'stockListCategory-')">
            ${category}
            <i class="fa fa-caret-down"></i>
          </a>
        </div>

        <div id="stockListCategory-${category}" class="stockListCategory" style="display: block">
          ${_(foodItems).sortBy(['createdAt', 'name']).map(foodItem => {
            return `
              <div id="groceryRow-${foodItem.id}" class="row">
                <button type="button" id="delButton-${foodItem.id}" class="del button icon left" onclick="store.do('removeFoodItem', ${foodItem.id})"}>
                  <li id="delIcon-${foodItem.id}" class="fas fa-trash" aria-hidden="true"></li>
                </button>
                <p id="statusButton-${foodItem.id}" class="item center ${foodItem.status.toLowerCase()}"
                    onblur="handleOnBlurEdit(${foodItem.id})" contentEditable="false" onclick="store.do('toggleStatus', ${foodItem.id})"
                    onkeydown="handleOnEnterEdit(event, ${foodItem.id})">
                  ${foodItem.name}
                </p>
                <button type="button" id="editButton-${foodItem.id}" class="edit button icon right" onmousedown="editItem(event, ${foodItem.id})">
                  <li id="editIcon-${foodItem.id}" class="fas fa-pen" aria-hidden="true"></li>
                </button>
              </div>`
          }).join('')}
        </div>`
      }).join('')}
      ${addItemComponent()}
    `
}

const addItemComponent = (action='toggleModal()', icon='<i class="fas fa-cart-plus"></i>') => {
  return `
    <div id="addButton" class="addItem">
      <button type="button" onClick="${action}">
        ${icon}
      </button>
    </div>`
}

const connectWebsocket = () => {
  clientId = createUuid()

  const protocol = window.location.hostname === "localhost" ? "ws" : "wss"
  const host = window.location.hostname
  const port = window.location.port || 443
  const url = `${protocol}://${host}:${port}/?clientId=${clientId}`
  connection = new WebSocket(url)

  connection.onmessage = event => {
    const message = JSON.parse(event.data)

    console.log(message)
    switch(message.type) {
      case "refreshData":
        console.log("REFRESHING DATA!!!")
        store.do("refreshData")
        break
    }
  }
}

const shopPage = (props) => {
  console.log("RENDERING SHOP PAGE")
  let foodItemsByCategory = _(props.foodItems).filter(foodItem => foodItem.status !== "GOOD").groupBy("category").value()

  if (_.isEmpty(foodItemsByCategory)) {
    return `
      <div class="pyro">
        <div class="before"></div>
        <div class="after"></div>
      </div>`
  }

  return _.map(foodItemsByCategory, (foodItems, category) => `
    <div id="${category}" class="row header center">
      <a name="${category}" class="headerName" onClick="collapseCat(${category}, 'shopListCategory-')">
        ${category}
        <i class="fa fa-caret-down"></i>
      </a>
    </div>

    <div id="shopListCategory-${category}" class="" style="display: block">
      ${_(foodItems).sortBy(foodItem => foodItem.status).reverse().map(foodItem => {
        return `
        <div id="groceryRow-${foodItem.id}" class="row">
          <button type="button" id="editButton-${foodItem.id}" class="edit button icon left" onclick="removeShopItem(${foodItem.id}, ${foodItem.category}, 'bought')">
            <li class="fas fa-check" aria-hidden="true"></li>
          </button>
          <p id="shopItem-${foodItem.id}" class="item center ${foodItem.status.toLowerCase()}">${foodItem.name}</p>
          <button type="button" id="delButton-${foodItem.id}" class="del button icon right" onclick="removeShopItem(${foodItem.id}, ${foodItem.category})"}>
            <li id="delIcon-${foodItem.id}" class="fas fa-eye-slash" aria-hidden="true" style="transform: scale(0.9)"></li>
          </button>
        </div>`
      }).join('')}
    </div>
  `).join('')
}

const aboutPage = (props) => {
  console.log("RENDERING ABOUT PAGE")
  return `<div><p>311 is the color of our energy!</p></div>`
}

const householdPage = (props) => {
  console.log("RENDERING HOUSEHOLD PAGE")
  return `
    ${itemEntryModal()}
    <div id="households" class="row header center">
      <p class="headerName">Households</p>
    </div>
    ${_(props.households).map(household => {
      return `
      <div id="groceryRow-${household.id}" class="row">
        <p id="statusButton-${household.id}" class="item center ${getHouseholdStatus(household.id)}"
           onblur="handleOnBlurEdit(${household.id})" contentEditable="false" onclick="store.do('selectHousehold', ${household.id})"
           onkeydown="handleOnEnterEdit(event, ${household.id})">
          ${household.name}
        </p>
      </div>`
    }).join('')}
    ${addItemComponent("store.do('addHousehold')", '<i class="fas fa-home">+</i>')}
  `
}

const itemEntryModal = () => `
  <div id="itemEntryModal" class="modal">
    <div class="modal-content">
      <p class="center">Add item and category:</p>
      <i class="close fas fa-times" onclick="toggleModal()"></i>
      <div id="addItems">
        <input id="foodItemToAdd" type="text" name="foodItem" placeholder="Item name">
        <div class="autocomplete">
          <input id="categoryToAddTo" type="text" name="newCategory" placeholder="Category">
        </div>
        <button type="button" class="good" onclick="store.do('addFoodItem')">Submit</button>
      </div>
    </div>
  </div>`

app.render()
connectWebsocket()
