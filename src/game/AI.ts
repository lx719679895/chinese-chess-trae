import { PieceColor, AIDifficulty, AI_CONFIG } from '../utils/Constants';
import { GameModel } from '../models/GameModel';
import { PieceModel } from '../models/PieceModel';
import { Position } from '../models/Position';
import { Rules } from './Rules';

/**
 * AI决策类，实现不同难度的AI对手
 */
export class AI {
  /**
   * 执行AI决策，返回最佳移动
   * @param gameModel 当前游戏状态
   * @returns 最佳移动的棋子和目标位置，或null表示无合法移动
   */
  static async makeMove(gameModel: GameModel): Promise<{ piece: PieceModel; target: Position } | null> {
    // 检查是否是AI回合
    if (gameModel.currentTurn !== gameModel.aiPlayerColor) {
      return null;
    }

    // 获取AI回合的所有合法移动
    const validMoves = this.getAllValidMoves(gameModel);
    if (validMoves.length === 0) {
      return null;
    }

    // 根据难度等级选择最佳移动
    let bestMove: { piece: PieceModel; target: Position } | null = null;
    
    switch (gameModel.aiDifficulty) {
      case AIDifficulty.EASY:
        bestMove = this.chooseRandomMove(validMoves);
        break;
      case AIDifficulty.MEDIUM:
        bestMove = this.chooseMediumMove(validMoves, gameModel);
        break;
      case AIDifficulty.HARD:
        bestMove = this.chooseHardMove(validMoves, gameModel);
        break;
    }

    // 模拟思考时间，增强游戏体验
    await this.sleep(AI_CONFIG.THINK_TIME[gameModel.aiDifficulty]);
    
    return bestMove;
  }

  /**
   * 获取AI回合的所有合法移动
   * @param gameModel 当前游戏状态
   * @returns 所有合法移动的数组
   */
  private static getAllValidMoves(gameModel: GameModel): { piece: PieceModel; target: Position }[] {
    const validMoves: { piece: PieceModel; target: Position }[] = [];
    
    // 获取AI玩家的所有棋子
    const aiPieces = gameModel.pieces.filter(piece => 
      piece.isAlive && piece.color === gameModel.aiPlayerColor
    );
    
    // 遍历每个棋子，获取所有合法移动
    aiPieces.forEach(piece => {
      const moves = Rules.getValidMoves(piece, gameModel);
      moves.forEach(move => {
        validMoves.push({ piece, target: move });
      });
    });
    
    return validMoves;
  }

  /**
   * 简单难度：随机选择合法移动
   * @param validMoves 所有合法移动
   * @returns 随机选择的移动
   */
  private static chooseRandomMove(validMoves: { piece: PieceModel; target: Position }[]): { piece: PieceModel; target: Position } {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  /**
   * 中等难度：考虑吃子和将军情况
   * @param validMoves 所有合法移动
   * @param gameModel 当前游戏状态
   * @returns 最佳移动
   */
  private static chooseMediumMove(validMoves: { piece: PieceModel; target: Position }[], gameModel: GameModel): { piece: PieceModel; target: Position } {
    // 优先选择能将军的移动
    const checkMoves = validMoves.filter(move => this.wouldBeCheck(move, gameModel));
    if (checkMoves.length > 0) {
      return this.chooseRandomMove(checkMoves);
    }

    // 其次选择能吃子的移动
    const captureMoves = validMoves.filter(move => {
      const targetPiece = gameModel.getPieceAt(move.target.x, move.target.y);
      return !!targetPiece;
    });
    if (captureMoves.length > 0) {
      return this.chooseRandomMove(captureMoves);
    }

    // 最后选择随机移动
    return this.chooseRandomMove(validMoves);
  }

  /**
   * 困难难度：考虑多步走法和局势评估
   * @param validMoves 所有合法移动
   * @param gameModel 当前游戏状态
   * @returns 最佳移动
   */
  private static chooseHardMove(validMoves: { piece: PieceModel; target: Position }[], gameModel: GameModel): { piece: PieceModel; target: Position } {
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    // 评估每个移动的得分
    validMoves.forEach(move => {
      const score = this.evaluateMove(move, gameModel);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    });

    return bestMove;
  }

  /**
   * 评估移动的得分
   * @param move 要评估的移动
   * @param gameModel 当前游戏状态
   * @returns 移动的得分
   */
  private static evaluateMove(move: { piece: PieceModel; target: Position }, gameModel: GameModel): number {
    // 创建游戏模型副本
    const gameCopy = gameModel.clone();
    
    // 找到副本中的对应棋子
    const pieceCopy = gameCopy.pieces.find(p => p.id === move.piece.id);
    if (!pieceCopy) {
      return 0;
    }

    // 执行移动
    const targetPieceCopy = gameCopy.getPieceAt(move.target.x, move.target.y);
    if (targetPieceCopy) {
      targetPieceCopy.isAlive = false;
    }
    pieceCopy.position = move.target;

    // 基础得分：棋子价值
    let score = 0;
    
    // 评估吃子得分
    if (targetPieceCopy) {
      score += this.getPieceValue(targetPieceCopy) * AI_CONFIG.EVALUATION_WEIGHTS.PIECE_VALUE;
    }

    // 评估将军得分
    const opponentColor = gameCopy.currentTurn === PieceColor.RED ? PieceColor.BLACK : PieceColor.RED;
    if (Rules.isInCheck(opponentColor, gameCopy)) {
      score += AI_CONFIG.EVALUATION_WEIGHTS.CHECK_VALUE;
    }

    // 评估机动性得分
    const aiPieces = gameCopy.getPiecesByColor(gameModel.aiPlayerColor);
    const totalValidMoves = aiPieces.reduce((count, piece) => {
      return count + Rules.getValidMoves(piece, gameCopy).length;
    }, 0);
    score += totalValidMoves * AI_CONFIG.EVALUATION_WEIGHTS.MOBILITY_VALUE;

    return score;
  }

  /**
   * 获取棋子的价值
   * @param piece 棋子
   * @returns 棋子的价值
   */
  private static getPieceValue(piece: PieceModel): number {
    // 简单的棋子价值评估
    const values: Record<string, number> = {
      king: 1000,    // 将/帅
      advisor: 100,  // 士/仕
      elephant: 150, // 象/相
      horse: 300,    // 马/傌
      chariot: 500,  // 车/俥
      cannon: 250,   // 炮/砲
      soldier: 50    // 兵/卒
    };
    
    return values[piece.type] || 0;
  }

  /**
   * 检查移动后是否会将军
   * @param move 要检查的移动
   * @param gameModel 当前游戏状态
   * @returns 是否会将军
   */
  private static wouldBeCheck(move: { piece: PieceModel; target: Position }, gameModel: GameModel): boolean {
    // 创建游戏模型副本
    const gameCopy = gameModel.clone();
    
    // 找到副本中的对应棋子
    const pieceCopy = gameCopy.pieces.find(p => p.id === move.piece.id);
    if (!pieceCopy) {
      return false;
    }

    // 执行移动
    const targetPieceCopy = gameCopy.getPieceAt(move.target.x, move.target.y);
    if (targetPieceCopy) {
      targetPieceCopy.isAlive = false;
    }
    pieceCopy.position = move.target;

    // 检查是否将军
    const opponentColor = gameCopy.currentTurn === PieceColor.RED ? PieceColor.BLACK : PieceColor.RED;
    return Rules.isInCheck(opponentColor, gameCopy);
  }

  /**
   * 模拟延迟，增强游戏体验
   * @param ms 延迟时间（毫秒）
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}