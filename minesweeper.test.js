var { describe, it } = require('node:test');
var assert = require('node:assert');
var MinesweeperEngine = require('./minesweeper-engine.js');

describe('Board creation', function () {
  it('creates correct dimensions for Beginner (9x9, 10 mines)', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    assert.strictEqual(engine.rows, 9);
    assert.strictEqual(engine.cols, 9);
    assert.strictEqual(engine.totalMines, 10);
    assert.strictEqual(engine.board.length, 9);
    assert.strictEqual(engine.board[0].length, 9);
  });

  it('creates correct dimensions for Intermediate (16x16, 40 mines)', function () {
    var engine = new MinesweeperEngine();
    engine.init(16, 16, 40);
    assert.strictEqual(engine.rows, 16);
    assert.strictEqual(engine.cols, 16);
    assert.strictEqual(engine.totalMines, 40);
    assert.strictEqual(engine.board.length, 16);
    assert.strictEqual(engine.board[0].length, 16);
  });

  it('creates correct dimensions for Expert (16x30, 99 mines)', function () {
    var engine = new MinesweeperEngine();
    engine.init(16, 30, 99);
    assert.strictEqual(engine.rows, 16);
    assert.strictEqual(engine.cols, 30);
    assert.strictEqual(engine.totalMines, 99);
    assert.strictEqual(engine.board.length, 16);
    assert.strictEqual(engine.board[0].length, 30);
  });

  it('initializes all cells as unrevealed, unflagged, no mines', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = engine.getCell(r, c);
        assert.strictEqual(cell.isMine, false);
        assert.strictEqual(cell.isRevealed, false);
        assert.strictEqual(cell.isFlagged, false);
        assert.strictEqual(cell.adjacentMines, 0);
      }
    }
  });
});

describe('Mine placement and count', function () {
  it('places correct number of mines for Beginner', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);
    var mineCount = 0;
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (engine.getCell(r, c).isMine) mineCount++;
      }
    }
    assert.strictEqual(mineCount, 10);
  });

  it('places correct number of mines for Intermediate', function () {
    var engine = new MinesweeperEngine();
    engine.init(16, 16, 40);
    engine.reveal(8, 8);
    var mineCount = 0;
    for (var r = 0; r < 16; r++) {
      for (var c = 0; c < 16; c++) {
        if (engine.getCell(r, c).isMine) mineCount++;
      }
    }
    assert.strictEqual(mineCount, 40);
  });

  it('places correct number of mines for Expert', function () {
    var engine = new MinesweeperEngine();
    engine.init(16, 30, 99);
    engine.reveal(8, 15);
    var mineCount = 0;
    for (var r = 0; r < 16; r++) {
      for (var c = 0; c < 30; c++) {
        if (engine.getCell(r, c).isMine) mineCount++;
      }
    }
    assert.strictEqual(mineCount, 99);
  });
});

describe('First-click safety', function () {
  it('ensures clicked cell has no mine', function () {
    // Run multiple times to be confident
    for (var attempt = 0; attempt < 20; attempt++) {
      var engine = new MinesweeperEngine();
      engine.init(9, 9, 10);
      engine.reveal(4, 4);
      assert.strictEqual(engine.getCell(4, 4).isMine, false);
    }
  });

  it('ensures all 8 neighbors of first click have no mines', function () {
    for (var attempt = 0; attempt < 20; attempt++) {
      var engine = new MinesweeperEngine();
      engine.init(9, 9, 10);
      engine.reveal(4, 4);
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          assert.strictEqual(engine.getCell(4 + dr, 4 + dc).isMine, false,
            'Cell (' + (4 + dr) + ',' + (4 + dc) + ') should not be a mine');
        }
      }
    }
  });

  it('ensures first click safety at corner (0,0)', function () {
    for (var attempt = 0; attempt < 20; attempt++) {
      var engine = new MinesweeperEngine();
      engine.init(9, 9, 10);
      engine.reveal(0, 0);
      assert.strictEqual(engine.getCell(0, 0).isMine, false);
      assert.strictEqual(engine.getCell(0, 1).isMine, false);
      assert.strictEqual(engine.getCell(1, 0).isMine, false);
      assert.strictEqual(engine.getCell(1, 1).isMine, false);
    }
  });
});

describe('Adjacent mine count calculation', function () {
  it('correctly counts adjacent mines', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4); // trigger mine placement

    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = engine.getCell(r, c);
        if (cell.isMine) continue;

        var expected = 0;
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            var nr = r + dr;
            var nc = c + dc;
            if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
              if (engine.getCell(nr, nc).isMine) expected++;
            }
          }
        }
        assert.strictEqual(cell.adjacentMines, expected,
          'Cell (' + r + ',' + c + ') adjacentMines should be ' + expected);
      }
    }
  });
});

