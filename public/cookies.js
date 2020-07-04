function createCookie(name,value) {
  document.cookie = name+"="+value+"; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT"
}

function readCookie(name) {
  var cookieName = name + "="
  var cookieProps = document.cookie.split(';')
  for(var i = 0; i < cookieProps.length; i++) {
    var c = cookieProps[i]
    while (c.charAt(0)==' ') c = c.substring(1, c.length)
    if (c.indexOf(cookieName) == 0) return c.substring(cookieName.length, c.length)
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name,"",-1)
}