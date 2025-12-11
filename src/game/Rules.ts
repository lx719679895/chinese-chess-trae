import { PieceType, PieceColor } from '../utils/Constants';
import { PieceModel } from '../models/PieceModel';
import { Position } from '../models/Position';
import { GameModel } from '../models/GameModel';

export class Rules {
  // 检查棋子是否可以移动到目标位置
  static canMove(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    // 检查目标位置是否在棋盘范围内
    const targetPos = new Position(targetX, targetY);
    if (!targetPos.isValid()) {
      return false;
    }

    // 检查目标位置是否有己方棋子
    const targetPiece = gameModel.getPieceAt(targetX, targetY);
    if (targetPiece && targetPiece.color === piece.color) {
      return false;
    }

    // 根据棋子类型检查移动规则
    switch (piece.type) {
      case PieceType.KING:
        return this.canMoveKing(piece, targetX, targetY, gameModel);
      case PieceType.ADVISOR:
        return this.canMoveAdvisor(piece, targetX, targetY, gameModel);
      case PieceType.ELEPHANT:
        return this.canMoveElephant(piece, targetX, targetY, gameModel);
      case PieceType.HORSE:
        return this.canMoveHorse(piece, targetX, targetY, gameModel);
      case PieceType.CHARIOT:
        return this.canMoveChariot(piece, targetX, targetY, gameModel);
      case PieceType.CANNON:
        return this.canMoveCannon(piece, targetX, targetY, gameModel);
      case PieceType.SOLDIER:
        return this.canMoveSoldier(piece, targetX, targetY, gameModel);
      default:
        return false;
    }
  }

  // 将/帅移动规则
  private static canMoveKing(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    // 检查是否在九宫格内
    if (!this.isInPalace(targetX, targetY, piece.color)) {
      return false;
    }

    // 只能走一步（上下左右）
    const dx = Math.abs(targetX - piece.position.x);
    const dy = Math.abs(targetY - piece.position.y);
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      // 检查是否会被将军
      return !this.wouldBeInCheckAfterMove(piece, targetX, targetY, gameModel);
    }

