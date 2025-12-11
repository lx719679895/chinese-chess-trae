import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, RIVER_TEXT, EDGE_MARGIN } from '../utils/Constants';
import { Position } from '../models/Position';

export class Board {
  private ctx: CanvasRenderingContext2D;

  // 使用边缘间距作为偏移量，确保棋盘居中显示
  private offsetX: number = EDGE_MARGIN;
  private offsetY: number = EDGE_MARGIN;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = context;
  }

  // 绘制棋盘
  draw(): void {
    // 1. 绘制棋盘背景
    this.drawBackground();
    // 2. 绘制网格线
    this.drawGrid();
    // 3. 绘制楚河汉界
    this.drawRiver();
    // 4. 绘制九宫格
    this.drawPalace();
  }

  // 绘制棋盘背景
  private drawBackground(): void {
    // 使用图片中的浅棕色背景
    this.ctx.fillStyle = '#e6d9c2'; // 浅棕色背景，与图片匹配
    this.ctx.fillRect(
      this.offsetX,
      this.offsetY,
      BOARD_WIDTH * CELL_SIZE,
      BOARD_HEIGHT * CELL_SIZE
    );
  }

  // 绘制网格线
  private drawGrid(): void {
    this.ctx.strokeStyle = '#654321'; // 深棕色线条，较细
    
    // 线条宽度固定为1.5px，与图片匹配
    this.ctx.lineWidth = 1.5;
    this.ctx.lineCap = 'square';
    this.ctx.lineJoin = 'miter'; // 使用miter，接近方形效果

    // 绘制垂直线（8个单元格需要9条竖线，索引0-8）
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.offsetX + x * CELL_SIZE,
        this.offsetY
      );
      this.ctx.lineTo(
        this.offsetX + x * CELL_SIZE,
        this.offsetY + BOARD_HEIGHT * CELL_SIZE
      );
      this.ctx.stroke();
    }

    // 绘制水平线（9个单元格需要9条横线，索引0-9）
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.offsetX,
        this.offsetY + y * CELL_SIZE
      );
      this.ctx.lineTo(
        this.offsetX + BOARD_WIDTH * CELL_SIZE,
        this.offsetY + y * CELL_SIZE
      );
      
      this.ctx.stroke();
    }
  }

  // 绘制楚河汉界
  private drawRiver(): void {
    // 1. 绘制楚河汉界区域背景，只占一行空间
    this.ctx.fillStyle = '#f5f5dc'; // 浅黄色背景，增强层次感
    this.ctx.fillRect(
      this.offsetX,
      this.offsetY + 4.5 * CELL_SIZE - CELL_SIZE / 2,
      BOARD_WIDTH * CELL_SIZE,
      CELL_SIZE
    );
    
    // 2. 绘制楚河汉界文字，使用传统横排设计，与标准中国象棋布局匹配
    this.ctx.fillStyle = '#654321'; // 深棕色文字，符合传统风格
    const fontSize = Math.floor(CELL_SIZE * 0.35); // 适中的字体大小
    this.ctx.font = `bold ${fontSize}px "SimHei", "Microsoft YaHei", "PingFang SC", serif`; // 使用黑体字，更符合传统风格
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 添加文字阴影，增强立体感
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    this.ctx.shadowBlur = 2;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    
    // 楚河文字 - 显示在左侧，位置调整为25%，更符合传统布局
    this.ctx.fillText(
      RIVER_TEXT.left,
      this.offsetX + BOARD_WIDTH * CELL_SIZE * 0.25,
      this.offsetY + 4.5 * CELL_SIZE // 调整y坐标，使其位于楚河汉界区域正中间（只占一行空间）
    );
    
    // 汉界文字 - 显示在右侧，位置调整为75%，更符合传统布局
    this.ctx.fillText(
      RIVER_TEXT.right,
      this.offsetX + BOARD_WIDTH * CELL_SIZE * 0.75,
      this.offsetY + 4.5 * CELL_SIZE // 调整y坐标，使其位于楚河汉界区域正中间（只占一行空间）
    );
    
    // 重置阴影
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  // 绘制九宫格
  private drawPalace(): void {
    this.ctx.strokeStyle = '#654321'; // 深棕色线条，与网格线一致
    this.ctx.lineWidth = 1.5; // 线条宽度固定为1.5px，与网格线一致
    this.ctx.lineJoin = 'miter'; // 使用miter，接近方形效果

    // 红方九宫格对角线
    this.ctx.beginPath();
    this.ctx.moveTo(
      this.offsetX + 3 * CELL_SIZE,
      this.offsetY + 7 * CELL_SIZE
    );
    this.ctx.lineTo(
      this.offsetX + 5 * CELL_SIZE,
      this.offsetY + 9 * CELL_SIZE
    );
    this.ctx.moveTo(
      this.offsetX + 5 * CELL_SIZE,
      this.offsetY + 7 * CELL_SIZE
    );
    this.ctx.lineTo(
      this.offsetX + 3 * CELL_SIZE,
      this.offsetY + 9 * CELL_SIZE
    );
    this.ctx.stroke();

    // 黑方九宫格对角线
    this.ctx.beginPath();
    this.ctx.moveTo(
      this.offsetX + 3 * CELL_SIZE,
      this.offsetY + 0 * CELL_SIZE
    );
    this.ctx.lineTo(
      this.offsetX + 5 * CELL_SIZE,
      this.offsetY + 2 * CELL_SIZE
    );
    this.ctx.moveTo(
      this.offsetX + 5 * CELL_SIZE,
      this.offsetY + 0 * CELL_SIZE
    );
    this.ctx.lineTo(
      this.offsetX + 3 * CELL_SIZE,
      this.offsetY + 2 * CELL_SIZE
    );
    this.ctx.stroke();
  }

  // 高亮指定位置（优化：适应棋子在线交叉点的位置）
  highlightPosition(position: Position, color: string = 'rgba(0, 255, 0, 0.3)'): void {
    this.ctx.fillStyle = color;
    
    // 优化：高亮棋子所在的交叉点周围区域，而不是整个格子
    // 使用圆形高亮，更适合棋子的形状
    this.ctx.beginPath();
    this.ctx.arc(
      this.offsetX + position.x * CELL_SIZE,
      this.offsetY + position.y * CELL_SIZE,
      CELL_SIZE * 0.45, // 圆形半径
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  // 高亮多个位置
  highlightPositions(positions: Position[], color: string = 'rgba(0, 255, 0, 0.3)'): void {
    positions.forEach(position => this.highlightPosition(position, color));
  }

  // 清除棋盘（清除整个Canvas区域）
  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  // 屏幕坐标转换为棋盘坐标
  screenToBoard(screenX: number, screenY: number): Position {
    return Position.fromScreen(screenX, screenY);
  }

  // 棋盘坐标转换为屏幕坐标
  boardToScreen(boardX: number, boardY: number): { x: number; y: number } {
    return new Position(boardX, boardY).toScreen();
  }

  // 检查屏幕坐标是否在棋盘范围内
  isInBoard(screenX: number, screenY: number): boolean {
    const pos = this.screenToBoard(screenX, screenY);
    return pos.isValid();
  }

  // 获取单元格中心点坐标
  getCellCenter(x: number, y: number): { x: number; y: number } {
    return {
      x: this.offsetX + x * CELL_SIZE + CELL_SIZE / 2,
      y: this.offsetY + y * CELL_SIZE + CELL_SIZE / 2
    };
  }
}