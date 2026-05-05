import Phaser from "phaser";
import type { AssetRegistry, GameData, RewardState } from "../../core";
import { staggerChildren } from "../fx/screenFx";
import { button, label, panel } from "./uiPrimitives";
import { cardSize, colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { renderCardView } from "./CardView";
import { renderRelicRow } from "./RelicView";

export const REWARD_CARD_GAP = 240;

export function renderRewardView(
  scene: Phaser.Scene,
  context: UiRenderContext,
  data: GameData,
  assets: AssetRegistry,
  reward: RewardState,
  onChooseCard: (cardId: string) => void,
  onSkip: () => void
) {
  const root = scene.add.container(0, 0);
  const rewardCardViews: Phaser.GameObjects.GameObject[] = [];
  root.add(panel(scene, 72, 104, 1120, 520, "戰鬥獎勵"));
  reward.cards.forEach((card, index) => {
    const x = 210 + index * REWARD_CARD_GAP;
    const cardView = renderCardView({ scene, context, data, assets, x, y: 178, w: cardSize.rewardW, h: cardSize.rewardH, card, mode: "reward" });
    root.add(cardView);
    rewardCardViews.push(cardView);
    root.add(button(scene, context, `reward:${card.id}`, "加入牌組", x, 444, cardSize.rewardW, 44, () => onChooseCard(card.id)));
  });
  if (reward.relic) {
    root.add(label(scene, 842, 178, `精英遺物：${reward.relic.name}`, 18, colors.purpleText, 260));
    root.add(renderRelicRow(scene, context, data, assets, [reward.relic.id], 842, 214));
    root.add(label(scene, 842, 264, reward.relic.description, 14, "#d1d5db", 260));
  }
  root.add(button(scene, context, "reward:skip", `跳過 +${reward.gold} 金幣`, 506, 556, 240, 46, onSkip, true, colors.green));
  staggerChildren(scene, rewardCardViews, { delayStep: 80, duration: 260, yOffset: 24 });
  return root;
}
