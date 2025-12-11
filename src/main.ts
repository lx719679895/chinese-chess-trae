import { Game } from './game/Game';

// 等待DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  // 初始化游戏实例
  const game = new Game('chessboard');
  
  // 暴露游戏实例到全局，方便调试（可选）
  (window as any).chessGame = game;
  
  console.log('中国象棋游戏已初始化');
});