const fs = require('fs');
  
fs.readFile("groceryList.txt", "utf8", function(err, data) {
  if (err) throw err;
  return data.split('\n');
});  


// let node = document.createElement("table");
// node.id = "groceryTable";
// node.style.display = "table";
// node.style.margin = "auto";
// document.getElementsByTagName(body).appendChild(node);


// for(let i = 0; i < lines.length; i++) { 
//   itemData = each.split('\t');
//   node = document.createElement("tr");
//   node.id = `groceryRow${i}`;
//   node.style.display = "table";
//   node.style.margin = "auto";
//   document.getElementsByID("grcoeryTable").appendChild(node);

//   for(let j = 0; j < itemData.length; j++) {
//     node = document.createElement("td");
//     node.id = `row${i}item${j}`;
//     node.style.display = "table";
//     node.style.margin = "auto";
//     node.innerHTML = itemData[0];
//     document.getElementsByID(`groceryRow${i}`).appendChild(node);
//   }
// }