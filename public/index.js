let connection, clientId

const printToServer = msg => {
  apiRequest("POST", "/api/debug", { msg })
}

const titleCase = (str) => {
  return str.trim().toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase())
  }).join(' ')
}

const createUuid = () => {
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  })
  return uuid
}

const collapseCat = (category, elementID) => {
  var elToColl = document.getElementById(elementID + category.id)
  var fa = document.getElementById(category.id).querySelector('.fa')

  var position = document.getElementById(category.id).offsetTop;

  if(fa.className === "fa fa-caret-right")
  {
    fa.setAttribute("class", "fa fa-caret-down")
  } else {
    fa.setAttribute("class", "fa fa-caret-right")
  }
  console.log(elToColl.style.display)
  if (elToColl.style.display === "block") {
    console.log("style was Block")
    elToColl.style.display = "none";
  } else {
    console.log("style was not block")
    elToColl.style.display = "block";
  }

  window.scrollTo(0, position);
}

//close menu when clicking outside or on links
window.addEventListener('mousedown', function(e){
  let menuDiv = document.getElementById('dropdown').contains(e.target)
  let menuButton = document.getElementById('menuButton').contains(e.target)
  let menuDivDisp = document.getElementById('dropdown').style.display

  //if user clicks outside of dropdown and it's open, close it
  if (!menuDiv && menuDivDisp==="block" && !menuButton){
    document.getElementById('dropdown').style.display = "none"
    document.getElementById("menuButton").innerHTML = "<i class=\"fas fa-hamburger\"></i>";
  }
});

let OrigScrollPos = window.scrollY
const toggleMenu = () => {
  var dropdown = document.getElementById("dropdown")
  var groceryMenu = document.getElementById("groceryMenu")
  if (dropdown.style.display === "block") {
    //menu is open, close it
    dropdown.style.display = "none"
    groceryMenu.style.zIndex = 1
    document.getElementById("menuButton").innerHTML = "<i class=\"fas fa-hamburger\"></i>";
  } else {
    dropdown.style.display = "block"
    groceryMenu.style.zIndex = 4
    document.getElementById("menuButton").innerHTML = "<i class=\"fas fa-times\"></i>";
    OrigScrollPos = window.scrollY //showing div adjusts scrollY value, so reset
  }
};
//close menu when scrolling, if it's open
window.onscroll = function() {
  let vis = document.getElementById('dropdown').style.display
  if(OrigScrollPos < window.scrollY && vis === "block")
    toggleMenu()
}


const editItem = (event, itemID) => {
  let element = document.getElementById("statusButton-" + itemID)

  if (element.contentEditable === "true") {
    element.contentEditable = "false"
    element.classList.remove("modify")
  } else {
    element.onclick = ""
    element.contentEditable = "true"
    element.classList.add("modify")
    //should set cursor to end of text
    var selection = window.getSelection();
    var range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.addRange(range);
    element.focus();

    event.preventDefault()
  }
}

const handleOnBlurEdit = (itemID) => {
  let element = document.getElementById("statusButton-" + itemID)
  element.onclick = () => store.do("toggleStatus", itemID)
  element.contentEditable = "false"
  element.classList.remove("edit")

  let newName = document.getElementById("statusButton-"+itemID).innerText

  store.do("updateFoodItem", itemID, newName)
}

const handleOnEnterEdit = (event, id) => {
  if (event.which == 13 || event.keyCode == 13) {
    event.preventDefault()
    handleOnBlurEdit(id)
  }
}
const submitOnEnter = (event) => {
  console.log(event)
  if (event.which == 13 || event.keyCode == 13) {
    event.preventDefault()
    document.getElementById("addFoodItemModal").modal('hide')
    store.do('addFoodItem')
  }
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

let router = new Reef.Router({
	routes: [
    {
      title: 'Home',
      url: '/'
    },
    {
      title: 'Households',
      url: '/households'
    },
		{
			title: 'Stock',
			url: '/stock'
		},
		{
			title: 'Shop',
			url: '/shop'
		},
		{
			title: 'About',
			url: '/about'
		}
	]
})
const getFoodItemsForStoredHousehold = () => {
  if(readCookie("householdId")) {
    return getFoodItems()
  } else {
    return []
  }
}
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
      props.foodItems = getFoodItems()
    },


    removeFoodItem: (props, id) => {
      if(!confirm("Delete?")) return
      apiRequest("DELETE", "/api/foodItems/" + id, { "id": id })
      _.remove(props.foodItems, { id })
    },
    addFoodItem: async (props) => {
      let name = document.getElementById("foodItemToAdd").value
      let category = document.getElementById("categoryToAddTo").value
      let householdId = readCookie("householdId")
      let newItem = await apiRequest(
        "POST",
        "/api/foodItems",
        { name, category, status: "OUT", householdId }
      )
      props.foodItems = props.foodItems.concat([newItem])
      app.render()
      document.querySelector(".modal").classList.remove("show-modal");
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
    ? stockPage(props) : householdPage(props)
}

