import Phaser from "phaser";

export interface StaggerOptions {
  delayStep?: number;
  duration?: number;
  yOffset?: number;
}

export function staggerChildren(scene: Phaser.Scene, targets: Phaser.GameObjects.GameObject[], options: StaggerOptions = {}) {
  const delayStep = options.delayStep ?? 70;
  const duration = options.duration ?? 260;
  const yOffset = options.yOffset ?? 20;
  targets.forEach((target, index) => {
    const item = target as Phaser.GameObjects.GameObject & Partial<Phaser.GameObjects.Components.Transform> & Partial<Phaser.GameObjects.Components.Alpha>;
    if (typeof item.y !== "number" || typeof item.setAlpha !== "function") return;
    const targetY = item.y;
    item.y = targetY + yOffset;
    item.setAlpha(0);
    scene.tweens.add({
      targets: item,
      y: targetY,
      alpha: 1,
      delay: index * delayStep,
      duration,
      ease: "Cubic.easeOut"
    });
  });
}

export function fadeSlideIn(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, yOffset = 16, duration = 240) {
  staggerChildren(scene, [target], { delayStep: 0, duration, yOffset });
}
