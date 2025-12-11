import { PieceColor, AIDifficulty, PieceType } from '../utils/Constants';
import { GameModel } from '../models/GameModel';
import { PieceModel } from '../models/PieceModel';
import { Position } from '../models/Position';
import { Rules } from './Rules';



// AIWorker类，用于在Web Worker中执行AI算法
class AIWorker {
  // 执行AI决策
  static async makeMove(gameModelData: any, aiColor: PieceColor, difficulty: AIDifficulty): Promise<{ piece: any; target: { x: number; y: number } } | null> {
    // 从JSON数据中恢复GameModel
    const gameModel = GameModel.fromJSON(gameModelData);
    
    // 检查是否是AI回合
    if (gameModel.currentTurn !== aiColor) {
      return null;
    }

    // 获取AI回合的所有合法移动
    const validMoves = this.getAllValidMoves(gameModel);
    if (validMoves.length === 0) {
      return null;
    }

    // 根据难度等级选择最佳移动
    let bestMove: { piece: PieceModel; target: Position } | null = null;
    
    switch (difficulty) {
      case AIDifficulty.EASY:
        bestMove = this.chooseRandomMove(validMoves);
        break;
      case AIDifficulty.MEDIUM:
        bestMove = this.chooseMediumMove(validMoves, gameModel);
        break;
      case AIDifficulty.HARD:
        bestMove = this.chooseHardMove(validMoves, gameModel, aiColor);
        break;
    }

    if (bestMove) {
      return {
        piece: bestMove.piece,
        target: bestMove.target
      };
    }

    return null;
  }

