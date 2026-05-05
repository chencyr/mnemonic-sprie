import Phaser from "phaser";
import type { AssetRegistry, GameData } from "../../core";
import { image, label } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export function renderRelicRow(scene: Phaser.Scene, context: UiRenderContext, data: GameData, assets: AssetRegistry, relicIds: readonly string[], x: number, y: number) {
  const container = scene.add.container(x, y);
  container.add(label(scene, 0, 0, "遺物", 14, colors.purpleText));
  relicIds.slice(0, 6).forEach((relicId, index) => {
    const relic = data.relics.find((item) => item.id === relicId);
    const icon = image(scene, context, 52 + index * 34, 8, assets.getRelicIcon(relicId).key, 28, 28, `relic:${relicId}`);
    if (icon) container.add(icon);
    if (relic && index === 0) container.add(label(scene, 42, 28, relic.name, 10, "#e9d5ff", 130));
  });
  return container;
}
