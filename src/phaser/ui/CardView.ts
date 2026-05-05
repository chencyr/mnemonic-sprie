import Phaser from "phaser";
import type { AssetRegistry, CardDefinition, CardInstance, GameData } from "../../core";
import { effectiveCardCost } from "../../core";
import { image, label } from "./uiPrimitives";
import { cardSize, colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
export type { ButtonDescriptor } from "./uiTypes";

export const CARD_WIDTH = 128;
export const CARD_HEIGHT = 178;

export interface CardViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  data: GameData;
  assets: AssetRegistry;
  x: number;
  y: number;
  w?: number;
  h?: number;
  card: CardDefinition;
  instance?: CardInstance;
  selected?: boolean;
  playable?: boolean;
  mode: "hand" | "reward" | "shop" | "preview";
}

export function renderCardView(options: CardViewOptions) {
  const { scene, context, data, assets, x, y, card, instance, selected = false, playable = true, mode } = options;
  const w = options.w ?? (mode === "hand" ? cardSize.handW : cardSize.rewardW);
  const h = options.h ?? (mode === "hand" ? cardSize.handH : cardSize.rewardH);
  const container = scene.add.container(x, y);
  const frameColor = selected ? 0xf4e04d : playable ? 0xf8fafc : 0x64748b;
  container.add(
    scene.add
      .rectangle(0, 0, w, h, 0x17202b, playable ? 0.96 : 0.64)
      .setOrigin(0)
      .setStrokeStyle(selected ? 4 : 2, frameColor, selected ? 0.88 : 0.42)
  );
  container.add(scene.add.rectangle(8, 8, w - 16, Math.floor(h * 0.48), 0x0f172a, 0.78).setOrigin(0));
  const art = image(
    scene,
    context,
    w / 2,
    8 + Math.floor(h * 0.24),
    assets.getCardArt(card.id).key,
    w - 22,
    Math.floor(h * 0.44),
    `card:${card.id}`,
    playable ? 0.96 : 0.52
  );
  if (art) container.add(art);
  container.add(scene.add.circle(22, 22, 18, costColor(card.type), 1).setStrokeStyle(2, 0xffffff, 0.7));
  const cost = instance ? effectiveCardCost(data, instance) : card.cost;
  container.add(label(scene, 22, 22, String(cost), 18, "#101318").setOrigin(0.5));
  container.add(label(scene, 12, Math.floor(h * 0.53), instance?.mutation?.name ?? card.name, mode === "hand" ? 14 : 16, colors.ink, w - 24));
  container.add(scene.add.rectangle(12, Math.floor(h * 0.67), w - 24, 4, costColor(card.type), 0.92).setOrigin(0));
  container.add(label(scene, 12, Math.floor(h * 0.72), card.description, mode === "hand" ? 10 : 12, "#e5e7eb", w - 24));
  renderMemoryRow(scene, container, context, assets, instance, 12, h - 26, w - 24);
  return container;
}

function renderMemoryRow(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  context: UiRenderContext,
  assets: AssetRegistry,
  instance: CardInstance | undefined,
  x: number,
  y: number,
  width: number
) {
  const memoryTypes = ["bloodthirst", "desperation", "grudge", "obsession", "witness"] as const;
  const gap = Math.min(26, Math.floor(width / memoryTypes.length));
  memoryTypes.forEach((memoryType, index) => {
    const value = instance?.memory[memoryType] ?? 0;
    const asset = assets.getMemorySticker(value > 0 ? memoryType : "empty");
    const sticker = image(scene, context, x + index * gap + 10, y + 10, asset.key, 20, 20, `memory:${memoryType}`, value > 0 ? 1 : 0.36);
    if (sticker) container.add(sticker);
    if (value > 0) container.add(label(scene, x + index * gap + 18, y + 14, String(value), 10, colors.gold).setOrigin(0.5));
  });
}

function costColor(type: CardDefinition["type"]) {
  if (type === "attack") return 0xee4266;
  if (type === "defense") return 0x39d98a;
  if (type === "skill") return 0x8b5cf6;
  return 0xf4e04d;
}
