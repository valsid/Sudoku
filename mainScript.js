var sudoku_table = null;

// TODO: save/load to/from string
//       save last save/load slot
//       select font
//       cursor control from arrow buttons

function Sudoku_table(tableId) {
  this.GOOD_CELL_BACKGROUND_COLOR = "#FFF";
  this.INACTIVE_CELL_BACKGROUND_COLOR = "#DDD";
  this.BAD_INACTIVE_CELL_BACKGROUND_COLOR = "#F55";
  this.BAD_CELL_BACKGROUND_COLOR = "#F00";

  this.table = document.getElementById(tableId).children[0];
  this.basicTable = new Sudoku_field(this.table, this.GOOD_CELL_BACKGROUND_COLOR);
  this.enabledCells = [];
  this.solved = [];
  this.isSolve = false;

  for (var i = 0; i < 9 * 9; i++) {
    this.enabledCells[i] = true;
  }

  this.setCellEnabled = function (row, col, isEnabled) {
    this.enabledCells[row * 9 + col] = isEnabled;
    if (isEnabled == true) {
      this.basicTable.cellAt(row, col).style.background = this.GOOD_CELL_BACKGROUND_COLOR;
      this.basicTable.cellAt(row, col).setAttribute("contenteditable", "true");
    } else {
      this.basicTable.cellAt(row, col).style.background = this.INACTIVE_CELL_BACKGROUND_COLOR;
      this.basicTable.cellAt(row, col).setAttribute("contenteditable", "false");
    }
  };

  this.writeDataToSudokuTable = function (array, immutableCell) {
    if (array.length != 9 * 9) { // || immutableCell != 9 * 9
      throw new RangeError("_Bad array length: " + array.length); // + " _ " + immutableCell.length
    }

    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        this.basicTable.write(i, j, array[i * 9 + j]);
        this.setCellEnabled(i, j, immutableCell != undefined ? immutableCell[i * 9 + j] : true);
      }
    }
  };

  // TODO: name converting options
  this.save = function () {
    var saveSlotId = document.getElementById("save_slot").value.toString();
    this.saveTo(saveSlotId);
  };

  this.saveTo = function (slotName) {
    localStorage["b_table" + slotName] = JSON.stringify(this.basicTable.table.table);
    localStorage["inactive_table" + slotName] = JSON.stringify(this.enabledCells);
  };

  this.loadFrom = function (slotName) {
    let propName = "b_table" + slotName;
    if(localStorage[propName] != undefined) {
      this.loadField(JSON.parse(localStorage[propName]), JSON.parse(localStorage["inactive_table" + slotName]));
    }
  };

  this.load = function () {
    // TODO: localStorage security
    var saveSlotId = document.getElementById("save_slot").value.toString();
    if (localStorage["b_table" + saveSlotId] == undefined ||
      localStorage["inactive_table" + saveSlotId] == undefined) {
      alert("Збереження не знайдено");
      return;
    }

    this.loadField(JSON.parse(localStorage["b_table" + saveSlotId]), JSON.parse(localStorage["inactive_table" + saveSlotId]));
  };

  this.loadField = function(data, blockedCells) {
    // TODO: update colors
    this.basicTable.table.table = data.slice(0);
    this.enabledCells = blockedCells != undefined ? blockedCells : data.map(v => v == 0 ? true : false);
    this.writeDataToSudokuTable(this.basicTable.table.table, this.enabledCells);
    this.isSolve = false;

    this.updateColors();
  };

  this.getHtmlElementsByValue = function (sudokuValuesArray, value) {
    var result = [];

    for (var i = 0; i < 9; i++) {
      if (sudokuValuesArray[i] == value) {
        result[result.length] = sudokuValuesArray.htmlElements[i];
      }
    }

    return result;
  };

  this.getHtmlElementsByValueInRow = function (rowIndex, checkValue) {
    if (rowIndex < 0 || rowIndex >= 9) {
      throw RangeException;
    }

    var elemArray = this.basicTable.getRow(rowIndex);
    return this.getHtmlElementsByValue(elemArray, checkValue);
  };

  this.getHtmlElementsByValueInCol = function (colIndex, checkValue) {
    if (colIndex < 0 || colIndex >= 9) {
      throw RangeException;
    }

    var elemArray = this.basicTable.getCol(colIndex);
    return this.getHtmlElementsByValue(elemArray, checkValue);
  };

  this.getHtmlElementsByValueInSegment = function (rowIndex, colIndex, checkValue) {
    if (colIndex < 0 || colIndex >= 9) {
      throw RangeException;
    }

    var elemArray = this.basicTable.getSegmentFromPos(rowIndex, colIndex);
    return this.getHtmlElementsByValue(elemArray, checkValue);
  };

  this.isValidAll = function () {
    for (var i = 1; i <= 9; i++) {
      if (this.updateColorsFor(i)) {
        return false;
      }
    }
    return true;
  };

  this.endWrite = function () {
    if (!this.isValidAll()) {
      alert("В судоку існуєть невідповідності");
      return false;
    }

    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        if (this.basicTable.at(i, j) != 0) {
          this.setCellEnabled(i, j, false);
        }
      }
    }

    return true;
  };

  this.updateColors = function (value) {
    for(let i = 1; i <= 9; i++) {
      this.updateColorsFor(i);
    }
  }

  this.updateColorsFor = function (value) {
    var self = this;
    var isHaveBadCells = false;
    var isRestoreInactiveCellColor = false;

    var setCellColor = function (cell, cssColorString) {
      var pos = self.basicTable.cellPosition(cell);
      if (self.enabledCells[pos.x * 9 + pos.y] == false) {
        if (isRestoreInactiveCellColor) {
          cell.style.background = self.INACTIVE_CELL_BACKGROUND_COLOR;
        } else {
          cell.style.background = self.BAD_INACTIVE_CELL_BACKGROUND_COLOR;
        }
      } else {
        cell.style.background = cssColorString;
      }
    };

    var setColorForCellArray = function (array, cssColorString) {
      array.forEach(function (cell) {
        setCellColor(cell, cssColorString);
      });
    };

    var checkArrayColors = function (array) {
      array.forEach(function (elem) {
        if (elem.length > 1) {
          isHaveBadCells = true;
          setColorForCellArray(elem, self.BAD_CELL_BACKGROUND_COLOR);
        }
      });
    };

    var valueRows = [];
    var valueColumns = [];
    var valueSegments = [];

    for (var i = 0; i < 9; i++) {
      valueRows[i] = this.getHtmlElementsByValueInRow(i, value);

      isRestoreInactiveCellColor = true;
      setColorForCellArray(valueRows[i], this.GOOD_CELL_BACKGROUND_COLOR); // reset all colors
      isRestoreInactiveCellColor = false;
    }

    if (value == 0) {
      return;
    }

    for (var j = 0; j < 9; j++) {
      valueColumns[j] = this.getHtmlElementsByValueInCol(j, value);

      var p = segmentPosFromIndex(j);
      valueSegments[j] = this.getHtmlElementsByValueInSegment(p.x, p.y, value);
    }

    checkArrayColors(valueRows);
    checkArrayColors(valueColumns);
    checkArrayColors(valueSegments);

    return isHaveBadCells;
  };

  this.updateCell = function (cell, newValue) {
    var position = this.basicTable.cellPosition(cell);

    var lastValue = this.basicTable.at(position.x, position.y);
    this.basicTable.write(position.x, position.y, newValue);

    this.updateColorsFor(lastValue);
    this.updateColorsFor(newValue);
  };

  this.solve = function () {
    //if (this.isSolve) {
    //    return;
    //}

    solveSudoku(this.basicTable);
  };
}

