import Phaser from "phaser";
import { colors, HUD_FONT } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, title?: string) {
  const container = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, colors.panel, 0.9).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.14);
  container.add(bg);
  if (title) {
    container.add(
      scene.add.text(14, 12, title, {
        color: colors.ink,
        fontFamily: HUD_FONT,
        fontSize: "18px",
        fontStyle: "800"
      })
    );
  }
  return container;
}

export function label(scene: Phaser.Scene, x: number, y: number, text: string, size = 16, color = colors.ink, wrapWidth?: number) {
  return scene.add.text(x, y, text, {
    color,
    fontFamily: HUD_FONT,
    fontSize: `${size}px`,
    fontStyle: size >= 22 ? "800" : "650",
    wordWrap: wrapWidth ? { width: wrapWidth } : undefined
  });
}

export function image(
  scene: Phaser.Scene,
  context: UiRenderContext,
  x: number,
  y: number,
  key: string,
  w: number,
  h: number,
  role: string,
  alpha = 1
) {
  if (!scene.textures.exists(key)) return undefined;
  const img = scene.add.image(x, y, key).setDisplaySize(w, h).setAlpha(alpha);
  context.visibleAssets.push({ key, role });
  return img;
}

export function button(
  scene: Phaser.Scene,
  context: UiRenderContext,
  id: string,
  labelText: string,
  x: number,
  y: number,
  w: number,
  h: number,
  onClick: () => void,
  enabled = true,
  fill = colors.cyan,
  alpha?: number
) {
  const rectAlpha = alpha ?? (enabled ? 0.94 : 0.52);
  const rect = scene.add.rectangle(x, y, w, h, enabled ? fill : colors.disabled, rectAlpha).setOrigin(0);
  rect.setStrokeStyle(2, 0xffffff, enabled ? 0.42 : 0.2);
  if (enabled) {
    rect.setInteractive({ useHandCursor: true });
    rect.on("pointerdown", onClick);
  }
  const text = label(scene, x + w / 2, y + h / 2, labelText, labelText.length > 10 ? 14 : 17, enabled ? "#101318" : colors.ink, w - 14);
  text.setOrigin(0.5);
  context.buttons.push({ id, label: labelText, x: x + w / 2, y: y + h / 2, w, h, enabled });
  return scene.add.container(0, 0, [rect, text]);
}

export function bar(scene: Phaser.Scene, x: number, y: number, w: number, h: number, ratio: number, fill: number, bg = 0x111827) {
  const container = scene.add.container(x, y);
  container.add(scene.add.rectangle(0, 0, w, h, bg, 0.9).setOrigin(0));
  container.add(scene.add.rectangle(0, 0, Math.max(0, Math.min(1, ratio)) * w, h, fill, 0.96).setOrigin(0));
  container.add(scene.add.rectangle(0, 0, w, h, 0xffffff, 0).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.22));
  return container;
}
