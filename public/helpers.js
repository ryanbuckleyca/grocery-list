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