function Sudoku_field(htmlTable, backgroundColor) {
  this.table = new SudokuTableContainer();
  this.htmlTable = htmlTable;

  this.cellPosition = function (tableCell) {
    if (!tableCell.hasOwnProperty("indexInSudoku")) {
      throw Error("Illegal argument");
    }
    return tableCell.indexInSudoku;
  };

  this.at = function (i, j) {
    return this.table.at(i, j);
  };

  this.cellAt = function (i, j) {
    return this.htmlTable.children[i].children[j];
  };


  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      var cell = this.cellAt(i, j);
      cell.style.background = backgroundColor;
      cell.indexInSudoku = {
        x: i,
        y: j
      };
    }
  }


  this.write = function (i, j, value) {
    this.table.write(i, j, value);
    if (value == 0) {
      value = "<br>"; // &nbsp;
    }
    this.cellAt(i, j).innerHTML = value;
  };

  this.writeAbs = function (absolutePos, value) {
    var coord = matrixCoordFromAbs(absolutePos);
    this.write(coord.x, coord.y, value);
  };

  this.getRow = function (rowIndex) {
    var result = this.table.getRow(rowIndex);
    result.htmlElements = [];
    for (var j = 0; j < 9; j++) {
      result.htmlElements[j] = this.cellAt(rowIndex, j);
    }
    return result;
  };

  this.getCol = function (colIndex) {
    var result = this.table.getCol(colIndex);
    result.htmlElements = [];
    for (var i = 0; i < 9; i++) {
      result.htmlElements[i] = this.cellAt(i, colIndex);
    }
    return result;
  };

  this.getSegmentFromPos = function (rowIndex, colIndex) {
    var result = this.table.getSegmentFromPos(rowIndex, colIndex);

    var top = rowIndex - rowIndex % 3;
    var left = colIndex - colIndex % 3;
    result.htmlElements = [];
    for (var i = top; i < top + 3; i++) {
      for (var j = left; j < left + 3; j++) {
        result.htmlElements[(i - top) * 3 + (j - left)] = this.cellAt(i, j);
      }
    }

    return result;
  };

  this.getSegment = function (segmentIndex) {
    var row = segmentIndex - segmentIndex % 3;
    var col = (segmentIndex % 3) * 3;
    return this.getSegmentFromPos(row, col);
  };

  this.isFull = function () {
    for (var i = 0; i < 9 * 9; i++) {
      if (this.table.atAbs(i) == 0) {
        return false;
      }
    }
    return true;
  };
}

