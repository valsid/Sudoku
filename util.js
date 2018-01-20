function randInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandBlock() {
  var array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  var swapCount = randInteger(20, 50);
  for (var i = 0; i < swapCount; i++) {
    var swap = function (i, j) {
      var tmp = array[i];
      array[i] = array[j];
      array[j] = tmp;
    };
    swap(randInteger(0, 8), randInteger(0, 8));
  }
  return array;
}

function isContains(array, value) {
  return array.indexOf(value) != -1;
}

function inverseSudokuArray(array) {
  var result = [];
  for (var i = 1; i <= 9; i++) {
    if (array.indexOf(i) == -1) {
      result.push(i);
    }
  }
  return result;
}

function SudokuArrayIntersection(arr1, arr2, arr3) {
  var result = [];
  for (var i = 0; i <= 9; i++) {
    if (arr1.indexOf(i) != -1 &&
      arr2.indexOf(i) != -1 &&
      arr3.indexOf(i) != -1) {

      result.push(i);
    }
  }
  return result;
}

var FIELD_WIDTH = 9;

function matrixCoordFromAbs(abs) {
  return {
    x: Math.floor(abs / FIELD_WIDTH),
    y: abs % FIELD_WIDTH
  };
}

function segmentPosFromIndex(index) {
  var row = index - index % 3;
  var col = (index % 3) * 3;
  return {
    x: row,
    y: col
  };
}

function fillSudokuArray(array, bottom, top, left, right, fillValue) {
  var resultArray;
  for (var i = top; i < bottom; i++) {
    for (var j = left; j < right; j++) {
      array[i * 9 + j] = fillValue;
    }
  }
  return resultArray;
}

/**
 * result == -2  -> many values
 * result == -1  -> not found
 * result >=  0  -> index
 */
function isOneValueInArray(array, value) {
  var index = array.indexOf(value);
  if (index == -1) {
    return -1;
  }

  if (index == array.lastIndexOf(value)) { // Якщо в рядку лише одне значення false
    return index;
  } else {
    return -2;
  }
}