import { INITIAL_POSITIONS, PieceType, PieceColor, GameState, SELECTED_COLOR, VALID_MOVE_COLOR, BOARD_WIDTH, BOARD_HEIGHT, updateCellSize, CANVAS_WIDTH, CANVAS_HEIGHT, EDGE_MARGIN, GameMode, AIDifficulty } from '../utils/Constants';
import { Board } from '../canvas/Board';
import { Piece } from '../canvas/Piece';
import { Animation } from '../canvas/Animation';
import { GameModel } from '../models/GameModel';
import { PieceModel } from '../models/PieceModel';
import { Position } from '../models/Position';
import { Rules } from './Rules';
import { SaveLoad } from './SaveLoad';
import { AI } from './AI';

export class Game {
  private canvas: HTMLCanvasElement;
  private board: Board;
  private pieceRenderer: Piece;
  private animation: Animation;
  private gameModel: GameModel;
  private animationFrameId: number | null = null;
  private statusElement: HTMLElement | null = null;
  private turnIndicator: HTMLElement | null = null;
  private isAIMoving: boolean = false; // 标记AI是否正在移动

  constructor(canvasId: string, statusId: string = 'statusMessage', turnIndicatorId: string = 'turnIndicator') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.board = new Board(this.canvas);
    this.pieceRenderer = new Piece(this.canvas);
    this.animation = new Animation();
    this.gameModel = new GameModel();
    
    this.statusElement = document.getElementById(statusId);
    this.turnIndicator = document.getElementById(turnIndicatorId);

