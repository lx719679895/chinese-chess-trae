import { CELL_SIZE, BOARD_WIDTH, BOARD_HEIGHT, EDGE_MARGIN } from '../utils/Constants';

export class Position {
  constructor(public x: number, public y: number) {}

  // 棋盘坐标转换为屏幕坐标（线的交叉点）
  toScreen(): { x: number; y: number } {
    // 添加边缘间距，确保棋子完整显示
    return {
      x: this.x * CELL_SIZE + EDGE_MARGIN,
      y: this.y * CELL_SIZE + EDGE_MARGIN
    };
  }

  // 屏幕坐标转换为棋盘坐标
  static fromScreen(screenX: number, screenY: number): Position {
    // 减去边缘间距，确保坐标转换正确
    const adjustedX = screenX - EDGE_MARGIN;
    const adjustedY = screenY - EDGE_MARGIN;
    
    // 计算最接近的交叉点
    let gridX = Math.round(adjustedX / CELL_SIZE);
    let gridY = Math.round(adjustedY / CELL_SIZE);
    
    // 确保坐标在棋盘范围内
    gridX = Math.max(0, Math.min(BOARD_WIDTH, gridX));
    gridY = Math.max(0, Math.min(BOARD_HEIGHT, gridY));
    
    return new Position(gridX, gridY);
  }

  // 检查坐标是否在棋盘范围内
  isValid(): boolean {
    return this.x >= 0 && this.x <= BOARD_WIDTH && this.y >= 0 && this.y <= BOARD_HEIGHT;
  }

  // 克隆位置
  clone(): Position {
    return new Position(this.x, this.y);
  }

  // 比较两个位置是否相等
  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  // 计算两个位置之间的距离
  distance(other: Position): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 计算曼哈顿距离
  manhattanDistance(other: Position): number {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }

  // 转换为字符串表示
  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  // 从字符串解析位置
  static fromString(str: string): Position {
    const match = str.match(/\((\d+),\s*(\d+)\)/);
    if (match) {
      return new Position(parseInt(match[1]), parseInt(match[2]));
    }
    throw new Error('Invalid position string');
  }
}