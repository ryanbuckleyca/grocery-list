function createCookie(name,value) {
  document.cookie = name+"="+value+"; path=/"
  console.log("cookie created: ", document.cookie)
}

function readCookie(name) {
  console.log("cookie is: ", document.cookie)
  var nameEQ = name + "="
  var ca = document.cookie.split(';')
  for(var i=0;i < ca.length;i++) {
    var c = ca[i]
    while (c.charAt(0)==' ') c = c.substring(1,c.length)
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length)
  }
  return null;
}

function eraseCookie(name) {
  console.log("cookie ", document.cookie, " erased.")
  createCookie(name,"",-1)
  console.log("cookie is now: ", document.cookie)
}