describe('Flood-fill reveal', function () {
  it('reveals connected empty cells and numbered borders', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    var result = engine.reveal(4, 4);

    // First click on safe zone should reveal at least 1 cell
    assert.ok(result.revealedCells.length >= 1, 'Should reveal at least 1 cell');

    // If the first cell had 0 adjacent mines, more cells should be revealed
    if (engine.getCell(4, 4).adjacentMines === 0) {
      assert.ok(result.revealedCells.length > 1, 'Flood fill should reveal multiple cells for empty cell');
    }

    // All revealed cells should be marked as revealed
    for (var i = 0; i < result.revealedCells.length; i++) {
      var rc = result.revealedCells[i];
      assert.strictEqual(engine.getCell(rc.row, rc.col).isRevealed, true);
    }
  });

  it('does not reveal mines during flood fill', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);

    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = engine.getCell(r, c);
        if (cell.isMine) {
          assert.strictEqual(cell.isRevealed, false,
            'Mine at (' + r + ',' + c + ') should not be revealed by flood fill');
        }
      }
    }
  });

  it('flood fill on a board with no mines reveals all cells', function () {
    var engine = new MinesweeperEngine();
    engine.init(5, 5, 0);
    var result = engine.reveal(2, 2);

    assert.strictEqual(result.action, 'flood');
    assert.strictEqual(result.revealedCells.length, 25);
    assert.strictEqual(engine.getState(), 'won');
  });
});

describe('Flagging', function () {
  it('can flag and unflag a cell', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);

    assert.strictEqual(engine.flag(0, 0), true);
    assert.strictEqual(engine.getCell(0, 0).isFlagged, true);
    assert.strictEqual(engine.flagCount, 1);

    assert.strictEqual(engine.flag(0, 0), true);
    assert.strictEqual(engine.getCell(0, 0).isFlagged, false);
    assert.strictEqual(engine.flagCount, 0);
  });

  it('cannot flag a revealed cell', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);

    // Cell (4,4) is revealed
    assert.strictEqual(engine.flag(4, 4), false);
    assert.strictEqual(engine.getCell(4, 4).isFlagged, false);
  });

  it('flagged cell cannot be revealed', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);

    // Flag a cell first
    engine.flag(0, 0);
    assert.strictEqual(engine.getCell(0, 0).isFlagged, true);

    // Try to reveal it - should do nothing
    var result = engine.reveal(0, 0);
    assert.strictEqual(result.action, 'none');
    assert.strictEqual(engine.getCell(0, 0).isRevealed, false);
  });
});

describe('Mine counter', function () {
  it('tracks flag count correctly', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);

    assert.strictEqual(engine.getMineCount(), 10);

    engine.flag(0, 0);
    assert.strictEqual(engine.getMineCount(), 9);

    engine.flag(0, 1);
    assert.strictEqual(engine.getMineCount(), 8);

    engine.flag(0, 0); // unflag
    assert.strictEqual(engine.getMineCount(), 9);
  });

  it('mine counter can go negative', function () {
    var engine = new MinesweeperEngine();
    engine.init(5, 5, 1);

    // Flag 2 cells when there is only 1 mine
    engine.flag(0, 0);
    engine.flag(0, 1);
    assert.strictEqual(engine.getMineCount(), -1);
  });
});

describe('Win detection', function () {
  it('game state is won when all non-mine cells revealed', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4); // place mines

    // Reveal all non-mine cells
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = engine.getCell(r, c);
        if (!cell.isMine && !cell.isRevealed) {
          engine.reveal(r, c);
        }
      }
    }

    assert.strictEqual(engine.getState(), 'won');
  });

  it('revealed count matches total non-mine cells on win', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);

    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = engine.getCell(r, c);
        if (!cell.isMine && !cell.isRevealed) {
          engine.reveal(r, c);
        }
      }
    }

    assert.strictEqual(engine.revealedCount, 9 * 9 - 10);
  });
});

describe('Loss detection', function () {
  it('game state is lost when mine is revealed', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4); // place mines

    // Find a mine and reveal it
    var mineFound = false;
    for (var r = 0; r < 9 && !mineFound; r++) {
      for (var c = 0; c < 9 && !mineFound; c++) {
        if (engine.getCell(r, c).isMine) {
          var result = engine.reveal(r, c);
          assert.strictEqual(result.action, 'lose');
          assert.deepStrictEqual(result.hitMine, { row: r, col: c });
          mineFound = true;
        }
      }
    }

    assert.strictEqual(engine.getState(), 'lost');
    assert.ok(mineFound, 'Should have found a mine');
  });

  it('cannot reveal or flag after game is lost', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);

    // Find and click a mine
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (engine.getCell(r, c).isMine) {
          engine.reveal(r, c);
          break;
        }
      }
      if (engine.getState() === 'lost') break;
    }

    // Try to reveal another cell
    var result = engine.reveal(0, 0);
    assert.strictEqual(result.action, 'none');

    // Try to flag
    assert.strictEqual(engine.flag(1, 1), false);
  });
});

