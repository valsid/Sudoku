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
    let propName = 'b_table' + slotName;
    if(localStorage[propName] != undefined) {
      let data = JSON.parse(localStorage[propName]);
      let inactive = JSON.parse(localStorage['inactive_table' + slotName]);
      return this.loadField(data, inactive);
    }
  };

  this.load = function () {
    // TODO: localStorage security
    var saveSlotId = document.getElementById("save_slot").value.toString();
    if (localStorage["b_table" + saveSlotId] == undefined ||
      localStorage["inactive_table" + saveSlotId] == undefined) {
      return undefined;
    }

    return this.loadField(JSON.parse(localStorage["b_table" + saveSlotId]), JSON.parse(localStorage["inactive_table" + saveSlotId]));
  };

  this.loadField = function(data, blockedCells) {
    // TODO: update colors
    this.basicTable.table.table = data.slice(0);
    this.enabledCells = blockedCells != undefined ? blockedCells : data.map(v => v == 0 ? true : false);
    this.writeDataToSudokuTable(this.basicTable.table.table, this.enabledCells);
    this.isSolve = false;

    this.updateColors();

    return {'data': data, 'inactive': blockedCells};
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

    if(!solveSudoku(this.basicTable)) {
      alert("Рішень не знайдено");      
    }
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

  this.updateView = function() {
    for(let i = 0; i < 9 * 9; i++) {
//      console.log(this.table.atAbs(i));
      this.writeAbs(i, this.table.atAbs(i));
    }
  }

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
  return sudokuField.isFull();
}

