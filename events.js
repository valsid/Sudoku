
function addEvent(element, eventName, callback) {
    if (element.addEventListener) {
        element.addEventListener(eventName, callback, false);
    } else if (element.attachEvent) {
        element.attachEvent("on" + eventName, callback);
    } else {
    }
}

function keyPressed(event) {
    event = event || window.event;
    var keyCode = event.keyCode || event.charCode;

    try {
        if(keyCode >= (48 + 1) && keyCode <= 58) {
            sudoku_table.updateCell(event.target, keyCode - 48);
        }
    } finally {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false
        }
    }
}

function keyDown(event) {
    event = event || window.event;
    var key = event.keyCode || event.charCode;

    if(key == 8 || key == 46 ) {
        try {
            sudoku_table.updateCell(event.target, 0);
        } finally {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false
            }
        }
    }
}