function solveSudoku(sudokuField) {
  var isChanged;

  do {
    isChanged = false;
    var sudokuSets = sudokuField.table.getTableSets();

    for (var number = 1; number <= 9; number++) { // Шукаємо де є єдине місце для встановлення числа number
      var f = function (getElementsFunc, translatePosFunc) { // TODO: code refactoring
        for (var i = 0; i < 9; i++) {
          var segment = getElementsFunc(sudokuSets, i, number);
          var index = isOneValueInArray(segment, false);
          if (index >= 0) {
            var pos = translatePosFunc(i, index);
            sudokuSets.blockValuePosition(pos.x, pos.y, number);
            sudokuField.write(pos.x, pos.y, number);
            isChanged = true;
          }
        }
      };

      f(function (sudokuSets, i, number) {
          return sudokuSets.getSet(number).getSegment(i);
        },
        function (i, index) {
          var pos = segmentPosFromIndex(i);
          pos.x += Math.floor(index / 3);
          pos.y += index % 3;
          return pos
        });

      f(function (sudokuSets, i, number) {
          return sudokuSets.getSet(number).getRow(i);
        },
        function (i, index) {
          return {
            x: i,
            y: index
          };
        });

      f(function (sudokuSets, i, number) {
          return sudokuSets.getSet(number).getCol(i);
        },
        function (i, index) {
          return {
            x: index,
            y: i
          };
        });
    }


    /* part of the old solve method */
    var solveArray = [];
    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        solveArray[i * 9 + j] =
          (sudokuField.at(i, j) == 0) ?
          SudokuArrayIntersection(inverseSudokuArray(sudokuField.table.getRow(i)),
            inverseSudokuArray(sudokuField.table.getCol(j)),
            inverseSudokuArray(sudokuField.table.getSegmentFromPos(i, j))) :
          [];
      }
    }

    for (i = 0; i < 9 * 9; i++) {
      if (solveArray[i].length == 1) {
        sudokuField.writeAbs(i, solveArray[i][0]);
        solveArray[i].length = 0;
        isChanged = true;
      }
    }
  } while (isChanged);

  // TODO: зробити перебір, деякі судоку не до кінця вирішуються
  if (!sudokuField.isFull()) {
    alert("Рішень не знайдено");
  }

  return true;
}