const stockPage = (props) => {
  console.log("RENDERING STOCK PAGE")
  if(props.foodItems.length === 0) {
    return `
    <p align='center'>
      No grocery items yet. Click the + button icon below to start creating your list!
    </p>
    ${addItemComponent()}
    `
  }
  let foodItemsByCategory = _.groupBy(props.foodItems, "category")
  return `
    ${_.map(foodItemsByCategory, (foodItems, category) => {
      return `
        <div id="${category}" class="container row header center">
          <a name="${category}" class="headerName" onClick="collapseCat(${category}, 'stockListCategory-')">
            ${category}
            <i class="fa fa-caret-down"></i>
          </a>
        </div>

        <div id="stockListCategory-${category}" class="stockListCategory container" style="display: block;">

        ${_(foodItems).sortBy(['createdAt', 'name']).map(foodItem => {
          return `
            <div id="groceryRow-${foodItem.id}" class="container row">
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

function removeShopItem( id, category, status ) {
  var item = document.getElementById('groceryRow-' + id)
  var catSpan = document.getElementById('shopListCategory-' + category.id)
  if(status === "bought") {
    document.getElementById('shopItem-' + id).classList.add("good")
    document.getElementById('shopItem-' + id).style.transform = "rotate(0.5deg) scale(1.07)";
  }
  item.style.transition = "opacity 1.5s ease"
  item.style.opacity = 0
  setTimeout( function() {
      item.parentNode.removeChild(item)
      if(status === "bought")
        store.do("buyFoodItem", id)
      if(catSpan.children.length === 0)
        document.getElementById('app').removeChild(category);
  }, 500)
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

  return `
    ${_.map(foodItemsByCategory, (foodItems, category) => {
      return `
        <div id="${category}" class="container row header center">
          <a name="${category}" class="headerName" onClick="collapseCat(${category}, 'shopListCategory-')">
            ${category}
            <i class="fa fa-caret-down"></i>
          </a>
        </div>

        <div id="shopListCategory-${category}" class="container" style="display: block;">

          ${_(foodItems).sortBy(foodItem => foodItem.status).reverse().map(foodItem => {
            return `
            <div id="groceryRow-${foodItem.id}" class="container row">
              <button type="button" id="editButton-${foodItem.id}" class="edit button icon left" onclick="removeShopItem(${foodItem.id}, ${foodItem.category}, 'bought');">
                <li class="fas fa-check" aria-hidden="true"></li>
              </button>
              <p id="shopItem-${foodItem.id}" class="item center ${foodItem.status.toLowerCase()}">${foodItem.name}</p>
              <button type="button" id="delButton-${foodItem.id}" class="del button icon right" onclick="removeShopItem(${foodItem.id}, ${foodItem.category});"}>
                <li id="delIcon-${foodItem.id}" class="fas fa-eye-slash" aria-hidden="true" style="transform: scale(0.9)"></li>
              </button>
            </div>`
          }).join('')}
        </div>`
      }).join('')}
    </div>
  </div>`
}

const aboutPage = (props) => {
  console.log("RENDERING ABOUT PAGE")
  return `<div><p>311 is the color of our energy!</p></div>`
}

const householdPage = (props) => {
  console.log("RENDERING HOUSEHOLD PAGE")
  return `
    <div id="households" class="container row header center">
      <p class="headerName">Households</p>
    </div>
    ${_(props.households).map(household => {
      return `
      <div id="groceryRow-${household.id}" class="container row">
        <p id="statusButton-${household.id}" class="item center ${getHouseholdStatus(household.id)}"
           onblur="handleOnBlurEdit(${household.id})" contentEditable="false" onclick="store.do('selectHousehold', ${household.id})"
           onkeydown="handleOnEnterEdit(event, ${household.id})">
          ${household.name}
        </p>
    </div>`
    }).join('')}
    ${addItemComponent("store.do('addHousehold')", '<i class="fas fa-home">+</i>')}
  </div>`
}

app.render()
connectWebsocket()
