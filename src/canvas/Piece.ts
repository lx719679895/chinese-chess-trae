import { PIECE_STYLES, CELL_SIZE, EDGE_MARGIN } from '../utils/Constants';
import { PieceModel } from '../models/PieceModel';

export class Piece {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = context;
  }

  // 绘制单个棋子
  draw(piece: PieceModel): void {
    if (!piece.isAlive) return;

    const { x, y } = piece.position.toScreen();
    const styles = PIECE_STYLES[piece.color];
    const radius = CELL_SIZE * 0.4; // 优化棋子半径，使其与棋盘比例协调

    // 绘制棋子阴影
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    // 绘制棋子立体效果 - 底部深色圆
    this.ctx.beginPath();
    this.ctx.arc(x, y + 2, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.fill();

    // 绘制棋子主体
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // 添加渐变效果
    const gradient = this.ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f0f0f0');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // 绘制棋子边框
    this.ctx.strokeStyle = styles.stroke;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // 绘制棋子高光
    this.ctx.beginPath();
    this.ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fill();

    this.ctx.restore();

    // 绘制棋子文字，使用响应式字体大小
    this.ctx.fillStyle = styles.text;
    const fontSize = Math.floor(radius * 0.8); // 响应式字体大小
    this.ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 优化文字阴影
    (this.ctx as any).textShadow = '1px 1px 2px rgba(255, 255, 255, 0.9)';
    this.ctx.fillText(piece.getChineseName(), x, y);
    (this.ctx as any).textShadow = '';
  }

  // 绘制多个棋子
  drawAll(pieces: PieceModel[]): void {
    pieces.forEach(piece => this.draw(piece));
  }

  // 绘制动画中的棋子
  drawAnimated(piece: PieceModel, progress: number, targetX: number, targetY: number): void {
    if (!piece.isAlive) return;

    // 加上边缘间距，确保动画位置正确
    const startX = piece.position.x * CELL_SIZE + EDGE_MARGIN;
    const startY = piece.position.y * CELL_SIZE + EDGE_MARGIN;
    const endX = targetX * CELL_SIZE + EDGE_MARGIN;
    const endY = targetY * CELL_SIZE + EDGE_MARGIN;

    // 计算当前位置（使用缓动函数使动画更自然）
    const easedProgress = this.easeOutQuad(progress);
    const currentX = startX + (endX - startX) * easedProgress;
    const currentY = startY + (endY - startY) * easedProgress;

    const styles = PIECE_STYLES[piece.color];
    const radius = CELL_SIZE * 0.4; // 优化棋子半径，与静态棋子保持一致

    // 绘制棋子阴影
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    // 绘制棋子立体效果 - 底部深色圆
    this.ctx.beginPath();
    this.ctx.arc(currentX, currentY + 2, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.fill();

    // 绘制棋子主体
    this.ctx.beginPath();
    this.ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
    
    // 添加渐变效果
    const gradient = this.ctx.createRadialGradient(currentX - radius * 0.3, currentY - radius * 0.3, 0, currentX, currentY, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f0f0f0');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // 绘制棋子边框
    this.ctx.strokeStyle = styles.stroke;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // 绘制棋子高光
    this.ctx.beginPath();
    this.ctx.arc(currentX - radius * 0.3, currentY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fill();

    this.ctx.restore();

    // 绘制棋子文字，使用响应式字体大小
    this.ctx.fillStyle = styles.text;
    const fontSize = Math.floor(radius * 0.8); // 响应式字体大小
    this.ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 优化文字阴影
    (this.ctx as any).textShadow = '1px 1px 2px rgba(255, 255, 255, 0.9)';
    this.ctx.fillText(piece.getChineseName(), currentX, currentY);
    (this.ctx as any).textShadow = '';
  }

  // 缓动函数：easeOutQuad
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  // 清除指定位置的棋子
  clear(piece: PieceModel): void {
    const { x, y } = piece.position.toScreen();
    this.ctx.clearRect(
      x - CELL_SIZE * 0.5,
      y - CELL_SIZE * 0.5,
      CELL_SIZE,
      CELL_SIZE
    );
  }

  // 检查点是否在棋子上
  isPointOnPiece(piece: PieceModel, screenX: number, screenY: number): boolean {
    if (!piece.isAlive) return false;

    const { x, y } = piece.position.toScreen();
    const dx = screenX - x;
    const dy = screenY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= CELL_SIZE * 0.4;
  }
}