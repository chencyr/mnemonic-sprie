import Phaser from "phaser";
import type { AssetRegistry, GameData, ShopItem } from "../../core";
import { button, image, label, panel } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { renderCardView } from "./CardView";

export const SHOP_ITEM_WIDTH = 220;

export function renderShopView(
  scene: Phaser.Scene,
  context: UiRenderContext,
  data: GameData,
  assets: AssetRegistry,
  items: readonly ShopItem[],
  gold: number,
  onBuy: (itemId: string) => void,
  onLeave: () => void
) {
  const root = scene.add.container(0, 0);
  root.add(panel(scene, 64, 104, 1120, 514, `商人  金幣 ${gold}`));
  items.forEach((item, index) => {
    const x = 100 + index * 178;
    const y = 188;
    const soldOrPoor = item.sold || gold < item.price;
    if (item.kind === "card") {
      const card = data.cards.find((entry) => entry.id === item.itemId);
      if (card) root.add(renderCardView({ scene, context, data, assets, x, y, w: 160, h: 214, card, mode: "shop", playable: !soldOrPoor }));
    } else {
      root.add(panel(scene, x, y, 160, 214, item.kind === "relic" ? "遺物" : "服務"));
      const iconKey = item.kind === "relic" ? assets.getRelicIcon(item.itemId).key : assets.getPlaceholder("uiIcon").key;
      const icon = image(scene, context, x + 80, y + 78, iconKey, 82, 82, `shop:${item.kind}:${item.itemId}`, soldOrPoor ? 0.45 : 1);
      if (icon) root.add(icon);
      const name = item.kind === "relic" ? data.relics.find((relic) => relic.id === item.itemId)?.name ?? item.itemId : "移除一張牌";
      root.add(label(scene, x + 16, y + 138, name, 15, colors.ink, 128));
    }
    root.add(button(scene, context, `shop:${item.id}`, item.sold ? "已售出" : `${item.price}G`, x, y + 226, 160, 42, () => onBuy(item.id), !soldOrPoor));
  });
  root.add(button(scene, context, "shop:leave", "離開商店", 520, 556, 220, 48, onLeave, true, colors.green));
  return root;
}
