import Phaser from "phaser";
import { bar, label } from "./uiPrimitives";
import { colors } from "./uiTheme";

export function renderHpBar(scene: Phaser.Scene, x: number, y: number, w: number, current: number, max: number, labelText: string) {
  const container = scene.add.container(x, y);
  container.add(bar(scene, 0, 22, w, 14, max > 0 ? current / max : 0, 0xee4266));
  container.add(label(scene, 0, 0, `${labelText} ${current}/${max}`, 14, colors.ink, w));
  return container;
}

export function renderStatPill(scene: Phaser.Scene, x: number, y: number, text: string, fill = 0x2f3948) {
  const container = scene.add.container(x, y);
  container.add(scene.add.rectangle(0, 0, 82, 28, fill, 0.92).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.22));
  container.add(label(scene, 41, 14, text, 13, colors.ink).setOrigin(0.5));
  return container;
}
