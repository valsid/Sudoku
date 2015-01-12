function generate_sudoku_table(containerBlockId, tableClass, tableId) {
    if(tableClass == undefined) {
        tableClass = " ";
    }
    if(tableId == undefined) {
        tableId = " ";
    }

    var container = document.getElementById(containerBlockId);
    var table = document.createElement("table");

    table.id = tableId;
    table.className = tableClass;

    table.setAttribute("cellspacing", "0");
    var tbody = document.createElement("tbody");
    for(var i = 0; i < 9; i++){
        var tr = document.createElement("tr");
        for(var j = 0; j < 9; j++) {
            var td = document.createElement("td");
            td.setAttribute("contenteditable", "true");

            addEvent(td, "keypress", keyPressed);
            addEvent(td, "keydown", keyDown);
            //td.addEventListener("keypress", keyPressed, false);
            //td.addEventListener("keydown", keyDown, false);

            td.appendChild(document.createTextNode(""));
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    container.appendChild(table);

    return table;
}