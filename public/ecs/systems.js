import {
  hasComponent,
  getComponent
} from "./entity.js";

/**
 * renderSystem
 * すべてのセルを描画し、もし旗がアタッチされていれば表示
 */
export function renderSystem(world, gridElement) {
  if (!gridElement) {
    console.error("Grid element is required for rendering");
    return;
  }

  gridElement.innerHTML = "";

  // Game管理エンティティ
  const gameEntity = world.gameEntity;
  if (!gameEntity) return;

  const gridSettings = getComponent(gameEntity, "GridSettings");
  const progress = getComponent(gameEntity, "GameProgress");
  const rows = gridSettings.rows;
  const cols = gridSettings.cols;

  gridElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;

  // セルだけ抽出 (Positionを持っているエンティティ)
  const cellEntities = world.entities.filter(e => hasComponent(e, "Position"));

  // ソート
  cellEntities.sort((a, b) => {
    const posA = getComponent(a, "Position");
    const posB = getComponent(b, "Position");
    if (posA.row === posB.row) {
      return posA.col - posB.col;
    }
    return posA.row - posB.row;
  });

  // 描画
  cellEntities.forEach(cell => {
    const cellDiv = document.createElement("div");
    cellDiv.className = "cell";

    const revealed = getComponent(cell, "Revealed");
    const explosive = getComponent(cell, "Explosive");
    const counter = getComponent(cell, "Counter");

    if (revealed?.isOpen) {
      // 開いているセル
      cellDiv.classList.add("open");
      if (explosive && explosive.isArmed) {
        // 地雷マーク
        cellDiv.textContent = "💣";
      } else if (counter && counter.value > 0) {
        cellDiv.textContent = counter.value;
        cellDiv.dataset.mines = counter.value;
      }
    } else {
      // 閉じているセル → 旗の有無をチェック
      const flagOnThisCell = world.entities.find(e =>
        hasComponent(e, "Flag") &&
        hasComponent(e, "AttachedToCell") &&
        getComponent(e, "AttachedToCell").cellId === cell.id
      );
      if (flagOnThisCell) {
        cellDiv.textContent = "🚩";
      }
    }

    // 左クリック
    cellDiv.addEventListener("click", () => {
      world.handleLeftClick(cell);
    });

    // 右クリック
    cellDiv.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      world.handleRightClick(cell);
    });

    gridElement.appendChild(cellDiv);
  });
}

/**
 * uiSystem:
 * 残り地雷数(= totalMines - flags)やタイマー等を表示
 */
export function uiSystem(world) {
  const gameEntity = world.gameEntity;
  if (!gameEntity) return;

  const progress = getComponent(gameEntity, "GameProgress");
  const timerComp = getComponent(gameEntity, "Timer");

  const minesLeft = progress.totalMines - progress.flags;
  document.getElementById("mines-left").textContent = minesLeft;
  document.getElementById("timer").textContent = timerComp.time;

  // ベストスコア
  const best = localStorage.getItem(`best_${world.difficulty}`) || "-";
  document.getElementById("best-time").textContent = best;
}

/**
 * timerTickSystem:
 * 1秒ごとに呼ばれ、Timerを進める
 */
export function timerTickSystem(world) {
  const timer = getComponent(world.gameEntity, "Timer");
  if (timer) {
    timer.time++;
  }
}
