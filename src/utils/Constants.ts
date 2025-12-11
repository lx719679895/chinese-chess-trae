// 棋盘常量
export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 9;
export const DEFAULT_CELL_SIZE = 75;
export let CELL_SIZE = DEFAULT_CELL_SIZE;

// 添加边缘间距常量，确保棋子完整显示
export const EDGE_MARGIN = 30; // 边缘间距，确保棋子完整显示
export let CANVAS_WIDTH = BOARD_WIDTH * CELL_SIZE + EDGE_MARGIN * 2;
export let CANVAS_HEIGHT = BOARD_HEIGHT * CELL_SIZE + EDGE_MARGIN * 2;

// 响应式配置
export const MIN_CELL_SIZE = 50;
export const MAX_CELL_SIZE = 90;
export const RESPONSIVE_THRESHOLD = 800;

// 更新CELL_SIZE的函数
export function updateCellSize(newSize: number): void {
  CELL_SIZE = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, newSize));
  CANVAS_WIDTH = BOARD_WIDTH * CELL_SIZE + EDGE_MARGIN * 2;
  CANVAS_HEIGHT = BOARD_HEIGHT * CELL_SIZE + EDGE_MARGIN * 2;
}

// 棋子类型
export enum PieceType {
  KING = 'king',
  ADVISOR = 'advisor',
  ELEPHANT = 'elephant',
  HORSE = 'horse',
  CHARIOT = 'chariot',
  CANNON = 'cannon',
  SOLDIER = 'soldier'
}

// 棋子颜色
export enum PieceColor {
  RED = 'red',
  BLACK = 'black'
}

// 游戏状态
export enum GameState {
  INIT = 'init',
  PLAYING = 'playing',
  OVER = 'over'
}

// 游戏模式
export enum GameMode {
  PVP = 'pvp', // 玩家 vs 玩家
  PVE = 'pve'  // 玩家 vs 电脑
}

// AI难度
export enum AIDifficulty {
  EASY = 'easy',     // 简单难度
  MEDIUM = 'medium', // 中等难度
  HARD = 'hard'      // 困难难度
}

// AI相关常量
export const AI_CONFIG = {
  // AI思考时间（毫秒），不同难度对应不同的思考时间
  THINK_TIME: {
    [AIDifficulty.EASY]: 500,
    [AIDifficulty.MEDIUM]: 1000,
    [AIDifficulty.HARD]: 2000
  },
  // AI评估权重
  EVALUATION_WEIGHTS: {
    PIECE_VALUE: 100,  // 棋子价值权重
    CHECK_VALUE: 200,  // 将军权重
    MOBILITY_VALUE: 10 // 机动性权重
  }
};

// 棋子名称映射（红方和黑方不同）
export const PIECE_NAMES: Record<PieceColor, Record<PieceType, string>> = {
  [PieceColor.RED]: {
    [PieceType.KING]: '帅',
    [PieceType.ADVISOR]: '仕',
    [PieceType.ELEPHANT]: '相',
    [PieceType.HORSE]: '馬',
    [PieceType.CHARIOT]: '車',
    [PieceType.CANNON]: '炮',
    [PieceType.SOLDIER]: '兵'
  },
  [PieceColor.BLACK]: {
    [PieceType.KING]: '将',
    [PieceType.ADVISOR]: '士',
    [PieceType.ELEPHANT]: '象',
    [PieceType.HORSE]: '馬',
    [PieceType.CHARIOT]: '車',
    [PieceType.CANNON]: '炮',
    [PieceType.SOLDIER]: '卒'
  }
};

// 棋子初始位置
export const INITIAL_POSITIONS: Record<PieceColor, Record<PieceType, number[][]>> = {
  [PieceColor.RED]: {
    [PieceType.KING]: [[4, 9]],
    [PieceType.ADVISOR]: [[3, 9], [5, 9]],
    [PieceType.ELEPHANT]: [[2, 9], [6, 9]],
    [PieceType.HORSE]: [[1, 9], [7, 9]],
    [PieceType.CHARIOT]: [[0, 9], [8, 9]],
    [PieceType.CANNON]: [[1, 7], [7, 7]],
    [PieceType.SOLDIER]: [[0, 6], [2, 6], [4, 6], [6, 6], [8, 6]]
  },
  [PieceColor.BLACK]: {
    [PieceType.KING]: [[4, 0]],
    [PieceType.ADVISOR]: [[3, 0], [5, 0]],
    [PieceType.ELEPHANT]: [[2, 0], [6, 0]],
    [PieceType.HORSE]: [[1, 0], [7, 0]],
    [PieceType.CHARIOT]: [[0, 0], [8, 0]],
    [PieceType.CANNON]: [[1, 2], [7, 2]],
    [PieceType.SOLDIER]: [[0, 3], [2, 3], [4, 3], [6, 3], [8, 3]]
  }
};

// 动画常量
export const ANIMATION_DURATION = 200; // 棋子移动动画持续时间（毫秒）

// 绘制样式
export const PIECE_STYLES = {
  [PieceColor.RED]: {
    fill: '#ffffff',
    stroke: '#ff0000',
    text: '#ff0000'
  },
  [PieceColor.BLACK]: {
    fill: '#ffffff',
    stroke: '#000000',
    text: '#000000'
  }
};

export const HIGHLIGHT_COLOR = 'rgba(0, 255, 0, 0.3)';
export const SELECTED_COLOR = 'rgba(255, 255, 0, 0.5)';
export const VALID_MOVE_COLOR = 'rgba(0, 255, 0, 0.5)';

export const RIVER_TEXT = {
  left: '楚河',
  right: '汉界'
};