function SudokuTableContainer(sudokuArray, newArrayFillValue) {
  // TODO: constants instead of magic numbers

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

    let k = 0;
    for (var i = top; i < top + 3; i++) {
      for (var j = left; j < left + 3; j++) {
        if (Array.isArray(value)) {
          this.write(i, j, value[k++]);
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

  function swap_util(i, j, getter, setter) {
    let between = (n, min, max) => (n >= min && n <= max);
    let validIndex = (n) => between(n, 0, 8);

    if(Number.isInteger(i) && Number.isInteger(j)
      && validIndex(i) && validIndex(j)) {
      let iRow = getter.call(this, i);
      let jRow = getter.call(this, j);
      setter.call(this, i, jRow);
      setter.call(this, j, iRow);
      return true;
    }
    return false;
  }

  this.swapRows = function(i, j) {
    return swap_util.call(this, i, j, this.getRow, this.writeToRow);
  }

  this.swapColumns = function(i, j) {
    return swap_util.call(this, i, j, this.getCol, this.writeToCol);
  }

  this.transponce = function() {
    let rows = [];
    let columns = [];
    for(let i = 0; i < 9; i++) {
      rows[i] = this.getRow(i);
      columns[i] = this.getCol(i);
    }

    for(let i = 0; i < 9; i++) {
      this.writeToRow(i, columns[i]);
      this.writeToCol(i, rows[i]);
    }
  }

  this.swapRowSegments = function(i, j) {  // 0..2
    // TODO: check
    for(let k = 0; k < 3; k++) {
      swap_util.call(this, i * 3 + k, j * 3 + k, this.getSegment, this.writeToSegment);
    }
    return true;
  }

  this.swapColumnSegments = function(i, j) {  // 0..2
    // TODO: check
    for(let k = 0; k < 3; k++) {
      swap_util.call(this, i + k * 3, j + k * 3, this.getSegment, this.writeToSegment);
    }
    return true;
  }

  // this.rotate = function(angle) {  // '90', '180', '270'

  // }

  // this.flip = function(transformType) {  // 'horizontal', 'vertical'

  // }
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

class SudokuGame {
  constructor(tableObj) {
//    this.table = new Sudoku_table(tableId);
    this.table = tableObj;
    // this.currentLevelSeed 
    this.currentDifficulty = 'easy';
    this.currentLevel = undefined;
    
    this.achievementListeners = [];
  }

  startNewGame(difficulty) { // 'easy', 'medium', 'hard'
    this.currentLevel = this.generate(difficulty);
    this.showTable();
  }

  reset() {
    if(this.currentLevel != undefined) {
      this.table.loadField(this.currentLevel);
    }
  }

  showMenu() {
    this.updateContinueButton();
    document.getElementById("main-menu").hidden = false;
    document.getElementById("table-container").hidden = true;
    document.getElementById("game-menu").hidden = true;
  }

  showTable() {
    document.getElementById("reset-button").disabled = this.currentLevel === undefined;
    document.getElementById("main-menu").hidden = true;
    document.getElementById("table-container").hidden = false;
    document.getElementById("game-menu").hidden = false;
  }

  continue() {
    this.currentLevel = undefined;
    if(localStorage["b_tablecurrent-save"] != undefined) {
      let data = this.table.loadFrom("current-save");
      if(data) {
        for(let i = 0; i < data.inactive.length; i++) {
          if(data.inactive[i] === true) {
            data.data[i] = 0;
          }
        }
        this.currentLevel = data.data;
        this.showTable();
      }
    }
  }

  updateContinueButton() {
    document.getElementById("continue-button").hidden = (localStorage["b_tablecurrent-save"] == undefined);
  }

  loadSave() {
    this.currentLevel = undefined;
    let data = this.table.load()
    if(data) {
      this.showTable();      
    } else {
      alert("Збереження не знайдено");      
    }
  }

  backToMenu() {
    this.currentLevel = undefined; 
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
      if (localStorage["achievements-easySolved"] !== true) {
        alert("Отримано досягнення: Вирішити судоку");
      }
      localStorage["achievements-easySolved"] = true;
      localStorage["solvedCount"] = (localStorage["solvedCount"] == undefined ? 1 : Number.parseInt(localStorage["solvedCount"]) + 1);
    }
  }

  generate(difficulty) { // 'easy', 'medium', 'hard'
    function randPair() {
      let r = () => randInteger(0, 2);
      let segment = r() * 3;
      let i = r();
      let j;
      do {
        j = r();
      } while(i == j);
      return {'i': segment + i, 'j': segment + j};
    }

    let opList = [
      function(field) {
        let pair = randPair();
        field.swapRows(pair.i, pair.j);
      },
      function(field) {
        let pair = randPair();
        field.swapColumns(pair.i, pair.j);
      },
      field => field.swapRowSegments(randInteger(0, 2), randInteger(0, 2)),
      field => field.swapColumnSegments(randInteger(0, 2), randInteger(0, 2)),
      field => field.transponce(),
    ];

    // build basic field:
    let basicField = new SudokuTableContainer();
    let baseRow = getRandBlock();
    let order = [0, 3, 6, 1, 4, 7, 2, 5, 8];
    for(let i of order) {
      basicField.writeToRow(i, baseRow);
      baseRow.push(baseRow.shift());
    }

    // shuffle:
    let n = randInteger(70, 100);
    for(let i = 0; i < n; i++) {
      opList[randInteger(0, opList.length - 1)](basicField);
    }

    // purification:

    this.table.loadField(basicField.table);

    let cellsOnFinalField;
    switch(difficulty) {
      case 'easy':
        cellsOnFinalField = 4 * 9 + randInteger(-2, 2);
        break;
      case 'medium':
        cellsOnFinalField = 4 * 9 - 4 + randInteger(-2, 2);
        break;
      case 'hard':
        cellsOnFinalField = 3 * 9 + randInteger(-2, 2);
        break;
      default:
        if(Number.isInteger(difficulty) && difficulty > 16 && difficulty < 9 * 9) {  // bigger value easiest
          cellsOnFinalField = difficulty;
        } else {
          cellsOnFinalField = 4*9;
        }
    }
    let cellsToRemove = 81 - cellsOnFinalField;


    let visited = {};
    visited[cellsToRemove] = new Set();
    let deletedCellsStack = [];
    while (cellsToRemove != 0) {
      if(visited[cellsToRemove] === undefined) {
        visited[cellsToRemove] = new Set(visited[cellsToRemove + 1]);
      }
      if(visited[cellsToRemove].size == 81) {
        console.log(cellsToRemove, 'roll back');
        visited[cellsToRemove].clear();
        visited[cellsToRemove] = undefined;
        cellsToRemove++;
        continue;
      }
      // clear random cell
      // TODO: inverse rand method, when visited set more than half full
      console.log(cellsToRemove, visited[cellsToRemove].size);
      let randomCell;
      do {
        randomCell = randInteger(0, basicField.table.length - 1);
      } while(visited[cellsToRemove].has(randomCell) /*|| basicField.atAbs(randomCell) == 0*/);
      visited[cellsToRemove].add(randomCell);
      deletedCellsStack.push( {cell: randomCell, value: basicField.atAbs(randomCell)} );
      basicField.writeAbs(randomCell, 0);

      // check solution
      this.table.loadField(basicField.table);
      if(solveSudoku(this.table.basicTable)) {
        cellsToRemove--;
      } else {
        console.log(cellsToRemove, 'wrong cell');
        let val = deletedCellsStack.pop();
        basicField.writeAbs(val.cell, val.value);
      }
    }

    this.table.loadField(basicField.table);    

    return basicField.table;
  }
}
