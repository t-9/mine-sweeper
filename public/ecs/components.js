/** 
 * Position: セルなどが持つ行(row), 列(col) 
 */
export function Position(row, col) {
  return {
    name: "Position",
    row,
    col
  };
}

/**
 * Neighbors: 隣接セルの entityId を持つ
 * （初期化時に周囲8方向のセルを検索してIDを格納する）
 */
export function Neighbors(ids = []) {
  return {
    name: "Neighbors",
    neighborIds: ids // [entityId1, entityId2, ...]
  };
}

/**
 * Revealed: セルが「開いているか」を示す
 */
export function Revealed(isOpen = false) {
  return {
    name: "Revealed",
    isOpen
  };
}

/**
 * Flaggable: 「旗の対象にできるセル」を示す
 * Minesweeperでは全セルが旗の対象だが、別ゲームでは限定セルだけ持つ等も可能
 */
export function Flaggable() {
  return {
    name: "Flaggable"
  };
}

/**
 * Counter: 隣接する爆発物(地雷)の数を保持
 */
export function Counter(value = 0) {
  return {
    name: "Counter",
    value
  };
}

/**
 * Explosive: 「爆発物を内包している」ことを示す (地雷など)
 * isArmed: trueなら爆発有効
 */
export function Explosive() {
  return {
    name: "Explosive",
    isArmed: false
  };
}

/**
 * Flag: 旗エンティティ用コンポーネント
 */
export function Flag() {
  return {
    name: "Flag"
    // 将来的に旗の色や耐久度などを追加可能
  };
}

/**
 * AttachedToCell: どのセルにアタッチしているか
 */
export function AttachedToCell(cellId) {
  return {
    name: "AttachedToCell",
    cellId
  };
}

/**
 * GridSettings: グリッド全体の設定
 */
export function GridSettings(rows, cols) {
  return {
    name: "GridSettings",
    rows,
    cols
  };
}

/**
 * GameProgress: ゲームの進捗(開いた数, 旗数, 終了フラグなど)
 */
export function GameProgress(totalMines) {
  return {
    name: "GameProgress",
    totalMines,
    revealed: 0,
    flags: 0,
    gameOver: false
  };
}

/**
 * Timer: 時間管理
 */
export function Timer() {
  return {
    name: "Timer",
    time: 0,
    intervalId: null
  };
}