function SudokuTableContainer(sudokuArray, newArrayFillValue) {
  if (sudokuArray != undefined) {
    this.table = sudokuArray;
  } else {
    if (newArrayFillValue == undefined) {
      newArrayFillValue = 0;
    }
    this.table = [];
    for (var i = 0; i < 9 * 9; i++) {
      this.table[i] = newArrayFillValue;
    }
  }

  this.at = function (i, j) {
    return this.atAbs(i * 9 + j);
  };

  this.atAbs = function (absoluteIndex) {
    return this.table[absoluteIndex];
  };

  this.write = function (i, j, value) {
    this.writeAbs(i * 9 + j, value);
  };

  this.writeAbs = function (absolutePos, value) {
    this.table[absolutePos] = value;
  };

  this.writeToRow = function (row, value) {
    for (var i = 0; i < 9; i++) {
      if (Array.isArray(value)) {
        this.write(row, i, value[i]);
      } else {
        this.write(row, i, value);
      }
    }
  };

  this.writeToCol = function (col, value) {
    for (var i = 0; i < 9; i++) {
      if (Array.isArray(value)) {
        this.write(i, col, value[i]);
      } else {
        this.write(i, col, value);
      }
    }
  };

  this.writeToSegmentFromPos = function (rowIndex, colIndex, value) {
    var top = rowIndex - rowIndex % 3;
    var left = colIndex - colIndex % 3;

    for (var i = top; i < top + 3; i++) {
      for (var j = left; j < left + 3; j++) {
        if (Array.isArray(value)) {
          this.write(i, j, value[i]);
        } else {
          this.write(i, j, value);
        }
      }
    }
  };

  this.writeToSegment = function (segmentIndex, value) {
    var pos = segmentPosFromIndex(segmentIndex);
    return this.writeToSegmentFromPos(pos.x, pos.y, value);
  };

  this.getRow = function (rowIndex) {
    var result = [];
    for (var j = 0; j < 9; j++) {
      result[j] = this.at(rowIndex, j);
    }
    return result;
  };

  this.getCol = function (colIndex) {
    var result = [];
    for (var i = 0; i < 9; i++) {
      result[i] = this.at(i, colIndex);
    }
    return result;
  };

  this.getSegmentFromPos = function (rowIndex, colIndex) {
    var top = rowIndex - rowIndex % 3;
    var left = colIndex - colIndex % 3;

    var result = [];
    for (var i = top; i < top + 3; i++) {
      for (var j = left; j < left + 3; j++) {
        result[(i - top) * 3 + (j - left)] = this.at(i, j);
      }
    }

    return result;
  };

  this.getSegment = function (segmentIndex) {
    var pos = segmentPosFromIndex(segmentIndex);
    return this.getSegmentFromPos(pos.x, pos.y);
  };

  this.getTableSets = function () {
    return new SudokuFieldSolveSet(this);
  };
}

function SudokuFieldSolveSet(tableContainer) {
  this.blockedPlaceSets = [];

  for (var i = 1; i <= 9; i++) {
    this.blockedPlaceSets[i] = new SudokuTableContainer(undefined, false);
  }

  this.blockPlace = function (row, col) {
    for (var i = 1; i <= 9; i++) {
      this.blockedPlaceSets[i].write(row, col, true);
    }
  };

  this.blockValuePosition = function (row, col, value) {
    this.blockPlace(row, col);
    this.blockedPlaceSets[value].writeToRow(row, true);
    this.blockedPlaceSets[value].writeToCol(col, true);
    this.blockedPlaceSets[value].writeToSegmentFromPos(row, col, true);
  };

  for (var row = 0; row < 9; row++) {
    for (var col = 0; col < 9; col++) {
      var valueAt = tableContainer.at(row, col);
      if (valueAt != 0) {
        this.blockValuePosition(row, col, valueAt);
      }
    }
  }

  this.setValueToPlaceAbs = function (absIndex, value) {
    for (var i = 1; i <= 9; i++) {
      this.blockedPlaceSets[i].writeAbs(absIndex, value);
    }
  };

  this.blockPlaceAbs = function (absIndex) {
    this.setValueToPlaceAbs(absIndex, true)
  };

  this.toString_ = function (number) {
    var resultStr = "";
    if (number == undefined) {
      for (var i = 1; i <= 9; i++) {
        resultStr += i;
        resultStr += ": \n";
        resultStr += this.toString_(i);
      }
    } else {
      for (var j = 0; j < 9; j++) {
        var rowString = this.blockedPlaceSets[number].getRow(j);
        for (var k = 0; k < 9; k++) {
          resultStr += rowString[k] ? "1 " : "0 ";
        }
        resultStr += "\n";
      }
    }
    return resultStr;
  };

  this.getSet = function (number) {
    return this.blockedPlaceSets[number];
  };

  this.toString = function () {
    return this.toString_();
  };
}