    return false;
  }

  // 士/仕移动规则
  private static canMoveAdvisor(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    // 检查是否在九宫格内
    if (!this.isInPalace(targetX, targetY, piece.color)) {
      return false;
    }

    // 只能走斜线（一步）
    const dx = Math.abs(targetX - piece.position.x);
    const dy = Math.abs(targetY - piece.position.y);
    if (dx === 1 && dy === 1) {
      // 检查是否会被将军
      return !this.wouldBeInCheckAfterMove(piece, targetX, targetY, gameModel);
    }

    return false;
  }

  // 象/相移动规则
  private static canMoveElephant(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    // 检查是否过界
    if (piece.color === PieceColor.RED && targetY < 5) {
      return false;
    }
    if (piece.color === PieceColor.BLACK && targetY > 4) {
      return false;
    }

    // 只能走田字格
    const dx = Math.abs(targetX - piece.position.x);
    const dy = Math.abs(targetY - piece.position.y);
    if (dx === 2 && dy === 2) {
      // 检查象眼是否被堵
      const eyeX = (piece.position.x + targetX) / 2;
      const eyeY = (piece.position.y + targetY) / 2;
      if (!gameModel.getPieceAt(eyeX, eyeY)) {
        // 检查是否会被将军
        return !this.wouldBeInCheckAfterMove(piece, targetX, targetY, gameModel);
      }
    }

    return false;
  }

  // 马/傌移动规则
  private static canMoveHorse(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    // 检查是否走日字
    const dx = Math.abs(targetX - piece.position.x);
    const dy = Math.abs(targetY - piece.position.y);
    if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) {
      // 检查马脚是否被堵
      if (dx === 1) {
        // 横向移动一格，纵向移动两格
        const blockX = piece.position.x;
        const blockY = (piece.position.y + targetY) / 2;
        if (!gameModel.getPieceAt(blockX, blockY)) {
          // 检查是否会被将军
          return !this.wouldBeInCheckAfterMove(piece, targetX, targetY, gameModel);
        }
      } else {
        // 纵向移动一格，横向移动两格
        const blockX = (piece.position.x + targetX) / 2;
        const blockY = piece.position.y;
        if (!gameModel.getPieceAt(blockX, blockY)) {
          // 检查是否会被将军
          return !this.wouldBeInCheckAfterMove(piece, targetX, targetY, gameModel);
        }
      }
    }

    return false;
  }

  // 车/俥移动规则
  private static canMoveChariot(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    // 只能走直线
    if (piece.position.x !== targetX && piece.position.y !== targetY) {
      return false;
    }

    // 检查路径上是否有其他棋子
    if (!this.isPathClear(piece, targetX, targetY, gameModel)) {
      return false;
    }

    // 检查是否会被将军
    return !this.wouldBeInCheckAfterMove(piece, targetX, targetY, gameModel);
  }

  // 炮/砲移动规则
  private static canMoveCannon(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    // 检查是否走直线
    if (piece.position.x !== targetX && piece.position.y !== targetY) {
      return false;
    }

    const targetPiece = gameModel.getPieceAt(targetX, targetY);
    
    if (targetPiece) {
      // 吃子：需要有一个炮架
      return this.hasExactlyOneCannonMount(piece, targetX, targetY, gameModel);
    } else {
      // 移动：路径必须清空
      return this.isPathClear(piece, targetX, targetY, gameModel);
    }
  }

  // 兵/卒移动规则
  private static canMoveSoldier(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    const dx = Math.abs(targetX - piece.position.x);
    const dy = Math.abs(targetY - piece.position.y);

    // 只能走一步
    if (dx + dy !== 1) {
      return false;
    }

    // 未过河：只能前进
    if (piece.color === PieceColor.RED && piece.position.y > 4) {
      if (targetY >= piece.position.y) {
        return false;
      }
    } else if (piece.color === PieceColor.BLACK && piece.position.y < 5) {
      if (targetY <= piece.position.y) {
        return false;
      }
    }
    // 过河后：可以左右移动，但不能后退
    else {
      if (piece.color === PieceColor.RED && targetY > piece.position.y) {
        return false;
      }
      if (piece.color === PieceColor.BLACK && targetY < piece.position.y) {
        return false;
      }
    }

    // 检查是否会被将军
    return !this.wouldBeInCheckAfterMove(piece, targetX, targetY, gameModel);
  }

  // 检查位置是否在九宫内
  private static isInPalace(x: number, y: number, color: PieceColor): boolean {
    // 九宫格范围
    const xRange = [3, 4, 5];
    const yRangeRed = [7, 8, 9];
    const yRangeBlack = [0, 1, 2];

    return xRange.includes(x) && (color === PieceColor.RED ? yRangeRed : yRangeBlack).includes(y);
  }

  // 检查路径是否清空
  private static isPathClear(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    const startX = piece.position.x;
    const startY = piece.position.y;

    // 横向移动
    if (startY === targetY) {
      const minX = Math.min(startX, targetX);
      const maxX = Math.max(startX, targetX);
      for (let x = minX + 1; x < maxX; x++) {
        if (gameModel.getPieceAt(x, startY)) {
          return false;
        }
      }
    }
    // 纵向移动
    else if (startX === targetX) {
      const minY = Math.min(startY, targetY);
      const maxY = Math.max(startY, targetY);
      for (let y = minY + 1; y < maxY; y++) {
        if (gameModel.getPieceAt(startX, y)) {
          return false;
        }
      }
    }

    return true;
  }

  // 检查是否有且只有一个炮架
  private static hasExactlyOneCannonMount(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    const startX = piece.position.x;
    const startY = piece.position.y;
    let mountCount = 0;

    // 横向移动
    if (startY === targetY) {
      const minX = Math.min(startX, targetX);
      const maxX = Math.max(startX, targetX);
      for (let x = minX + 1; x < maxX; x++) {
        if (gameModel.getPieceAt(x, startY)) {
          mountCount++;
        }
      }
    }
    // 纵向移动
    else if (startX === targetX) {
      const minY = Math.min(startY, targetY);
      const maxY = Math.max(startY, targetY);
      for (let y = minY + 1; y < maxY; y++) {
        if (gameModel.getPieceAt(startX, y)) {
          mountCount++;
        }
      }
    }

    return mountCount === 1;
  }

  // 检查是否被将军
  static isInCheck(color: PieceColor, gameModel: GameModel): boolean {
    // 找到将/帅
    const king = gameModel.pieces.find(piece => 
      piece.isAlive && piece.type === PieceType.KING && piece.color === color
    );

    if (!king) {
      return false;
    }

    // 检查将/帅照面
    if (this.isKingFaceToFace(gameModel)) {
      return true;
    }

    // 检查对方所有棋子是否能攻击到将/帅
    const opponentColor = color === PieceColor.RED ? PieceColor.BLACK : PieceColor.RED;
    const opponentPieces = gameModel.getPiecesByColor(opponentColor);

    return opponentPieces.some(piece => {
      // 临时禁用将军检查，只检查移动是否合法
      return this.canMoveWithoutCheck(piece, king.position.x, king.position.y, gameModel);
    });
  }

  // 检查将/帅是否直接照面
  private static isKingFaceToFace(gameModel: GameModel): boolean {
    // 找到红方将和黑方将
    const redKing = gameModel.pieces.find(piece => 
      piece.isAlive && piece.type === PieceType.KING && piece.color === PieceColor.RED
    );
    const blackKing = gameModel.pieces.find(piece => 
      piece.isAlive && piece.type === PieceType.KING && piece.color === PieceColor.BLACK
    );

    if (!redKing || !blackKing) {
      return false;
    }

    // 检查将/帅是否在同一列
    if (redKing.position.x !== blackKing.position.x) {
      return false;
    }

    // 检查将/帅之间是否有其他棋子
    const x = redKing.position.x;
    const minY = Math.min(redKing.position.y, blackKing.position.y);
    const maxY = Math.max(redKing.position.y, blackKing.position.y);

    for (let y = minY + 1; y < maxY; y++) {
      if (gameModel.getPieceAt(x, y)) {
        return false;
      }
    }

    // 将/帅直接照面，返回true
    return true;
  }

  // 不考虑将军的情况下检查移动是否合法
  private static canMoveWithoutCheck(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    const targetPos = new Position(targetX, targetY);
    if (!targetPos.isValid()) {
      return false;
    }

    const targetPiece = gameModel.getPieceAt(targetX, targetY);
    if (targetPiece && targetPiece.color === piece.color) {
      return false;
    }

    switch (piece.type) {
      case PieceType.KING:
        return this.isInPalace(targetX, targetY, piece.color) && 
               ((Math.abs(targetX - piece.position.x) === 1 && Math.abs(targetY - piece.position.y) === 0) || 
                (Math.abs(targetX - piece.position.x) === 0 && Math.abs(targetY - piece.position.y) === 1));
      case PieceType.ADVISOR:
        return this.isInPalace(targetX, targetY, piece.color) && 
               Math.abs(targetX - piece.position.x) === 1 && Math.abs(targetY - piece.position.y) === 1;
      case PieceType.ELEPHANT:
        if ((piece.color === PieceColor.RED && targetY < 5) || 
            (piece.color === PieceColor.BLACK && targetY > 4)) {
          return false;
        }
        const dx = Math.abs(targetX - piece.position.x);
        const dy = Math.abs(targetY - piece.position.y);
        if (dx === 2 && dy === 2) {
          const eyeX = (piece.position.x + targetX) / 2;
          const eyeY = (piece.position.y + targetY) / 2;
          return !gameModel.getPieceAt(eyeX, eyeY);
        }
        return false;
      case PieceType.HORSE:
        const hdx = Math.abs(targetX - piece.position.x);
        const hdy = Math.abs(targetY - piece.position.y);
        if ((hdx === 1 && hdy === 2) || (hdx === 2 && hdy === 1)) {
          if (hdx === 1) {
            const blockX = piece.position.x;
            const blockY = (piece.position.y + targetY) / 2;
            return !gameModel.getPieceAt(blockX, blockY);
          } else {
            const blockX = (piece.position.x + targetX) / 2;
            const blockY = piece.position.y;
            return !gameModel.getPieceAt(blockX, blockY);
          }
        }
        return false;
      case PieceType.CHARIOT:
        if (piece.position.x !== targetX && piece.position.y !== targetY) {
          return false;
        }
        return this.isPathClear(piece, targetX, targetY, gameModel);
      case PieceType.CANNON:
        if (piece.position.x !== targetX && piece.position.y !== targetY) {
          return false;
        }
        const targetPiece = gameModel.getPieceAt(targetX, targetY);
        if (targetPiece) {
          return this.hasExactlyOneCannonMount(piece, targetX, targetY, gameModel);
        } else {
          return this.isPathClear(piece, targetX, targetY, gameModel);
        }
      case PieceType.SOLDIER:
        const sdx = Math.abs(targetX - piece.position.x);
        const sdy = Math.abs(targetY - piece.position.y);
        if (sdx + sdy !== 1) {
          return false;
        }
        if (piece.color === PieceColor.RED && piece.position.y > 4 && targetY >= piece.position.y) {
          return false;
        }
        if (piece.color === PieceColor.BLACK && piece.position.y < 5 && targetY <= piece.position.y) {
          return false;
        }
        if (piece.color === PieceColor.RED && targetY > piece.position.y) {
          return false;
        }
        if (piece.color === PieceColor.BLACK && targetY < piece.position.y) {
          return false;
        }
        return true;
      default:
        return false;
    }
  }

  // 检查移动后是否会被将军
  private static wouldBeInCheckAfterMove(piece: PieceModel, targetX: number, targetY: number, gameModel: GameModel): boolean {
    // 创建游戏模型副本
    const gameCopy = gameModel.clone();
    
    // 找到副本中的对应棋子
    const pieceCopy = gameCopy.pieces.find(p => p.id === piece.id);
    if (!pieceCopy) {
      return false;
    }

    // 找到目标位置的棋子（如果有）
    const targetPieceCopy = gameCopy.getPieceAt(targetX, targetY);
    
    // 模拟移动
    if (targetPieceCopy) {
      targetPieceCopy.isAlive = false;
    }
    pieceCopy.position = new Position(targetX, targetY);

    // 检查是否被将军
    return this.isInCheck(piece.color, gameCopy);
  }

  // 获取所有合法移动位置
  static getValidMoves(piece: PieceModel, gameModel: GameModel): Position[] {
    const validMoves: Position[] = [];

    // 遍历所有可能的位置
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        if (this.canMove(piece, x, y, gameModel)) {
          validMoves.push(new Position(x, y));
        }
      }
    }

    return validMoves;
  }

  // 检查游戏是否结束
  static checkGameOver(gameModel: GameModel): PieceColor | null {
    // 检查红方是否还有将
    const redKingAlive = gameModel.pieces.some(piece => 
      piece.isAlive && piece.type === PieceType.KING && piece.color === PieceColor.RED
    );

    // 检查黑方是否还有将
    const blackKingAlive = gameModel.pieces.some(piece => 
      piece.isAlive && piece.type === PieceType.KING && piece.color === PieceColor.BLACK
    );

    if (!redKingAlive) {
      return PieceColor.BLACK;
    }

    if (!blackKingAlive) {
      return PieceColor.RED;
    }

    // 检查将/帅是否直接照面
    if (this.isKingFaceToFace(gameModel)) {
      // 判定当前回合方获胜，因为对方将/帅被照面
      return gameModel.currentTurn === PieceColor.RED ? PieceColor.RED : PieceColor.BLACK;
    }

    // 检查是否被困毙
    const currentPlayer = gameModel.currentTurn;
    const currentPieces = gameModel.getCurrentTurnPieces();
    
    // 检查当前玩家是否有任何合法移动
    const hasValidMove = currentPieces.some(piece => {
      const moves = this.getValidMoves(piece, gameModel);
      return moves.length > 0;
    });

    if (!hasValidMove) {
      return currentPlayer === PieceColor.RED ? PieceColor.BLACK : PieceColor.RED;
    }

    return null;
  }
}