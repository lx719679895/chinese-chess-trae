import { ANIMATION_DURATION } from '../utils/Constants';
import { PieceModel } from '../models/PieceModel';

export interface AnimationCallback {
  (): void;
}

export class Animation {
  private animations: Array<{
    piece: PieceModel;
    targetX: number;
    targetY: number;
    startTime: number;
    duration: number;
    onComplete: AnimationCallback;
  }> = [];

  private animationFrameId: number | null = null;

  // 添加动画
  add(piece: PieceModel, targetX: number, targetY: number, onComplete: AnimationCallback = () => {}): void {
    this.animations.push({
      piece,
      targetX,
      targetY,
      startTime: Date.now(),
      duration: ANIMATION_DURATION,
      onComplete
    });

    if (!this.animationFrameId) {
      this.start();
    }
  }

  // 开始动画循环
  private start(): void {
    const animate = () => {
      const now = Date.now();
      let hasActiveAnimations = false;

      // 遍历所有动画
      for (let i = this.animations.length - 1; i >= 0; i--) {
        const anim = this.animations[i];
        const elapsed = now - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);

        // 更新动画状态（这里只是记录进度，实际绘制由Game类处理）
        if (progress < 1) {
          hasActiveAnimations = true;
        } else {
          // 动画完成
          anim.onComplete();
          this.animations.splice(i, 1);
        }
      }

      if (hasActiveAnimations) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  // 获取动画进度
  getProgress(piece: PieceModel): number | null {
    const anim = this.animations.find(a => a.piece.id === piece.id);
    if (!anim) return null;

    const elapsed = Date.now() - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);
    return this.easeOutQuad(progress);
  }

  // 缓动函数：easeOutQuad
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  // 检查是否有动画正在运行
  isAnimating(): boolean {
    return this.animations.length > 0;
  }

  // 检查特定棋子是否正在动画中
  isPieceAnimating(piece: PieceModel): boolean {
    return this.animations.some(a => a.piece.id === piece.id);
  }

  // 获取特定棋子的动画目标位置
  getAnimationTarget(piece: PieceModel): { x: number; y: number } | null {
    const anim = this.animations.find(a => a.piece.id === piece.id);
    if (anim) {
      return { x: anim.targetX, y: anim.targetY };
    }
    return null;
  }

  // 清除所有动画
  clear(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.animations = [];
  }

  // 获取当前活跃动画数量
  getActiveAnimationCount(): number {
    return this.animations.length;
  }
}