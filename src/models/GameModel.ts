import { PieceColor, GameState, GameMode, AIDifficulty } from '../utils/Constants';
import { PieceModel } from './PieceModel';

export class GameModel {
  // 历史记录，用于悔棋功能
  public history: GameModel[] = [];

  // 对战模式相关属性
  public gameMode: GameMode = GameMode.PVP; // 默认玩家 vs 玩家模式
  public aiDifficulty: AIDifficulty = AIDifficulty.MEDIUM; // 默认中等难度
  public aiPlayerColor: PieceColor = PieceColor.BLACK; // 默认AI执黑

  constructor(
    public pieces: PieceModel[] = [],
    public currentTurn: PieceColor = PieceColor.RED,
    public gameState: GameState = GameState.INIT,
    public winner: PieceColor | null = null,
    public isInCheck: boolean = false,
    public selectedPieceId: string | null = null,
    public validMoves: { x: number; y: number }[] = []
  ) {}

  // 获取指定位置的棋子
  getPieceAt(x: number, y: number): PieceModel | null {
    return this.pieces.find(piece => 
      piece.isAlive && piece.position.x === x && piece.position.y === y
    ) || null;
  }

  // 获取指定颜色的所有棋子
  getPiecesByColor(color: PieceColor): PieceModel[] {
    return this.pieces.filter(piece => piece.isAlive && piece.color === color);
  }

  // 获取当前回合的所有棋子
  getCurrentTurnPieces(): PieceModel[] {
    return this.getPiecesByColor(this.currentTurn);
  }

  // 切换回合
  switchTurn(): void {
    this.currentTurn = this.currentTurn === PieceColor.RED 
      ? PieceColor.BLACK 
      : PieceColor.RED;
  }

  // 设置游戏状态
  setState(state: GameState): void {
    this.gameState = state;
  }

  // 设置获胜者
  setWinner(winner: PieceColor): void {
    this.winner = winner;
    this.gameState = GameState.OVER;
  }

  // 选择棋子
  selectPiece(pieceId: string | null): void {
    this.selectedPieceId = pieceId;
    this.validMoves = [];
  }

  // 设置合法移动位置
  setValidMoves(moves: { x: number; y: number }[]): void {
    this.validMoves = moves;
  }

  // 检查位置是否是合法移动位置
  isValidMove(x: number, y: number): boolean {
    return this.validMoves.some(move => move.x === x && move.y === y);
  }

  // 克隆游戏模型
  clone(): GameModel {
    const cloned = new GameModel(
      this.pieces.map(piece => piece.clone()),
      this.currentTurn,
      this.gameState,
      this.winner,
      this.isInCheck,
      this.selectedPieceId,
      [...this.validMoves]
    );
    // 克隆时不复制历史记录，每个实例应该有自己的历史记录
    cloned.history = [];
    // 复制对战模式相关属性
    cloned.gameMode = this.gameMode;
    cloned.aiDifficulty = this.aiDifficulty;
    cloned.aiPlayerColor = this.aiPlayerColor;
    return cloned;
  }

  // 转换为JSON对象（用于存档）
  toJSON(): any {
    return {
      pieces: this.pieces.map(piece => piece.toJSON()),
      currentTurn: this.currentTurn,
      gameState: this.gameState,
      winner: this.winner,
      isInCheck: this.isInCheck,
      selectedPieceId: this.selectedPieceId,
      validMoves: this.validMoves,
      history: this.history.map(state => state.toJSON()),
      // 保存对战模式相关属性
      gameMode: this.gameMode,
      aiDifficulty: this.aiDifficulty,
      aiPlayerColor: this.aiPlayerColor
    };
  }

  // 从JSON对象创建游戏模型
  static fromJSON(data: any): GameModel {
    const gameModel = new GameModel(
      data.pieces.map((pieceData: any) => PieceModel.fromJSON(pieceData)),
      data.currentTurn,
      data.gameState,
      data.winner,
      data.isInCheck,
      data.selectedPieceId,
      data.validMoves
    );
    
    // 恢复历史记录
    if (data.history) {
      gameModel.history = data.history.map((stateData: any) => GameModel.fromJSON(stateData));
    }
    
    // 恢复对战模式相关属性
    if (data.gameMode) {
      gameModel.gameMode = data.gameMode;
    }
    if (data.aiDifficulty) {
      gameModel.aiDifficulty = data.aiDifficulty;
    }
    if (data.aiPlayerColor) {
      gameModel.aiPlayerColor = data.aiPlayerColor;
    }
    
    return gameModel;
  }
}