  // 获取AI回合的所有合法移动
  private static getAllValidMoves(gameModel: GameModel): { piece: PieceModel; target: Position }[] {
    const validMoves: { piece: PieceModel; target: Position }[] = [];
    
    // 获取AI玩家的所有棋子
    const aiPieces = gameModel.pieces.filter(piece => 
      piece.isAlive && piece.color === gameModel.currentTurn
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

  // 简单难度：随机选择合法移动
  private static chooseRandomMove(validMoves: { piece: PieceModel; target: Position }[]): { piece: PieceModel; target: Position } {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  // 中等难度：考虑吃子和将军情况
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

  // 困难难度：使用Minimax算法和Alpha-Beta剪枝
  private static chooseHardMove(validMoves: { piece: PieceModel; target: Position }[], gameModel: GameModel, aiColor: PieceColor): { piece: PieceModel; target: Position } {
    // 使用迭代加深搜索
    const { bestMove } = this.iterativeDeepening(gameModel, validMoves, aiColor);
    return bestMove;
  }

  // 实现迭代加深搜索
  private static iterativeDeepening(gameModel: GameModel, validMoves: { piece: PieceModel; target: Position }[], aiColor: PieceColor): { bestMove: { piece: PieceModel; target: Position }; bestScore: number } {
    const maxDepth = 6; // 最大搜索深度
    const timeLimit = 1500; // 时间限制（毫秒）
    const startTime = Date.now();

    // 对移动进行排序，提高剪枝效率
    const sortedMoves = this.sortMoves(validMoves, gameModel);
    
    // 存储所有移动的得分
    interface ScoredMove {
      move: { piece: PieceModel; target: Position };
      score: number;
    }
    let scoredMoves: ScoredMove[] = [];

    // 初始化得分数组
    sortedMoves.forEach(move => {
      scoredMoves.push({ move, score: -Infinity });
    });

    // 迭代加深搜索
    for (let depth = 1; depth <= maxDepth; depth++) {
      // 检查是否超过时间限制
      if (Date.now() - startTime > timeLimit) {
        break;
      }

      // 评估每个移动的得分
      scoredMoves.forEach(scoredMove => {
        // 检查是否超过时间限制
        if (Date.now() - startTime > timeLimit) {
          return;
        }

        const move = scoredMove.move;
        // 创建游戏模型副本
        const gameCopy = gameModel.clone();
        
        // 执行移动
        this.executeMove(move, gameCopy);
        
        // 切换回合
        gameCopy.switchTurn();
        
        // 使用Minimax算法和Alpha-Beta剪枝评估移动
        const score = this.minimax(gameCopy, depth - 1, -Infinity, Infinity, false, aiColor);
        
        scoredMove.score = score;
      });

      // 按得分降序排序
      scoredMoves.sort((a, b) => b.score - a.score);

      // 如果找到必胜走法，提前终止搜索
      if (Math.abs(scoredMoves[0].score) > 10000) {
        break;
      }
    }

    // 增加随机性，避免可预测性
    const bestMove = this.selectMoveWithRandomness(scoredMoves);
    return { bestMove, bestScore: bestMove.score };
  }

  // 选择移动时加入随机性，避免可预测性
  private static selectMoveWithRandomness(scoredMoves: { move: { piece: PieceModel; target: Position }; score: number }[]): { piece: PieceModel; target: Position; score: number } {
    // 按得分降序排序
    scoredMoves.sort((a, b) => b.score - a.score);
    
    // 选择得分最高的前几个移动作为候选
    const candidates = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
    
    // 有5%的概率随机选择一个候选移动，增加随机性
    if (Math.random() < 0.05 && candidates.length > 1) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const randomMove = candidates[randomIndex];
      return { 
        piece: randomMove.move.piece, 
        target: randomMove.move.target, 
        score: randomMove.score 
      };
    }
    
    // 否则选择得分最高的移动
    const bestScoredMove = scoredMoves[0];
    return { 
      piece: bestScoredMove.move.piece, 
      target: bestScoredMove.move.target, 
      score: bestScoredMove.score 
    };
  }

  // 实现Minimax算法和Alpha-Beta剪枝
  private static minimax(gameModel: GameModel, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean, aiColor: PieceColor): number {
    // 获取当前玩家的所有合法移动
    const validMoves = this.getAllValidMovesForCurrentPlayer(gameModel);
    
    // 终端节点检查
    if (depth === 0 || validMoves.length === 0) {
      return this.evaluatePosition(gameModel, aiColor);
    }
    
    if (isMaximizingPlayer) {
      let maxScore = -Infinity;
      
      // 对移动进行排序，提高剪枝效率
      const sortedMoves = this.sortMoves(validMoves, gameModel);
      
      for (const move of sortedMoves) {
        // 创建游戏模型副本
        const gameCopy = gameModel.clone();
        
        // 执行移动
        this.executeMove(move, gameCopy);
        
        // 切换回合
        gameCopy.switchTurn();
        
        // 递归调用minimax
        const score = this.minimax(gameCopy, depth - 1, alpha, beta, false, aiColor);
        
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        
        // Alpha-Beta剪枝
        if (beta <= alpha) {
          break;
        }
      }
      
      return maxScore;
    } else {
      let minScore = Infinity;
      
      // 对移动进行排序，提高剪枝效率
      const sortedMoves = this.sortMoves(validMoves, gameModel);
      
      for (const move of sortedMoves) {
        // 创建游戏模型副本
        const gameCopy = gameModel.clone();
        
        // 执行移动
        this.executeMove(move, gameCopy);
        
        // 切换回合
        gameCopy.switchTurn();
        
        // 递归调用minimax
        const score = this.minimax(gameCopy, depth - 1, alpha, beta, true, aiColor);
        
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        
        // Alpha-Beta剪枝
        if (beta <= alpha) {
          break;
        }
      }
      
      return minScore;
    }
  }

  // 评估当前位置的得分
  private static evaluatePosition(gameModel: GameModel, aiColor: PieceColor): number {
    let score = 0;
    const opponentColor = aiColor === PieceColor.RED ? PieceColor.BLACK : PieceColor.RED;
    
    // 评估棋子价值
    const aiPieces = gameModel.getPiecesByColor(aiColor);
    const opponentPieces = gameModel.getPiecesByColor(opponentColor);
    
    // 计算双方棋子总价值
    aiPieces.forEach(piece => {
      score += this.getPieceValue(piece) + this.getPositionValue(piece);
      score += this.getSafetyValue(piece, gameModel);
    });
    
    opponentPieces.forEach(piece => {
      score -= this.getPieceValue(piece) + this.getPositionValue(piece);
      score -= this.getSafetyValue(piece, gameModel);
    });
    
    // 评估将军情况
    if (Rules.isInCheck(opponentColor, gameModel)) {
      score += 500;
    }
    if (Rules.isInCheck(aiColor, gameModel)) {
      score -= 500;
    }
    
    // 评估机动性
    const aiMobility = aiPieces.reduce((count, piece) => {
      return count + Rules.getValidMoves(piece, gameModel).length;
    }, 0);
    const opponentMobility = opponentPieces.reduce((count, piece) => {
      return count + Rules.getValidMoves(piece, gameModel).length;
    }, 0);
    score += (aiMobility - opponentMobility) * 10;
    
    // 评估控制区域
    const aiControl = this.evaluateControlArea(gameModel, aiColor);
    const opponentControl = this.evaluateControlArea(gameModel, opponentColor);
    score += (aiControl - opponentControl) * 20;
    
    // 评估王的安全性
    score += this.evaluateKingSafety(gameModel, aiColor) * 300;
    score -= this.evaluateKingSafety(gameModel, opponentColor) * 300;
    
    return score;
  }

  // 获取棋子的价值
  private static getPieceValue(piece: PieceModel): number {
    // 简单的棋子价值评估
    const values: Record<string, number> = {
      [PieceType.KING]: 1000,    // 将/帅
      [PieceType.ADVISOR]: 100,  // 士/仕
      [PieceType.ELEPHANT]: 150, // 象/相
      [PieceType.HORSE]: 300,    // 马/傌
      [PieceType.CHARIOT]: 500,  // 车/俥
      [PieceType.CANNON]: 250,   // 炮/砲
      [PieceType.SOLDIER]: 50    // 兵/卒
    };
    
    return values[piece.type] || 0;
  }

  // 获取棋子的位置价值
  private static getPositionValue(piece: PieceModel): number {
    // 位置价值表，根据棋子类型和位置给予不同权重
    const positionValues: Record<string, number[][]> = {
      [PieceType.KING]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 20, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      [PieceType.ADVISOR]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 5, 0, 5, 0, 0, 0],
        [0, 0, 0, 0, 15, 0, 0, 0, 0],
        [0, 0, 0, 5, 0, 5, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      [PieceType.ELEPHANT]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 10, 0, 0, 0, 10, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 20, 0, 0, 0, 0, 0, 20, 0],
        [0, 0, 0, 0, 30, 0, 0, 0, 0]
      ],
      [PieceType.HORSE]: [
        [0, 5, 10, 15, 20, 15, 10, 5, 0],
        [5, 15, 25, 30, 35, 30, 25, 15, 5],
        [10, 25, 35, 40, 45, 40, 35, 25, 10],
        [15, 30, 40, 45, 50, 45, 40, 30, 15],
        [20, 35, 45, 50, 55, 50, 45, 35, 20],
        [15, 30, 40, 45, 50, 45, 40, 30, 15],
        [10, 25, 35, 40, 45, 40, 35, 25, 10],
        [5, 15, 25, 30, 35, 30, 25, 15, 5],
        [0, 5, 10, 15, 20, 15, 10, 5, 0]
      ],
      [PieceType.CHARIOT]: [
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [5, 10, 10, 10, 10, 10, 10, 10, 5],
        [5, 10, 15, 15, 15, 15, 15, 10, 5],
        [5, 10, 15, 20, 20, 20, 15, 10, 5],
        [5, 10, 15, 20, 25, 20, 15, 10, 5],
        [5, 10, 15, 20, 20, 20, 15, 10, 5],
        [5, 10, 15, 15, 15, 15, 15, 10, 5],
        [5, 10, 10, 10, 10, 10, 10, 10, 5],
        [5, 5, 5, 5, 5, 5, 5, 5, 5]
      ],
      [PieceType.CANNON]: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 5, 5, 5, 5, 5, 5, 5, 2],
        [2, 5, 10, 10, 10, 10, 10, 5, 2],
        [2, 5, 10, 15, 15, 15, 10, 5, 2],
        [2, 5, 10, 15, 20, 15, 10, 5, 2],
        [2, 5, 10, 15, 15, 15, 10, 5, 2],
        [2, 5, 10, 10, 10, 10, 10, 5, 2],
        [2, 5, 5, 5, 5, 5, 5, 5, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2]
      ],
      [PieceType.SOLDIER]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [10, 10, 10, 10, 10, 10, 10, 10, 10],
        [15, 15, 15, 15, 15, 15, 15, 15, 15],
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [30, 30, 30, 30, 30, 30, 30, 30, 30],
        [50, 50, 50, 50, 50, 50, 50, 50, 50],
        [70, 70, 70, 70, 70, 70, 70, 70, 70],
        [100, 100, 100, 100, 100, 100, 100, 100, 100],
        [200, 200, 200, 200, 200, 200, 200, 200, 200]
      ]
    };
    
    // 获取棋子的位置价值
    const y = piece.color === PieceColor.RED ? piece.position.y : 8 - piece.position.y;
    
    // 安全检查：确保positionValues[piece.type]和对应的y坐标存在
    if (positionValues[piece.type] && 
        positionValues[piece.type][y] && 
        positionValues[piece.type][y][piece.position.x] !== undefined) {
      return positionValues[piece.type][y][piece.position.x];
    }
    
    // 如果位置价值不存在，返回0
    return 0;
  }

  // 获取棋子的安全性价值
  private static getSafetyValue(piece: PieceModel, gameModel: GameModel): number {
    // 评估棋子被攻击的风险
    let safetyValue = 0;
    const opponentColor = piece.color === PieceColor.RED ? PieceColor.BLACK : PieceColor.RED;
    const opponentPieces = gameModel.getPiecesByColor(opponentColor);
    
    // 检查棋子是否被对方棋子攻击
    opponentPieces.forEach(opponentPiece => {
      const opponentMoves = Rules.getValidMoves(opponentPiece, gameModel);
      const isAttacked = opponentMoves.some(move => 
        move.x === piece.position.x && move.y === piece.position.y
      );
      
      if (isAttacked) {
        // 被攻击，根据攻击棋子的价值和被攻击棋子的价值计算风险
        const attackerValue = this.getPieceValue(opponentPiece);
        const defenderValue = this.getPieceValue(piece);
        
        if (attackerValue < defenderValue) {
          // 攻击者价值低于被攻击者，被攻击棋子有风险
          safetyValue -= (defenderValue - attackerValue) / 2;
        }
      }
    });
    
    return safetyValue;
  }

  // 评估控制区域
  private static evaluateControlArea(gameModel: GameModel, color: PieceColor): number {
    let controlScore = 0;
    const pieces = gameModel.getPiecesByColor(color);
    
    // 计算所有棋子的控制区域
    pieces.forEach(piece => {
      const moves = Rules.getValidMoves(piece, gameModel);
      controlScore += moves.length;
      
      // 对棋盘中间区域的控制给予额外奖励
      moves.forEach(move => {
        if (move.x >= 3 && move.x <= 5 && move.y >= 3 && move.y <= 5) {
          controlScore += 2;
        }
      });
    });
    
    return controlScore;
  }

  // 评估王的安全性
  private static evaluateKingSafety(gameModel: GameModel, color: PieceColor): number {
    let safetyScore = 0;
    
    // 找到王
    const king = gameModel.pieces.find(piece => 
      piece.type === PieceType.KING && piece.color === color && piece.isAlive
    );
    
    if (!king) {
      return -1000; // 王被吃掉，游戏结束
    }
    
    // 检查王是否被将军
    if (Rules.isInCheck(color, gameModel)) {
      safetyScore -= 100;
    }
    
    // 检查王周围的防守
    const opponentColor = color === PieceColor.RED ? PieceColor.BLACK : PieceColor.RED;
    const opponentPieces = gameModel.getPiecesByColor(opponentColor);
    
    // 检查王周围的格子是否被对方控制
    const kingArea = [
      { x: king.position.x - 1, y: king.position.y },
      { x: king.position.x + 1, y: king.position.y },
      { x: king.position.x, y: king.position.y - 1 },
      { x: king.position.x, y: king.position.y + 1 }
    ];
    
    let attackedSquares = 0;
    kingArea.forEach(square => {
      if (square.x >= 0 && square.x <= 8 && square.y >= 0 && square.y <= 8) {
        // 检查这个格子是否被对方棋子攻击
        opponentPieces.forEach(piece => {
          const moves = Rules.getValidMoves(piece, gameModel);
          if (moves.some(move => move.x === square.x && move.y === square.y)) {
            attackedSquares++;
          }
        });
      }
    });
    
    safetyScore -= attackedSquares * 20;
    
    return safetyScore;
  }

  // 对移动进行排序，优先搜索更可能是最佳的移动
  private static sortMoves(moves: { piece: PieceModel; target: Position }[], gameModel: GameModel): { piece: PieceModel; target: Position }[] {
    return moves.sort((a, b) => {
      // 优先搜索吃子移动
      const aCaptures = gameModel.getPieceAt(a.target.x, a.target.y) ? 1 : 0;
      const bCaptures = gameModel.getPieceAt(b.target.x, b.target.y) ? 1 : 0;
      
      if (aCaptures !== bCaptures) {
        return bCaptures - aCaptures;
      }
      
      // 优先搜索将军移动
      const aChecks = this.wouldBeCheck(a, gameModel) ? 1 : 0;
      const bChecks = this.wouldBeCheck(b, gameModel) ? 1 : 0;
      
      if (aChecks !== bChecks) {
        return bChecks - aChecks;
      }
      
      // 其他情况随机排序
      return Math.random() - 0.5;
    });
  }

  // 执行移动
  private static executeMove(move: { piece: PieceModel; target: Position }, gameModel: GameModel): void {
    // 找到对应棋子
    const piece = gameModel.pieces.find(p => p.id === move.piece.id);
    if (!piece) {
      return;
    }
    
    // 检查目标位置是否有对方棋子
    const targetPiece = gameModel.getPieceAt(move.target.x, move.target.y);
    if (targetPiece && targetPiece.color !== piece.color) {
      // 吃掉对方棋子
      targetPiece.isAlive = false;
    }
    
    // 移动棋子
    piece.moveTo(move.target);
  }

  // 获取当前玩家的所有合法移动
  private static getAllValidMovesForCurrentPlayer(gameModel: GameModel): { piece: PieceModel; target: Position }[] {
    const validMoves: { piece: PieceModel; target: Position }[] = [];
    
    // 获取当前玩家的所有棋子
    const currentPlayerPieces = gameModel.pieces.filter(piece => 
      piece.isAlive && piece.color === gameModel.currentTurn
    );
    
    // 遍历每个棋子，获取所有合法移动
    currentPlayerPieces.forEach(piece => {
      const moves = Rules.getValidMoves(piece, gameModel);
      moves.forEach(move => {
        validMoves.push({ piece, target: move });
      });
    });
    
    return validMoves;
  }

  // 检查移动后是否会将军
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
}

// 监听来自主线程的消息
self.addEventListener('message', async (event: MessageEvent) => {
  // 使用类型断言指定data属性的类型
  const data = event.data as {
    type: string;
    gameModel: any;
    aiColor: PieceColor;
    difficulty: AIDifficulty;
  };
  
  const { type, gameModel, aiColor, difficulty } = data;
  
  if (type === 'makeMove') {
    try {
      // 执行AI决策
      const bestMove = await AIWorker.makeMove(gameModel, aiColor, difficulty);
      
      // 将结果发送回主线程
      self.postMessage({
        type: 'moveResult',
        bestMove: bestMove
      });
    } catch (error) {
      // 发送错误信息回主线程
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});