    this.initEventListeners();
    this.initResponsive(); // 初始化响应式设置
    this.newGame();
  }

  // 初始化事件监听器
  private initEventListeners(): void {
    // 鼠标点击事件
    this.canvas.addEventListener('click', (e) => this.handleMouseClick(e));

    // 窗口大小变化事件
    window.addEventListener('resize', () => this.handleResize());

    // 新游戏按钮
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.newGame());
    }

    // 保存游戏按钮
    const saveGameBtn = document.getElementById('saveGameBtn');
    if (saveGameBtn) {
      saveGameBtn.addEventListener('click', () => this.saveGame());
    }

    // 加载游戏按钮
    const loadGameBtn = document.getElementById('loadGameBtn');
    if (loadGameBtn) {
      loadGameBtn.addEventListener('click', () => this.loadGame());
    }

    // 悔棋按钮
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undo());
    }

    // 模式选择事件监听器
    this.initModeSelectEventListeners();
  }

  /**
   * 初始化模式选择事件监听器
   */
  private initModeSelectEventListeners(): void {
    // 模式选择事件
    const modePvP = document.getElementById('modePvP') as HTMLInputElement;
    const modePvE = document.getElementById('modePvE') as HTMLInputElement;
    
    modePvP?.addEventListener('change', () => {
      if (modePvP.checked) {
        this.setGameMode(GameMode.PVP);
        this.showAISettings(false);
      }
    });
    
    modePvE?.addEventListener('change', () => {
      if (modePvE.checked) {
        this.setGameMode(GameMode.PVE);
        this.showAISettings(true);
      }
    });

    // AI难度选择事件
    const aiDifficulty = document.getElementById('aiDifficulty') as HTMLSelectElement;
    aiDifficulty?.addEventListener('change', () => {
      this.setAIDifficulty(aiDifficulty.value as AIDifficulty);
    });

    // AI玩家颜色选择事件
    const aiPlayerColor = document.getElementById('aiPlayerColor') as HTMLSelectElement;
    aiPlayerColor?.addEventListener('change', () => {
      this.setAIPlayerColor(aiPlayerColor.value as PieceColor);
    });
  }

  /**
   * 显示或隐藏AI设置区域
   * @param show 是否显示AI设置
   */
  private showAISettings(show: boolean): void {
    const aiSettings = document.getElementById('aiSettings');
    if (aiSettings) {
      aiSettings.style.display = show ? 'block' : 'none';
    }
  }

  // 新游戏
  newGame(): void {
    // 保存当前的游戏模式、AI难度和AI玩家颜色
    const currentGameMode = this.gameModel.gameMode;
    const currentAIDifficulty = this.gameModel.aiDifficulty;
    const currentAIPlayerColor = this.gameModel.aiPlayerColor;
    
    // 初始化棋子
    this.initializePieces();
    
    // 重置游戏状态，包括清空历史记录
    this.gameModel = new GameModel(
      this.gameModel.pieces,
      PieceColor.RED,
      GameState.PLAYING,
      null,
      false,
      null,
      []
    );
    
    // 恢复之前的游戏模式、AI难度和AI玩家颜色
    this.gameModel.gameMode = currentGameMode;
    this.gameModel.aiDifficulty = currentAIDifficulty;
    this.gameModel.aiPlayerColor = currentAIPlayerColor;
    
    // 确保历史记录为空
    this.gameModel.history = [];

    // 清除动画
    this.animation.clear();

    // 渲染游戏
    this.render();
    this.updateStatus('');
    this.updateTurnIndicator();
    
    // 如果是PVE模式且当前是AI回合，立即执行AI移动
    if (this.gameModel.gameMode === GameMode.PVE && 
        this.gameModel.currentTurn === this.gameModel.aiPlayerColor) {
      this.checkAndExecuteAITurn();
    }
  }

  // 初始化棋子
  private initializePieces(): void {
    this.gameModel.pieces = [];

    // 初始化红方棋子
    Object.entries(INITIAL_POSITIONS[PieceColor.RED]).forEach(([type, positions]) => {
      positions.forEach(([x, y]) => {
        const piece = new PieceModel(
          type as PieceType,
          PieceColor.RED,
          new Position(x, y)
        );
        this.gameModel.pieces.push(piece);
      });
    });

    // 初始化黑方棋子
    Object.entries(INITIAL_POSITIONS[PieceColor.BLACK]).forEach(([type, positions]) => {
      positions.forEach(([x, y]) => {
        const piece = new PieceModel(
          type as PieceType,
          PieceColor.BLACK,
          new Position(x, y)
        );
        this.gameModel.pieces.push(piece);
      });
    });
  }

  // 处理鼠标点击事件
  private handleMouseClick(e: MouseEvent): void {
    // 检查游戏状态和动画状态
    if (this.gameModel.gameState !== GameState.PLAYING || 
        this.animation.isAnimating() || 
        this.isAIMoving) {
      return;
    }

    // 在PVE模式下，只有玩家回合才能点击
    if (this.gameModel.gameMode === GameMode.PVE && 
        this.gameModel.currentTurn === this.gameModel.aiPlayerColor) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const boardPos = this.board.screenToBoard(screenX, screenY);
    const clickedPiece = this.gameModel.getPieceAt(boardPos.x, boardPos.y);

    // 如果已经选择了棋子
    if (this.gameModel.selectedPieceId) {
      const selectedPiece = this.gameModel.pieces.find(p => p.id === this.gameModel.selectedPieceId);
      if (selectedPiece) {
        // 检查点击的是否是合法移动位置
        if (this.gameModel.isValidMove(boardPos.x, boardPos.y)) {
          // 执行移动
          this.movePiece(selectedPiece, boardPos.x, boardPos.y);
        } 
        // 检查点击的是否是己方其他棋子
        else if (clickedPiece && clickedPiece.color === this.gameModel.currentTurn) {
          // 选择新的棋子
          this.selectPiece(clickedPiece.id);
        } 
        // 取消选择
        else {
          this.gameModel.selectPiece(null);
          this.render();
        }
      }
    } 
    // 选择棋子
    else if (clickedPiece && clickedPiece.color === this.gameModel.currentTurn) {
      this.selectPiece(clickedPiece.id);
    }
  }

  // 选择棋子
  private selectPiece(pieceId: string): void {
    this.gameModel.selectPiece(pieceId);
    const selectedPiece = this.gameModel.pieces.find(p => p.id === pieceId);
    
    if (selectedPiece) {
      // 获取合法移动位置
      const validMoves = Rules.getValidMoves(selectedPiece, this.gameModel);
      this.gameModel.setValidMoves(validMoves.map(pos => ({ x: pos.x, y: pos.y })));
    }
    
    this.render();
  }

  // 移动棋子
  private movePiece(piece: PieceModel, targetX: number, targetY: number): void {
    // 保存当前游戏状态到历史记录，用于悔棋
    this.saveCurrentStateToHistory();
    
    // 检查目标位置是否有对方棋子
    const targetPiece = this.gameModel.getPieceAt(targetX, targetY);
    if (targetPiece && targetPiece.color !== piece.color) {
      // 吃掉对方棋子
      targetPiece.isAlive = false;
    }

    // 添加移动动画
    this.animation.add(piece, targetX, targetY, () => {
      // 动画完成后更新棋子位置
      piece.moveTo(new Position(targetX, targetY));
      
      // 取消选择
      this.gameModel.selectPiece(null);
      
      // 检查是否被将军
      const opponentColor = this.gameModel.currentTurn === PieceColor.RED ? PieceColor.BLACK : PieceColor.RED;
      this.gameModel.isInCheck = Rules.isInCheck(opponentColor, this.gameModel);
      
      // 检查游戏是否结束
      const winner = Rules.checkGameOver(this.gameModel);
      if (winner) {
        this.gameModel.setWinner(winner);
        this.updateStatus(`${winner === PieceColor.RED ? '红方' : '黑方'}获胜！`);
      } else {
        // 切换回合
        this.gameModel.switchTurn();
        
        // 检查新回合是否被将军
        this.gameModel.isInCheck = Rules.isInCheck(this.gameModel.currentTurn, this.gameModel);
        if (this.gameModel.isInCheck) {
          this.updateStatus(`${this.gameModel.currentTurn === PieceColor.RED ? '红方' : '黑方'}被将军！`);
        } else {
          this.updateStatus('');
        }
        
        // 更新UI
        this.updateTurnIndicator();
        this.render();
        
        // 检查是否需要执行AI回合
        this.checkAndExecuteAITurn();
      }
      
      // 更新UI
      this.updateTurnIndicator();
      this.render();
    });

    // 开始渲染循环
    this.startRenderLoop();
  }

  // 保存当前游戏状态到历史记录
  private saveCurrentStateToHistory(): void {
    // 克隆当前游戏状态并保存到历史记录
    this.gameModel.history.push(this.gameModel.clone());
  }

  // 悔棋
  public undo(): boolean {
    // 检查是否有历史记录可悔棋
    if (this.gameModel.history.length === 0) {
      return false;
    }

    // 在PVE模式下，需要撤回两步：电脑落子 + 玩家上一步落子
    let undoCount = this.gameModel.gameMode === GameMode.PVE ? 2 : 1;
    
    // 确保不超过历史记录的长度
    undoCount = Math.min(undoCount, this.gameModel.history.length);
    
    // 获取需要恢复的目标状态（从历史记录中倒数第undoCount个状态）
    const targetState = this.gameModel.history[this.gameModel.history.length - undoCount];
    
    // 从历史记录中移除相应数量的状态
    this.gameModel.history.splice(this.gameModel.history.length - undoCount);
    
    // 将目标状态的属性复制到当前gameModel，保留当前的history数组
    this.gameModel.pieces = targetState.pieces.map(piece => piece.clone());
    this.gameModel.currentTurn = targetState.currentTurn;
    this.gameModel.gameState = targetState.gameState;
    this.gameModel.winner = targetState.winner;
    this.gameModel.isInCheck = targetState.isInCheck;
    this.gameModel.selectedPieceId = targetState.selectedPieceId;
    this.gameModel.validMoves = [...targetState.validMoves];
    
    // 清除任何正在进行的动画
    this.animation.clear();
    
    // 更新UI
    this.updateStatus('');
    this.updateTurnIndicator();
    this.render();

    return true;
  }

  /**
   * 检查是否需要执行AI回合，如果是则执行
   */
  private async checkAndExecuteAITurn(): Promise<void> {
    // 检查游戏模式和回合
    if (this.gameModel.gameMode !== GameMode.PVE || 
        this.gameModel.currentTurn !== this.gameModel.aiPlayerColor || 
        this.gameModel.gameState !== GameState.PLAYING || 
        this.isAIMoving) {
      return;
    }

    try {
      this.isAIMoving = true;
      
      // 执行AI决策
      const bestMove = await AI.makeMove(this.gameModel);
      
      if (bestMove) {
        // 执行AI移动
        this.movePiece(bestMove.piece, bestMove.target.x, bestMove.target.y);
      } else {
        // AI无合法移动，检查游戏是否结束
        const winner = Rules.checkGameOver(this.gameModel);
        if (winner) {
          this.gameModel.setWinner(winner);
          this.updateStatus(`${winner === PieceColor.RED ? '红方' : '黑方'}获胜！`);
          this.render();
        }
      }
    } catch (error) {
      console.error('AI移动失败:', error);
    } finally {
      this.isAIMoving = false;
    }
  }

  /**
   * 设置游戏模式
   * @param mode 新的游戏模式
   */
  public setGameMode(mode: GameMode): void {
    this.gameModel.gameMode = mode;
    this.newGame(); // 重置游戏状态
  }

  /**
   * 设置AI难度
   * @param difficulty 新的AI难度
   */
  public setAIDifficulty(difficulty: AIDifficulty): void {
    this.gameModel.aiDifficulty = difficulty;
  }

  /**
   * 设置AI玩家颜色
   * @param color AI玩家颜色
   */
  public setAIPlayerColor(color: PieceColor): void {
    this.gameModel.aiPlayerColor = color;
    this.newGame(); // 重置游戏状态
  }

  // 保存游戏
  saveGame(): void {
    SaveLoad.saveWithDate(this.gameModel);
    this.updateStatus('游戏已保存');
  }

  // 加载游戏
  loadGame(): void {
    const loadedGame = SaveLoad.load(this.gameModel);
    if (loadedGame) {
      this.gameModel = loadedGame;
      this.animation.clear();
      this.updateTurnIndicator();
      this.updateStatus('游戏已加载');
      this.render();
    } else {
      this.updateStatus('没有找到保存的游戏');
    }
  }

  // 开始渲染循环
  private startRenderLoop(): void {
    if (!this.animationFrameId) {
      const render = () => {
        this.render();
        if (this.animation.isAnimating()) {
          this.animationFrameId = requestAnimationFrame(render);
        } else {
          this.animationFrameId = null;
        }
      };
      this.animationFrameId = requestAnimationFrame(render);
    }
  }

  // 渲染游戏
  private render(): void {
    // 清除画布
    this.board.clear();
    
    // 绘制棋盘
    this.board.draw();

    // 高亮选中的棋子位置
    if (this.gameModel.selectedPieceId) {
      const selectedPiece = this.gameModel.pieces.find(p => p.id === this.gameModel.selectedPieceId);
      if (selectedPiece) {
        this.board.highlightPosition(selectedPiece.position, SELECTED_COLOR);
      }
    }

    // 高亮合法移动位置
    this.gameModel.validMoves.forEach(move => {
      this.board.highlightPosition(new Position(move.x, move.y), VALID_MOVE_COLOR);
    });

    // 绘制所有棋子
    this.pieceRenderer.drawAll(this.gameModel.pieces.filter(p => {
      // 不绘制正在动画中的棋子（由动画系统单独绘制）
      return !this.animation.isPieceAnimating(p);
    }));

    // 绘制动画中的棋子
    this.gameModel.pieces.forEach(piece => {
      if (this.animation.isPieceAnimating(piece)) {
        const progress = this.animation.getProgress(piece);
        const target = this.animation.getAnimationTarget(piece);
        if (progress !== null && target) {
          this.pieceRenderer.drawAnimated(piece, progress, target.x, target.y);
        }
      }
    });
  }

  // 更新状态消息
  private updateStatus(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      if (message) {
        this.statusElement.classList.add('visible');
        // 添加脉冲动画
        this.statusElement.classList.add('pulse');
        setTimeout(() => {
          this.statusElement?.classList.remove('pulse');
        }, 600);
      } else {
        this.statusElement.classList.remove('visible');
      }
    }
  }

  // 更新回合指示器
  private updateTurnIndicator(): void {
    if (this.turnIndicator) {
      this.turnIndicator.textContent = `${this.gameModel.currentTurn === PieceColor.RED ? '红方' : '黑方'}回合`;
      this.turnIndicator.className = `turn-indicator turn-${this.gameModel.currentTurn}`;
    }
  }

  // 获取游戏模型
  getGameModel(): GameModel {
    return this.gameModel;
  }

  // 重置游戏
  reset(): void {
    this.newGame();
  }

  // 暂停游戏
  pause(): void {
    if (this.gameModel.gameState === GameState.PLAYING) {
      this.gameModel.setState(GameState.INIT);
      this.updateStatus('游戏已暂停');
    }
  }

  // 继续游戏
  resume(): void {
    if (this.gameModel.gameState === GameState.INIT) {
      this.gameModel.setState(GameState.PLAYING);
      this.updateStatus('');
      this.render();
    }
  }

  // 处理窗口大小变化
  private handleResize(): void {
    // 实现响应式调整
    this.updateCanvasSize();
    this.render();
  }

  // 更新Canvas大小
  private updateCanvasSize(): void {
    // 基于容器大小计算合适的CELL_SIZE
    const container = this.canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // 计算基于宽度和高度的最大CELL_SIZE，减去边缘间距
    const maxCellSizeWidth = Math.floor((containerWidth - EDGE_MARGIN * 2) / BOARD_WIDTH);
    const maxCellSizeHeight = Math.floor((containerHeight - EDGE_MARGIN * 2) / BOARD_HEIGHT);
    
    // 使用较小的值，确保棋盘能完整显示
    const newCellSize = Math.min(maxCellSizeWidth, maxCellSizeHeight);
    
    // 更新全局CELL_SIZE
    updateCellSize(newCellSize);
    
    // 更新Canvas尺寸
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    
    // 设置Canvas的CSS样式，确保居中显示且尺寸一致
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    // 确保canvas的CSS样式尺寸与实际尺寸一致，避免坐标计算错误
    this.canvas.style.width = `${CANVAS_WIDTH}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT}px`;
    
    // 确保容器有足够的高度，但不要添加过多的额外空间
    container.style.minHeight = `${CANVAS_HEIGHT}px`;
  }

  // 初始化响应式设置
  private initResponsive(): void {
    this.updateCanvasSize();
  }
}