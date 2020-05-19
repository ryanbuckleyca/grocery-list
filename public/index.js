let connection, clientId

const printToServer = msg => {
  apiRequest("POST", "/debug", { msg })
}

const titleCase = (str) => {
  return str.toLowerCase().split(' ').map(function(word) {
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
    element.classList.remove("edit")
  } else {
    element.onclick = ""
    element.contentEditable = "true"
    element.classList.add("edit")
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

const getFoodItems = () => {
  let request = new XMLHttpRequest() 
  request.open('GET', '/foodItems', false)
  request.setRequestHeader("Content-Type", "application/json")
  request.send()
  return JSON.parse(request.responseText)
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
      title: 'Stock',
      url: '/'
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

let store = new Reef.Store({
  data: {
    foodItems: getFoodItems()
  },
  setters: {
    refreshData: (props) => {
      props.foodItems = getFoodItems()
    },
    removeFoodItem: (props, id) => {
      if(!confirm("Delete?")) return 
      apiRequest("DELETE", "/foodItems/" + id, { "id": id })
      _.remove(props.foodItems, { id })
    },
    addFoodItem: async (props) => {
      let name = titleCase(prompt("Enter the name of the item:"))
      let category = titleCase(prompt("Enter the category for " + name))
      let newItem = await apiRequest("POST", "/foodItems", { name, category, status: "OUT" })
      props.foodItems = props.foodItems.concat([newItem])
      app.render()
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
    },
    updateFoodItem: (props, id, name) => {
      props.foodItems = props.foodItems.map(foodItem => {
        if (foodItem.id === id) {
          apiRequest("PUT", "/foodItems/" + id, { "id": id, "name": name })
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
          apiRequest("PUT", "/foodItems/" + id, { id, status: "GOOD" })
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

    if (route.url === '/stock') return stockPage(props)
    else if (route.url === '/shop') return shopPage(props)
    else if (route.url === '/about') return aboutPage(props)
    else return stockPage(props)
  }
})

const stockPage = (props) => {
  console.log("RENDERING STOCK PAGE")
  let foodItemsByCategory = _.groupBy(props.foodItems, "category")
  return `
    ${_.map(foodItemsByCategory, (foodItems, category) => {
      return `
        <div id="${category}" class="groceryHeader row col-10 no-gutters">
          <div class="col-10 groceryHeaderName">
            ${category}
          </div>
        </div>
        ${_(foodItems).sortBy(['createdAt', 'name']).map(foodItem => {
          return `
            <div id="groceryRow-${foodItem.id}" class="groceryRow row no-gutters text-center">
              <div id="delItem-${foodItem.id}" class="delItem col-1 text-center align-self-center">
                <button type="button" id="delButton-${foodItem.id}" class="delItem" onclick="store.do('removeFoodItem', ${foodItem.id})"}>
                  <li id="delIcon-${foodItem.id}" class="fas fa-trash" aria-hidden="true"></li>
                </button>
              </div>
              <div id="itemName-${foodItem.id}" class="groceryName col-10 p-2 text-center align-self-center">
                <p id="statusButton-${foodItem.id}" class="groceryItem ${foodItem.status.toLowerCase()}" 
                   onblur="handleOnBlurEdit(${foodItem.id})" contentEditable="false" onclick="store.do('toggleStatus', ${foodItem.id})" 
                   onkeydown="handleOnEnterEdit(event, ${foodItem.id})">
                  ${foodItem.name} ${foodItem.createdAt}
                </p>
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

const attachSlip = () => {
  console.log("ATTACHED")

  document.querySelectorAll('.shopListCategory').forEach(item => {
    new Slip(item)
    item.addEventListener('slip:swipe', event => {
      store.do("buyFoodItem", parseInt(event.target.dataset.id))
    })
  })
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

  return `
    ${_.map(foodItemsByCategory, (foodItems, category) => {
      return `
        <div id="${category}" class="groceryHeader row col-10 no-gutters">
          <div class="col-10 groceryHeaderName">
            ${category}
          </div>
        </div>
        <ul class="shopListCategory">
          ${_(foodItems).sortBy(foodItem => foodItem.status).reverse().map(foodItem => {
            return `
            <li class="shopListItem" id="shopListItem-${foodItem.id}" data-id=${foodItem.id}>
              <div id="groceryRow-${foodItem.id}" class="groceryRow row no-gutters text-center">
                <div id="itemName-${foodItem.id}" class="groceryName col-12 p-2 text-center align-self-center">
                  <p id="stockItem-${foodItem.id}" class="shopItem ${foodItem.status.toLowerCase()}">${foodItem.name}</p>
                </div>
              </div>
            </li>`
          }).join('')}
        </ul>`
      }).join('')}
    </div>
  </div>`
}

const aboutPage = (props) => {
  console.log("RENDERING ABOUT PAGE")
  return `<div><p>311 is the color of our energy!</p></div>`
}

app.render()
connectWebsocket()