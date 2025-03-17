import {
  createEntity,
  addComponent,
  getComponent
} from "./entity.js";

import {
  GridSettings,
  GameProgress,
  Timer,
  Position,
  Neighbors,
  Revealed,
  Flaggable,
  Counter,
  Explosive,
  Flag,
  AttachedToCell
} from "./components.js";

/**
 * 初期化
 */
export function initGame(world, rows, cols, totalMines) {
  // 既存クリア
  world.entities = [];
  if (world.gameEntity && world.gameEntity.components.Timer.intervalId) {
    clearInterval(world.gameEntity.components.Timer.intervalId);
  }
  world.gameEntity = null;

  // ゲーム管理用エンティティ
  const gameEntity = createEntity();
  addComponent(gameEntity, GridSettings(rows, cols));
  addComponent(gameEntity, GameProgress(totalMines));
  addComponent(gameEntity, Timer());

  world.gameEntity = gameEntity;

  // セルエンティティを作成 (rows*cols)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = createEntity();
      addComponent(cell, Position(r, c));
      addComponent(cell, Revealed(false));   // 初期は閉じている
      addComponent(cell, Flaggable());       // 旗の対象
      addComponent(cell, Counter(0));        // 隣接地雷数0
      addComponent(cell, Explosive());       // 地雷になる可能性(初期は isArmed=false)
      // Neighborsは後で設定
      world.entities.push(cell);
    }
  }

  // Neighbors情報を埋め込む (後述の関数)
  setupNeighbors(world);
}

/**
 * セル同士の隣接関係(Neighbors)をセットアップ
 */
function setupNeighbors(world) {
  const gameEntity = world.gameEntity;
  const grid = getComponent(gameEntity, "GridSettings");
  const rows = grid.rows;
  const cols = grid.cols;

  // すべてのセルエンティティを対象に
  world.entities.forEach(cell => {
    const pos = getComponent(cell, "Position");
    if (!pos) return; // セルでないエンティティはスキップ

    const neighborIds = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = pos.row + dr;
        const nc = pos.col + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        // 該当セルを検索
        const neighbor = world.entities.find(e => {
          const p = getComponent(e, "Position");
          return p && p.row === nr && p.col === nc;
        });
        if (neighbor) {
          neighborIds.push(neighbor.id);
        }
      }
    }
    // Neighborsコンポーネントを追加
    addComponent(cell, Neighbors(neighborIds));
  });
}

/**
 * 初クリック時に地雷配置
 */
export function placeMines(world, clickedCell) {
  const gameEntity = world.gameEntity;
  const grid = getComponent(gameEntity, "GridSettings");
  const progress = getComponent(gameEntity, "GameProgress");

  // クリックしたセルを除外
  const clickedPos = getComponent(clickedCell, "Position");

  let placed = 0;
  while (placed < progress.totalMines) {
    const r = Math.floor(Math.random() * grid.rows);
    const c = Math.floor(Math.random() * grid.cols);
    // クリックセルは除外
    if (r === clickedPos.row && c === clickedPos.col) continue;

    const cell = findCell(world, r, c);
    const explosive = getComponent(cell, "Explosive");
    if (!explosive.isArmed) {
      explosive.isArmed = true; // 地雷化
      placed++;
    }
  }

  // カウンター更新
  calculateAdjacentMines(world);
}

/**
 * 隣接する地雷数をカウントして Counter に設定
 */
function calculateAdjacentMines(world) {
  // セルごとに周囲をチェック
  world.entities.forEach(cell => {
    const explosive = getComponent(cell, "Explosive");
    const counter = getComponent(cell, "Counter");
    const neighbors = getComponent(cell, "Neighbors");
    if (!explosive || !counter || !neighbors) return; // セルでないものや不足コンポーネントは無視

    // 地雷セルならカウンター不要（0のままでも可）
    if (explosive.isArmed) {
      counter.value = 0;
      return;
    }

    // 周囲の地雷数を数える
    let mineCount = 0;
    neighbors.neighborIds.forEach(nid => {
      const neighbor = world.entities.find(e => e.id === nid);
      if (!neighbor) return;
      const nExplosive = getComponent(neighbor, "Explosive");
      if (nExplosive?.isArmed) {
        mineCount++;
      }
    });
    counter.value = mineCount;
  });
}

