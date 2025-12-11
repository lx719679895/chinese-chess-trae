import { GameModel } from '../models/GameModel';

export class SaveLoad {
  private static readonly BASE_STORAGE_KEY = 'chinese-chess-save';

  /**
   * 根据游戏模式和AI难度生成存储键
   * @param gameModel 游戏模型
   * @returns 存储键
   */
  private static getStorageKey(gameModel: GameModel): string {
    if (gameModel.gameMode === 'pve') {
      return `${this.BASE_STORAGE_KEY}-${gameModel.gameMode}-${gameModel.aiDifficulty}-${gameModel.aiPlayerColor}`;
    }
    return `${this.BASE_STORAGE_KEY}-${gameModel.gameMode}`;
  }

  /**
   * 保存游戏状态到本地存储
   * @param gameModel 游戏模型
   */
  static save(gameModel: GameModel): void {
    try {
      const storageKey = this.getStorageKey(gameModel);
      const saveData = JSON.stringify(gameModel.toJSON());
      localStorage.setItem(storageKey, saveData);
      console.log('游戏已保存');
    } catch (error) {
      console.error('保存游戏失败:', error);
    }
  }

  /**
   * 从本地存储加载游戏状态
   * @param gameModel 游戏模型，用于确定加载哪个模式的进度
   * @returns 加载的游戏模型，或null表示没有保存的游戏
   */
  static load(gameModel: GameModel): GameModel | null {
    try {
      const storageKey = this.getStorageKey(gameModel);
      const saveData = localStorage.getItem(storageKey);
      if (!saveData) {
        return null;
      }
      
      const gameData = JSON.parse(saveData);
      const loadedGameModel = GameModel.fromJSON(gameData);
      console.log('游戏已加载');
      return loadedGameModel;
    } catch (error) {
      console.error('加载游戏失败:', error);
      return null;
    }
  }

  /**
   * 检查是否有保存的游戏
   * @param gameModel 游戏模型
   * @returns 是否有保存的游戏
   */
  static hasSavedGame(gameModel: GameModel): boolean {
    const storageKey = this.getStorageKey(gameModel);
    return localStorage.getItem(storageKey) !== null;
  }

  /**
   * 删除保存的游戏
   * @param gameModel 游戏模型
   */
  static deleteSavedGame(gameModel: GameModel): void {
    const storageKey = this.getStorageKey(gameModel);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey + '-date');
    console.log('保存的游戏已删除');
  }

  /**
   * 获取保存的游戏信息（用于显示）
   * @param gameModel 游戏模型
   * @returns 保存的游戏信息
   */
  static getSaveInfo(gameModel: GameModel): { date: Date | null; turn: string } {
    try {
      const storageKey = this.getStorageKey(gameModel);
      const saveData = localStorage.getItem(storageKey);
      if (!saveData) {
        return { date: null, turn: '' };
      }
      
      const gameData = JSON.parse(saveData);
      const dateStr = localStorage.getItem(storageKey + '-date');
      const date = dateStr ? new Date(dateStr) : null;
      const turn = gameData.currentTurn === 'red' ? '红方' : '黑方';
      
      return { date, turn };
    } catch (error) {
      console.error('获取保存信息失败:', error);
      return { date: null, turn: '' };
    }
  }

  /**
   * 保存游戏时记录日期
   * @param gameModel 游戏模型
   */
  static saveWithDate(gameModel: GameModel): void {
    this.save(gameModel);
    const storageKey = this.getStorageKey(gameModel);
    localStorage.setItem(storageKey + '-date', Date.now().toString());
  }
}