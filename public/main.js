import { renderSystem, uiSystem } from "./ecs/systems.js";
import { initGame, placeMines, openCell, toggleFlag, startTimer } from "./ecs/game.js";
import { getComponent } from "./ecs/entity.js";

const world = {
  entities: [],
  gameEntity: null,
  difficulty: "easy",

  handleLeftClick(cell) {
    const progress = getComponent(this.gameEntity, "GameProgress");
    // 初クリックなら地雷配置 & タイマー開始
    if (progress.revealed === 0 && progress.flags === 0) {
      placeMines(this, cell);
      startTimer(this);
    }
    openCell(this, cell);
    update();
  },

  handleRightClick(cell) {
    toggleFlag(this, cell);
    update();
  }
};

function startNewGame(difficulty) {
  world.difficulty = difficulty;
  let rows, cols, mines;
  switch (difficulty) {
    case "easy": rows = 9; cols = 9; mines = 10; break;
    case "medium": rows = 16; cols = 16; mines = 40; break;
    case "hard": rows = 16; cols = 30; mines = 99; break;
  }
  initGame(world, rows, cols, mines);
  update();
}

/** 描画更新 */
function update() {
  const gridElement = document.getElementById("grid");
  if (!gridElement) {
    console.error("Grid element not found");
    return;
  }
  renderSystem(world, gridElement);
  uiSystem(world);
}

// 難易度ボタン
document.getElementById("easy").addEventListener("click", () => startNewGame("easy"));
document.getElementById("medium").addEventListener("click", () => startNewGame("medium"));
document.getElementById("hard").addEventListener("click", () => startNewGame("hard"));

startNewGame("easy");
