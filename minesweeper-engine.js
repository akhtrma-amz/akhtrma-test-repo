/**
 * MinesweeperEngine - Pure game logic for Minesweeper.
 * Works in both browser (via <script>) and Node.js (via require()).
 */
function MinesweeperEngine() {
  this.rows = 0;
  this.cols = 0;
  this.totalMines = 0;
  this.board = [];
  this.state = 'idle'; // idle, playing, won, lost
  this.flagCount = 0;
  this.revealedCount = 0;
  this.minesPlaced = false;
}

MinesweeperEngine.prototype.init = function (rows, cols, mines) {
  this.rows = rows;
  this.cols = cols;
  this.totalMines = mines;
  this.state = 'idle';
  this.flagCount = 0;
  this.revealedCount = 0;
  this.minesPlaced = false;
  this.board = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      row.push({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
      });
    }
    this.board.push(row);
  }
};

MinesweeperEngine.prototype._getNeighbors = function (row, col) {
  var neighbors = [];
  for (var dr = -1; dr <= 1; dr++) {
    for (var dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      var nr = row + dr;
      var nc = col + dc;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
        neighbors.push({ row: nr, col: nc });
      }
    }
  }
  return neighbors;
};

MinesweeperEngine.prototype._placeMines = function (safeRow, safeCol) {
  // Build set of safe cells (clicked cell + neighbors)
  var safeCells = {};
  safeCells[safeRow + ',' + safeCol] = true;
  var neighbors = this._getNeighbors(safeRow, safeCol);
  for (var i = 0; i < neighbors.length; i++) {
    safeCells[neighbors[i].row + ',' + neighbors[i].col] = true;
  }

  // Collect all candidate positions
  var candidates = [];
  for (var r = 0; r < this.rows; r++) {
    for (var c = 0; c < this.cols; c++) {
      if (!safeCells[r + ',' + c]) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  // Shuffle and pick first totalMines candidates
  for (var j = candidates.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var temp = candidates[j];
    candidates[j] = candidates[k];
    candidates[k] = temp;
  }

  var minesToPlace = Math.min(this.totalMines, candidates.length);
  for (var m = 0; m < minesToPlace; m++) {
    this.board[candidates[m].row][candidates[m].col].isMine = true;
  }

  this.minesPlaced = true;
  this._calculateAdjacent();
};

MinesweeperEngine.prototype._calculateAdjacent = function () {
  for (var r = 0; r < this.rows; r++) {
    for (var c = 0; c < this.cols; c++) {
      if (this.board[r][c].isMine) {
        this.board[r][c].adjacentMines = -1;
        continue;
      }
      var count = 0;
      var neighbors = this._getNeighbors(r, c);
      for (var i = 0; i < neighbors.length; i++) {
        if (this.board[neighbors[i].row][neighbors[i].col].isMine) {
          count++;
        }
      }
      this.board[r][c].adjacentMines = count;
    }
  }
};

/**
 * Reveal a cell. Returns an object describing what happened:
 *   { action: 'none'|'reveal'|'flood'|'lose', revealedCells: [...], hitMine: {row, col}|null }
 */
MinesweeperEngine.prototype.reveal = function (row, col) {
  var result = { action: 'none', revealedCells: [], hitMine: null };

  if (this.state === 'won' || this.state === 'lost') {
    return result;
  }

  var cell = this.board[row][col];

  if (cell.isRevealed || cell.isFlagged) {
    return result;
  }

  // First click - place mines
  if (this.state === 'idle') {
    this._placeMines(row, col);
    this.state = 'playing';
  }

  if (cell.isMine) {
    cell.isRevealed = true;
    this.state = 'lost';
    result.action = 'lose';
    result.hitMine = { row: row, col: col };
    return result;
  }

  // Reveal this cell
  if (cell.adjacentMines > 0) {
    cell.isRevealed = true;
    this.revealedCount++;
    result.action = 'reveal';
    result.revealedCells.push({ row: row, col: col });
  } else {
    // Flood fill for empty cells
    result.action = 'flood';
    this._floodFill(row, col, result.revealedCells);
  }

  // Check win
  if (this.revealedCount === this.rows * this.cols - this.totalMines) {
    this.state = 'won';
  }

  return result;
};

MinesweeperEngine.prototype._floodFill = function (startRow, startCol, revealedCells) {
  var queue = [{ row: startRow, col: startCol }];
  var visited = {};

  while (queue.length > 0) {
    var pos = queue.shift();
    var key = pos.row + ',' + pos.col;

    if (visited[key]) continue;
    visited[key] = true;

    var cell = this.board[pos.row][pos.col];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;

    cell.isRevealed = true;
    this.revealedCount++;
    revealedCells.push({ row: pos.row, col: pos.col });

    // If this cell has 0 adjacent mines, expand to neighbors
    if (cell.adjacentMines === 0) {
      var neighbors = this._getNeighbors(pos.row, pos.col);
      for (var i = 0; i < neighbors.length; i++) {
        var nKey = neighbors[i].row + ',' + neighbors[i].col;
        if (!visited[nKey]) {
          queue.push(neighbors[i]);
        }
      }
    }
  }
};

/**
 * Toggle flag on a cell. Returns true if state changed.
 */
MinesweeperEngine.prototype.flag = function (row, col) {
  if (this.state === 'won' || this.state === 'lost') {
    return false;
  }

  var cell = this.board[row][col];

  if (cell.isRevealed) {
    return false;
  }

  if (cell.isFlagged) {
    cell.isFlagged = false;
    this.flagCount--;
  } else {
    cell.isFlagged = true;
    this.flagCount++;
  }

  return true;
};

/**
 * Chord-click on a revealed numbered cell.
 * If the number of adjacent flags equals the cell's number, reveal all adjacent unflagged unrevealed cells.
 * Returns an object like reveal().
 */
MinesweeperEngine.prototype.chord = function (row, col) {
  var result = { action: 'none', revealedCells: [], hitMine: null };

  if (this.state === 'won' || this.state === 'lost') {
    return result;
  }

  var cell = this.board[row][col];

  if (!cell.isRevealed || cell.adjacentMines <= 0) {
    return result;
  }

  // Count adjacent flags
  var neighbors = this._getNeighbors(row, col);
  var adjacentFlags = 0;
  for (var i = 0; i < neighbors.length; i++) {
    if (this.board[neighbors[i].row][neighbors[i].col].isFlagged) {
      adjacentFlags++;
    }
  }

  if (adjacentFlags !== cell.adjacentMines) {
    return result;
  }

  // Reveal all unflagged unrevealed neighbors
  result.action = 'chord';
  for (var j = 0; j < neighbors.length; j++) {
    var n = neighbors[j];
    var ncell = this.board[n.row][n.col];
    if (!ncell.isRevealed && !ncell.isFlagged) {
      if (ncell.isMine) {
        ncell.isRevealed = true;
        this.state = 'lost';
        result.action = 'lose';
        result.hitMine = { row: n.row, col: n.col };
        return result;
      }
      if (ncell.adjacentMines === 0) {
        this._floodFill(n.row, n.col, result.revealedCells);
      } else {
        ncell.isRevealed = true;
        this.revealedCount++;
        result.revealedCells.push({ row: n.row, col: n.col });
      }
    }
  }

  // Check win
  if (this.revealedCount === this.rows * this.cols - this.totalMines) {
    this.state = 'won';
  }

  return result;
};

MinesweeperEngine.prototype.getState = function () {
  return this.state;
};

MinesweeperEngine.prototype.getMineCount = function () {
  return this.totalMines - this.flagCount;
};

MinesweeperEngine.prototype.getCell = function (row, col) {
  return this.board[row][col];
};

// CommonJS export for Node.js, global for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MinesweeperEngine;
}