describe('Game state transitions', function () {
  it('starts in idle state', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    assert.strictEqual(engine.getState(), 'idle');
  });

  it('transitions to playing on first reveal', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);
    assert.ok(engine.getState() === 'playing' || engine.getState() === 'won');
  });

  it('mines are not placed before first reveal', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    assert.strictEqual(engine.minesPlaced, false);

    engine.reveal(4, 4);
    assert.strictEqual(engine.minesPlaced, true);
  });
});

describe('Chord-click', function () {
  it('auto-reveals unflagged neighbors when flag count matches number', function () {
    // Set up a controlled scenario
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4); // place mines

    // Find a revealed cell with adjacentMines > 0
    var targetCell = null;
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = engine.getCell(r, c);
        if (cell.isRevealed && cell.adjacentMines > 0) {
          // Check if we can identify its mine neighbors to flag them
          var mineNeighbors = [];
          var nonMineUnrevealed = [];
          for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              var nr = r + dr;
              var nc = c + dc;
              if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                var neighbor = engine.getCell(nr, nc);
                if (neighbor.isMine && !neighbor.isRevealed) {
                  mineNeighbors.push({ row: nr, col: nc });
                } else if (!neighbor.isMine && !neighbor.isRevealed && !neighbor.isFlagged) {
                  nonMineUnrevealed.push({ row: nr, col: nc });
                }
              }
            }
          }

          if (mineNeighbors.length === cell.adjacentMines && nonMineUnrevealed.length > 0) {
            targetCell = { row: r, col: c, mines: mineNeighbors, safe: nonMineUnrevealed };
            break;
          }
        }
      }
      if (targetCell) break;
    }

    if (targetCell) {
      // Flag all mine neighbors
      for (var m = 0; m < targetCell.mines.length; m++) {
        engine.flag(targetCell.mines[m].row, targetCell.mines[m].col);
      }

      var prevRevealed = engine.revealedCount;
      var chordResult = engine.chord(targetCell.row, targetCell.col);

      assert.ok(chordResult.revealedCells.length > 0, 'Chord should reveal cells');
      assert.ok(engine.revealedCount > prevRevealed, 'Revealed count should increase');

      // Check that revealed cells are safe (not mines)
      for (var k = 0; k < chordResult.revealedCells.length; k++) {
        var rc = chordResult.revealedCells[k];
        assert.strictEqual(engine.getCell(rc.row, rc.col).isMine, false,
          'Chord-revealed cell should not be a mine');
      }
    } else {
      // If no suitable cell was found (unlikely), skip gracefully
      assert.ok(true, 'No suitable cell found for chord test in this random layout');
    }
  });

  it('does not chord when flag count does not match number', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);

    // Find a revealed numbered cell
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = engine.getCell(r, c);
        if (cell.isRevealed && cell.adjacentMines > 0) {
          // Do not flag anything - chord should do nothing
          var result = engine.chord(r, c);
          assert.strictEqual(result.action, 'none');
          return;
        }
      }
    }
  });

  it('chord does nothing on unrevealed cell', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);

    // Find an unrevealed cell
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (!engine.getCell(r, c).isRevealed) {
          var result = engine.chord(r, c);
          assert.strictEqual(result.action, 'none');
          return;
        }
      }
    }
  });

  it('chord triggers loss if wrongly flagged and reveals mine', function () {
    var engine = new MinesweeperEngine();
    engine.init(9, 9, 10);
    engine.reveal(4, 4);

    // Find a revealed numbered cell and deliberately flag wrong cells
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = engine.getCell(r, c);
        if (cell.isRevealed && cell.adjacentMines > 0) {
          // Find unrevealed non-mine neighbors to flag (wrongly)
          var wrongFlags = [];
          var mineNeighborExists = false;
          for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              var nr = r + dr;
              var nc = c + dc;
              if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                var neighbor = engine.getCell(nr, nc);
                if (!neighbor.isRevealed && !neighbor.isMine && !neighbor.isFlagged) {
                  wrongFlags.push({ row: nr, col: nc });
                }
                if (neighbor.isMine && !neighbor.isRevealed && !neighbor.isFlagged) {
                  mineNeighborExists = true;
                }
              }
            }
          }

          // We need exactly adjacentMines wrong flags AND at least one unflagged mine neighbor
          if (wrongFlags.length >= cell.adjacentMines && mineNeighborExists) {
            for (var f = 0; f < cell.adjacentMines; f++) {
              engine.flag(wrongFlags[f].row, wrongFlags[f].col);
            }
            var result = engine.chord(r, c);
            assert.strictEqual(result.action, 'lose');
            assert.strictEqual(engine.getState(), 'lost');
            return;
          }
        }
      }
    }
    // If scenario cannot be constructed, that is okay
    assert.ok(true, 'Could not construct wrong-flag chord scenario');
  });
});
