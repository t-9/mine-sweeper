let grid;           // 2次元配列でグリッドを管理
let rows, cols;     // グリッドの行数と列数
let mines;          // 地雷の数
let revealed = 0;   // 開かれたマスの数
let flags = 0;      // 立てた旗の数
let timer = 0;      // 経過時間
let interval;       // タイマーのインターバル
let gameOver = false; // ゲーム終了フラグ
let difficulty = 'easy'; // 現在の難易度

// ゲームの初期化
function initGame(r, c, m) {
  rows = r;
  cols = c;
  mines = m;
  revealed = 0;
  flags = 0;
  gameOver = false;
  timer = 0;
  clearInterval(interval);
  document.getElementById('timer').textContent = timer;
  document.getElementById('mines-left').textContent = mines;
  grid = generateGrid(rows, cols);
  renderGrid();
  updateBestScore(difficulty);
}

// グリッドの生成
function generateGrid(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isOpen: false,
      isFlagged: false,
      adjacentMines: 0
    }))
  );
}

// グリッドのレンダリング
function renderGrid() {
  const gridElement = document.getElementById('grid');
  gridElement.innerHTML = '';
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      const cellElement = document.createElement('div');
      cellElement.className = 'cell';
      if (cell.isOpen) {
        cellElement.classList.add('open');
        if (cell.isMine) {
          cellElement.textContent = '💣';
        } else if (cell.adjacentMines > 0) {
          cellElement.textContent = cell.adjacentMines;
          cellElement.dataset.mines = cell.adjacentMines;
        }
      } else if (cell.isFlagged) {
        cellElement.textContent = '🚩';
      }
      cellElement.addEventListener('click', () => handleClick(i, j));
      cellElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleRightClick(i, j);
      });
      gridElement.appendChild(cellElement);
    });
  });
}

// クリック処理
function handleClick(i, j) {
  if (gameOver || grid[i][j].isOpen || grid[i][j].isFlagged) return;
  if (revealed === 0) {
    placeMines(i, j); // 初クリックのマスを避けて地雷配置
    startTimer();
  }
  openCell(i, j);
  if (grid[i][j].isMine) {
    revealMines();
    gameOver = true;
    alert('ゲームオーバー！');
  } else if (revealed === rows * cols - mines) {
    gameOver = true;
    clearInterval(interval);
    saveBestScore(difficulty, timer);
    alert(`勝利！ 時間: ${timer}秒`);
  }
  renderGrid();
}

// 地雷の配置
function placeMines(excludeI, excludeJ) {
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const i = Math.floor(Math.random() * rows);
    const j = Math.floor(Math.random() * cols);
    if ((i !== excludeI || j !== excludeJ) && !grid[i][j].isMine) {
      grid[i][j].isMine = true;
      minesPlaced++;
    }
  }
  calculateAdjacentMines();
}

// 周囲の地雷数を計算
function calculateAdjacentMines() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j].isMine) continue;
      grid[i][j].adjacentMines = countAdjacentMines(i, j);
    }
  }
}

function countAdjacentMines(i, j) {
  let count = 0;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      if (di === 0 && dj === 0) continue;
      const ni = i + di;
      const nj = j + dj;
      if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && grid[ni][nj].isMine) {
        count++;
      }
    }
  }
  return count;
}

// マスを開く（連鎖処理付き）
function openCell(i, j) {
  if (i < 0 || i >= rows || j < 0 || j >= cols || grid[i][j].isOpen || grid[i][j].isFlagged) return;
  grid[i][j].isOpen = true;
  revealed++;
  if (grid[i][j].adjacentMines === 0) {
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (di === 0 && dj === 0) continue;
        openCell(i + di, j + dj);
      }
    }
  }
}

// 旗を立てる
function handleRightClick(i, j) {
  if (gameOver || grid[i][j].isOpen) return;
  if (grid[i][j].isFlagged) {
    grid[i][j].isFlagged = false;
    flags--;
  } else {
    grid[i][j].isFlagged = true;
    flags++;
  }
  document.getElementById('mines-left').textContent = mines - flags;
  renderGrid();
}

// タイマー
function startTimer() {
  interval = setInterval(() => {
    timer++;
    document.getElementById('timer').textContent = timer;
  }, 1000);
}

// 地雷を全て表示（ゲームオーバー時）
function revealMines() {
  grid.forEach(row => row.forEach(cell => {
    if (cell.isMine) cell.isOpen = true;
  }));
}

// ベストスコアの保存と表示
function saveBestScore(difficulty, time) {
  const best = localStorage.getItem(`best_${difficulty}`);
  if (!best || time < best) {
    localStorage.setItem(`best_${difficulty}`, time);
    updateBestScore(difficulty);
  }
}

function updateBestScore(difficulty) {
  const best = localStorage.getItem(`best_${difficulty}`) || '-';
  document.getElementById('best-time').textContent = best;
}

// 難易度選択
document.getElementById('easy').addEventListener('click', () => {
  difficulty = 'easy';
  initGame(9, 9, 10);
});
document.getElementById('medium').addEventListener('click', () => {
  difficulty = 'medium';
  initGame(16, 16, 40);
});
document.getElementById('hard').addEventListener('click', () => {
  difficulty = 'hard';
  initGame(16, 30, 99);
});

// 初期化
initGame(9, 9, 10);