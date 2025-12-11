import { PieceType, PieceColor, PIECE_NAMES } from '../utils/Constants';
import { Position } from './Position';

export class PieceModel {
  constructor(
    public type: PieceType,
    public color: PieceColor,
    public position: Position,
    public isAlive: boolean = true,
    public id: string = Math.random().toString(36).substr(2, 9)
  ) {}

  // 检查棋子是否可以移动到目标位置（仅基本检查，不包含规则判定）
  canMoveTo(target: Position): boolean {
    return this.isAlive && !this.position.equals(target);
  }

  // 移动棋子到目标位置
  moveTo(target: Position): void {
    this.position = target;
  }

  // 获取棋子的中文名称
  getChineseName(): string {
    return PIECE_NAMES[this.color][this.type];
  }

  // 克隆棋子
  clone(): PieceModel {
    return new PieceModel(
      this.type,
      this.color,
      this.position.clone(),
      this.isAlive,
      this.id
    );
  }

  // 转换为JSON对象（用于序列化）
  toJSON(): any {
    return {
      id: this.id,
      type: this.type,
      color: this.color,
      position: { x: this.position.x, y: this.position.y },
      isAlive: this.isAlive
    };
  }

  // 从JSON对象创建棋子
  static fromJSON(data: any): PieceModel {
    return new PieceModel(
      data.type,
      data.color,
      new Position(data.position.x, data.position.y),
      data.isAlive,
      data.id
    );
  }
}