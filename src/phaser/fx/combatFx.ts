import Phaser from "phaser";

export type FxTarget = Phaser.GameObjects.GameObject & Partial<Phaser.GameObjects.Components.Transform> & Partial<Phaser.GameObjects.Components.Tint>;

export interface FloatTextOptions {
  color?: string;
  fontSize?: number;
  dy?: number;
  duration?: number;
}

export function flashTarget(scene: Phaser.Scene, target: FxTarget | undefined, color = 0xffffff, duration = 120) {
  if (!target || !("setTintFill" in target) || !("clearTint" in target)) return;
  const setTintFill = target.setTintFill;
  const clearTint = target.clearTint;
  if (!setTintFill || !clearTint) return;
  setTintFill.call(target, color);
  scene.time.delayedCall(duration, () => {
    if (target.active) clearTint.call(target);
  });
}

export function shakeTarget(scene: Phaser.Scene, target: FxTarget | undefined, intensity = 8, duration = 160) {
  if (!target || typeof target.x !== "number" || typeof target.y !== "number") return;
  const startX = target.x;
  scene.tweens.add({
    targets: target,
    x: { from: startX - intensity, to: startX + intensity },
    duration: Math.max(40, Math.floor(duration / 4)),
    yoyo: true,
    repeat: 2,
    onComplete: () => {
      if (target.active) target.x = startX;
    }
  });
}

export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, options: FloatTextOptions = {}) {
  const label = scene.add
    .text(x, y, text, {
      color: options.color ?? "#fff8d8",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: `${options.fontSize ?? 22}px`,
      fontStyle: "800",
      stroke: "#101318",
      strokeThickness: 4
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: label,
    y: y - (options.dy ?? 42),
    alpha: 0,
    duration: options.duration ?? 620,
    ease: "Cubic.easeOut",
    onComplete: () => label.destroy()
  });
  return label;
}

export function cameraHit(scene: Phaser.Scene, strength = 0.006, duration = 120) {
  scene.cameras.main.shake(duration, strength);
}

export function fadeOutOnDeath(scene: Phaser.Scene, target: FxTarget | undefined) {
  if (!target) return;
  scene.tweens.add({
    targets: target,
    alpha: 0.22,
    scaleX: 0.92,
    scaleY: 0.92,
    duration: 1000,
    ease: "Back.easeIn"
  });
}