let levels = {
  'easy': [
    [0,0,0,0,0,0,0,0,0,5,8,0,0,0,7,0,4,0,1,0,6,2,0,4,8,0,0,3,0,0,0,0,2,6,7,5,0,0,5,3,0,9,1,0,0,2,1,8,6,0,0,0,0,4,0,0,7,8,0,1,2,0,3,0,9,0,4,0,0,0,8,7,0,0,0,0,0,0,0,0,0],
    [0,7,2,0,0,3,9,0,0,4,3,0,0,0,0,0,0,0,0,9,0,4,7,0,0,0,0,0,0,5,0,2,0,0,0,0,0,0,3,8,4,9,7,0,0,0,0,0,0,6,0,4,0,0,0,0,0,0,3,2,0,4,0,0,0,0,0,0,0,0,9,2,0,0,6,1,0,0,5,7,0],
    [2,0,0,0,0,0,0,0,0,7,0,0,0,5,9,0,6,8,0,5,0,0,0,8,1,0,0,9,2,0,4,0,0,0,0,0,0,0,5,0,8,0,7,0,0,0,0,0,0,0,7,0,2,6,0,0,4,6,0,0,0,7,0,3,6,0,7,9,0,0,0,1,0,0,0,0,0,0,0,0,5],
    [0,4,0,0,0,1,0,0,9,0,0,0,0,0,0,0,5,4,5,0,9,4,0,0,0,0,2,1,0,2,0,7,0,0,0,0,0,0,0,8,0,3,0,0,0,0,0,0,0,4,0,2,0,7,2,0,0,0,0,6,8,0,3,3,6,0,0,0,0,0,0,0,8,0,0,5,0,0,0,6,0],
    [0,2,0,0,5,6,0,0,0,0,0,0,0,0,9,0,1,8,5,0,0,0,0,0,2,0,0,0,0,0,7,8,0,0,5,9,0,0,5,0,0,0,8,0,0,2,7,0,0,4,5,0,0,0,0,0,6,0,0,0,0,0,4,4,3,0,6,0,0,0,0,0,0,0,0,5,7,0,0,9,0],
    [0,8,4,5,0,0,0,0,0,0,0,1,0,0,2,6,5,0,0,0,0,0,6,0,0,9,0,0,0,0,0,0,0,5,6,7,0,6,0,4,0,1,0,3,0,2,3,5,0,0,0,0,0,0,0,5,0,0,8,0,0,0,0,0,1,7,9,0,0,3,0,0,0,0,0,0,0,7,4,2,0],
    [2,0,0,0,0,0,0,0,7,0,9,7,0,0,0,0,4,1,8,0,0,0,9,6,0,2,0,0,0,5,0,0,9,4,1,0,0,0,0,3,1,7,0,0,0,0,2,9,4,0,0,7,0,0,0,1,0,2,7,0,0,0,4,9,7,0,0,0,0,8,3,0,5,0,0,0,0,0,0,0,2],
    [1,7,0,0,4,0,0,3,0,0,0,6,7,0,0,0,0,0,0,0,5,0,0,8,0,0,6,2,9,4,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,1,9,4,4,0,0,9,0,0,8,0,0,0,0,0,0,0,5,2,0,0,0,2,0,0,6,0,0,7,5],
    [0,5,8,0,4,0,0,3,0,0,0,0,0,8,7,2,0,5,3,0,0,0,0,0,0,8,7,0,0,9,0,0,6,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,4,0,0,7,0,0,2,1,0,0,0,0,0,0,3,8,0,3,2,1,0,0,0,0,0,4,0,0,5,0,9,2,0],
    [2,0,0,5,0,0,3,0,0,0,5,0,8,7,0,0,0,0,0,0,0,0,0,6,0,0,0,9,3,0,6,8,0,4,2,0,4,0,0,0,0,0,0,0,9,0,2,5,0,3,4,0,1,8,0,0,0,3,0,0,0,0,0,0,0,0,0,1,2,0,9,0,0,0,7,0,0,5,0,0,2],
  ],
  'medium': [
    [1,0,0,0,0,0,0,7,0,5,7,4,1,0,0,0,0,0,0,0,8,0,0,5,4,0,0,7,0,0,0,3,0,1,0,0,9,4,0,5,0,2,0,3,7,0,0,6,0,1,0,0,0,2,0,0,3,8,0,0,7,0,0,0,0,0,0,0,9,3,6,1,0,5,0,0,0,0,0,0,8],
    [1,0,0,3,0,0,0,7,0,0,0,0,0,0,0,0,0,0,5,0,0,0,7,0,3,8,9,0,1,2,0,0,4,0,0,0,8,6,0,0,5,0,0,2,4,0,0,0,8,0,0,7,3,0,4,8,5,0,2,0,0,0,7,0,0,0,0,0,0,0,0,0,0,2,0,0,0,9,0,0,5],
    [0,6,8,1,2,0,0,0,0,0,0,7,0,0,4,0,0,0,9,0,0,8,0,0,0,0,0,0,7,0,0,0,3,2,0,0,4,0,3,0,8,0,1,0,5,0,0,6,4,0,0,0,8,0,0,0,0,0,0,9,0,0,1,0,0,0,3,0,0,4,0,0,0,0,0,0,6,1,9,2,0],
    [1,0,2,0,0,0,0,0,0,0,0,0,0,8,0,2,0,0,0,4,3,5,0,0,1,0,0,0,0,0,3,5,0,0,0,4,0,7,5,2,0,8,6,9,0,8,0,0,0,6,4,0,0,0,0,0,4,0,0,5,9,8,0,0,0,1,0,7,0,0,0,0,0,0,0,0,0,0,3,0,1],
    [0,8,0,4,0,9,0,3,0,0,3,2,0,0,0,0,8,0,6,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,6,3,0,0,6,7,5,8,1,0,0,9,7,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,4,0,5,0,0,0,0,6,7,0,0,1,0,6,0,4,0,5,0],
  ],
  'hard': [
  ],
}

