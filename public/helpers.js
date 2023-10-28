function toggleModal() {
  document.querySelector(".modal").classList.toggle("show-modal");
}

const toggleMenu = () => {
  var dropdown = document.getElementById("dropdown")
  var groceryMenu = document.getElementById("groceryMenu")

  if (dropdown.style.display === "block") {
    //menu is open, close it
    document.getElementById("app").style.opacity = "100%"
    dropdown.style.display = "none"
    groceryMenu.style.zIndex = 1
    console.log('document.getElementById("app")', document.getElementById("app"));
    document.getElementById("menuButton").innerHTML = "<i class=\"fas fa-hamburger\"></i>"
  } else {
    //menu is closed, open it
    document.getElementById("app").style.opacity = "40%"
    dropdown.style.display = "block"
    groceryMenu.style.zIndex = 4
    document.getElementById("menuButton").innerHTML = "<i class=\"fas fa-times\"></i>"
    OrigScrollPos = window.scrollY //showing div adjusts scrollY value, so reset
  }
}

//close menu when clicking outside or on links
window.addEventListener('mousedown', function(e){
  let menuDiv = document.getElementById('dropdown').contains(e.target)
  let menuButton = document.getElementById('menuButton').contains(e.target)
  let menuDivDisp = document.getElementById('dropdown').style.display
  didClickOutsideOpenMenu = !menuDiv && menuDivDisp==="block" && !menuButton

  //if user clicks outside of dropdown and it's open, close it
  if (didClickOutsideOpenMenu){
    toggleMenu();
  }
})

const titleCase = (str) => {
  return str.trim().toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase())
  }).join(' ')
}

const linkTags = document.getElementsByTagName("link")
let linkElToSwap

for(link of linkTags) {
  if(link.title === "swap") {
    linkElToSwap = link
  }
  else if(link.title === "lasers") {
    linkLaserToDel = link
  }
}

if(!linkElToSwap) {
  console.log('cannot find a <link> tag with title "swap"')
} else {
  //set user's preferred style, if exists
  const styles = ["lights.css", "dark.css", "rave.css"]
  const userStyle = readCookie("style")
  const userHasPreferredStyle = styles.includes()
  if(userHasPreferredStyle) setLinkTag(userStyle)

  function switchStyle() {
    if(linkElToSwap.href.includes("light.css")) {
      switchTo = "dark.css"
    } else if(linkElToSwap.href.includes("rave.css")) {
      switchTo = "light.css"
    } else {
      switchTo = "rave.css"
    }
    setLinkTag(switchTo)
  }

  function setLinkTag(value) {
    linkElToSwap.setAttribute("href", value)
    createCookie("style", value)
  }
}

const collapseCat = (category, elementID) => {
  var elToColl = document.getElementById(elementID + category.id)
  var fa = document.getElementById(category.id).querySelector('.fa')

  var position = document.getElementById(category.id).offsetTop

  fa.className === "fa fa-caret-right" ?
    fa.setAttribute("class", "fa fa-caret-down") :
    fa.setAttribute("class", "fa fa-caret-right")

  elToColl.style.display === "block" ?
    elToColl.style.display = "none" :
    elToColl.style.display = "block"

  window.scrollTo(0, position)
}

window.addEventListener('keydown', function(e) {
  const modal = document.getElementById('itemEntryModal')
  const modalDisplay = window.getComputedStyle(modal)['display'];
  if (modalDisplay === 'none') return;

  const itemValue = document.getElementById("foodItemToAdd").value
  const catValue = document.getElementById("categoryToAddTo").value

  if (itemValue.length < 1 || catValue < 1) return

  if (e.key === 'Enter') store.do('addFoodItem')
})

let OrigScrollPos = window.scrollY
//close menu when scrolling, if it's open
window.onscroll = function() {
  let vis = document.getElementById('dropdown').style.display
  if(OrigScrollPos < window.scrollY && vis === "block")
    toggleMenu()
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
    var selection = window.getSelection()
    var range = document.createRange()
    selection.removeAllRanges()
    range.selectNodeContents(element)
    range.collapse(false)
    selection.addRange(range)
    element.focus()

    event.preventDefault()
  }
}

function removeShopItem( id, category, status ) {
  var item = document.getElementById('groceryRow-' + id)
  var catSpan = document.getElementById('shopListCategory-' + category.id)
  if(status === "bought") {
    document.getElementById('shopItem-' + id).classList.add("good")
    document.getElementById('shopItem-' + id).style.transform = "rotate(0.5deg) scale(1.07)"
  }
  item.style.transition = "opacity 1.5s ease"
  item.style.opacity = 0
  setTimeout( function() {
      item.parentNode.removeChild(item)
      if(status === "bought")
        store.do("buyFoodItem", id)
      if(catSpan.children.length === 0)
        document.getElementById('app').removeChild(category)
  }, 500)
}