/**
 * セルを開く
 */
export function openCell(world, cell) {
  const gameEntity = world.gameEntity;
  const progress = getComponent(gameEntity, "GameProgress");
  if (progress.gameOver) return;

  const revealed = getComponent(cell, "Revealed");
  const explosive = getComponent(cell, "Explosive");

  // すでに開いているなら無視
  if (revealed.isOpen) return;
  // 旗がついていたら開けない(仕様による)
  const flagOnThisCell = findFlagOnCell(world, cell.id);
  if (flagOnThisCell) return;

  // オープン
  revealed.isOpen = true;
  progress.revealed++;

  if (explosive.isArmed) {
    // 地雷に当たった
    progress.gameOver = true;
    revealAllMines(world);
    stopTimer(world);
    alert("ゲームオーバー！");
    return;
  }

  // 連鎖
  const counter = getComponent(cell, "Counter");
  if (counter.value === 0) {
    // 周囲も開く
    const neighbors = getComponent(cell, "Neighbors");
    neighbors.neighborIds.forEach(nid => {
      const neighborCell = world.entities.find(e => e.id === nid);
      if (neighborCell) {
        openCell(world, neighborCell);
      }
    });
  }

  // 勝利判定
  const grid = getComponent(gameEntity, "GridSettings");
  if (progress.revealed === grid.rows * grid.cols - progress.totalMines) {
    progress.gameOver = true;
    stopTimer(world);
    saveBestScore(world);
    alert(`勝利！ 時間: ${getComponent(gameEntity, "Timer").time}秒`);
  }
}

/**
 * 全地雷を開示
 */
function revealAllMines(world) {
  world.entities.forEach(cell => {
    const explosive = getComponent(cell, "Explosive");
    const revealed = getComponent(cell, "Revealed");
    if (explosive?.isArmed) {
      revealed.isOpen = true;
    }
  });
}

/**
 * 旗のON/OFF切り替え
 */
export function toggleFlag(world, cell) {
  const gameEntity = world.gameEntity;
  const progress = getComponent(gameEntity, "GameProgress");
  if (progress.gameOver) return;

  // すでに旗があるか
  const flagEntity = findFlagOnCell(world, cell.id);
  if (flagEntity) {
    // 旗を外す
    removeEntity(world, flagEntity);
    progress.flags--;
  } else {
    // 新規旗
    createFlagEntity(world, cell.id);
    progress.flags++;
  }
}

/**
 * 旗エンティティ作成
 */
function createFlagEntity(world, cellId) {
  const flagE = createEntity();
  addComponent(flagE, Flag());
  addComponent(flagE, AttachedToCell(cellId));
  world.entities.push(flagE);
}

/**
 * エンティティをworldから削除
 */
function removeEntity(world, entity) {
  const idx = world.entities.indexOf(entity);
  if (idx !== -1) {
    world.entities.splice(idx, 1);
  }
}

/**
 * 指定cellIdにアタッチされた旗を探す
 */
function findFlagOnCell(world, cellId) {
  return world.entities.find(e =>
    getComponent(e, "Flag") &&
    getComponent(e, "AttachedToCell")?.cellId === cellId
  );
}

/**
 * row,colにあるセルを検索
 */
function findCell(world, row, col) {
  return world.entities.find(e => {
    const p = getComponent(e, "Position");
    return p && p.row === row && p.col === col;
  });
}

/**
 * タイマー開始
 */
export function startTimer(world) {
  const timer = getComponent(world.gameEntity, "Timer");
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
  }
  timer.time = 0;
  timer.intervalId = setInterval(() => {
    timer.time++;
  }, 1000);
}

/**
 * タイマー停止
 */
export function stopTimer(world) {
  const timer = getComponent(world.gameEntity, "Timer");
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
  }
}

/**
 * ベストスコア保存
 */
function saveBestScore(world) {
  const difficulty = world.difficulty;
  const timerVal = getComponent(world.gameEntity, "Timer").time;
  const best = localStorage.getItem(`best_${difficulty}`);
  if (!best || timerVal < best) {
    localStorage.setItem(`best_${difficulty}`, timerVal);
  }
}