class SudokuGame {
  constructor(tableObj) {
//    this.table = new Sudoku_table(tableId);
    this.table = tableObj;
    // this.currentLevelSeed 
    this.currentDifficultty = 'easy';
    this.currentLevel = -1;
    
    this.achievementListeners = [];
  }

  startNewGame(difficultty) { // 'easy', 'medium', 'hard'
    let dLevels = levels[difficultty];
    if(dLevels != undefined && dLevels.length != 0) {
      this.currentDifficultty = difficultty;
      let newLevel;
      do {
        newLevel = randInteger(0, dLevels.length - 1);
      } while(newLevel == this.currentLevel);
      this.currentLevel = newLevel;
      this.table.loadField(dLevels[this.currentLevel]);
    } else {

    }

    this.showTable();
  }

  reset() {
    if(this.currentLevel != -1) {
      this.table.loadField(levels[this.currentDifficultty][this.currentLevel]);
    }
  }

  showMenu() {
    this.updateContinueButton();
    document.getElementById("main-menu").hidden = false;
    document.getElementById("table-container").hidden = true;
    document.getElementById("game-menu").hidden = true;
  }

  showTable() {
    document.getElementById("reset-button").disabled = this.currentLevel == -1;
    document.getElementById("main-menu").hidden = true;
    document.getElementById("table-container").hidden = false;
    document.getElementById("game-menu").hidden = false;
  }

  continue() {
    if(localStorage["b_tablecurrent-save"] != undefined) {
      this.table.loadFrom("current-save");
      this.showTable();
    }
    this.currentLevel = -1;
  }

  updateContinueButton() {
    document.getElementById("continue-button").hidden = (localStorage["b_tablecurrent-save"] == undefined);
  }

  loadSave() {
    this.currentLevel = -1;
    this.table.load();
    this.showTable();
  }

  backToMenu() {
    this.table.saveTo("current-save");
    this.showMenu();
  }

  achievementButton() {
    let data = localStorage["achievements-easySolved"];
    let getProp = propName => (localStorage[propName] == undefined || localStorage[propName] === false ? "Не отримано" : "Отримано" );
    if (data != undefined) {
      alert("Досягнення:\n\tВирішено судоку: " + getProp("achievements-easySolved")
        // + "\n\tВирішено судоку середнього рівня складності: " + (data.mediumSolved ? "Отримано" : "Не отримано")
        + "\n\tВирішено не складне судоку: " + getProp("achievements-easySolved") // :D
        + "\n\tКількість вирішених судоку:" + (localStorage["solvedCount"] != undefined ? localStorage["solvedCount"] : 0)
      ); 
    }
  }

  checkSolved() {
    let index = this.table.basicTable.table.table.indexOf(0);
    if (index === -1 && this.table.isValidAll()) {
      localStorage["achievements-easySolved"] = true;
      localStorage["solvedCount"] = (localStorage["solvedCount"] == undefined ? 0 : Number.parseInt(localStorage["solvedCount"]) + 1);
      alert("Отримано досягнення: Вирішити судоку");
    }
  }
}