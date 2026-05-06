import Phaser from "phaser";
import { isEnemyAlive, type AssetRegistry, type EnemyDefinition, type EnemyInstance, type GameData, type IntentIconType } from "../../core";
import type { EnemyPresentationState } from "../combat/enemyPresentationState";
import { button, image, label } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { renderHpBar, renderStatPill } from "./StatusView";

export const ENEMY_SIZE = 176;

export interface EnemyViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  data: GameData;
  assets: AssetRegistry;
  enemy: EnemyInstance;
  presentationState: EnemyPresentationState;
  x: number;
  y: number;
  selectedTargetEnabled: boolean;
  platformKey?: string;
  targetRingKey?: string;
  onTarget: () => void;
}

export function renderEnemyView(options: EnemyViewOptions) {
  const { scene, context, data, assets, enemy, presentationState, x, y, selectedTargetEnabled, onTarget } = options;
  const def = data.enemies.find((item) => item.id === enemy.enemyId) as EnemyDefinition;
  const gameplayAlive = isEnemyAlive(enemy);
  const targetable = gameplayAlive && presentationState === "alive";
  const root = scene.add.container(0, 0);
  if (options.platformKey && scene.textures.exists(options.platformKey)) {
    const platform = scene.add.image(x, y + 94, options.platformKey).setDisplaySize(220, 82).setAlpha(targetable ? 0.92 : presentationState === "dying" ? 0.55 : 0.36);
    context.visibleAssets.push({ key: options.platformKey, role: "combat-ui:enemy-platform" });
    root.add(platform);
  } else {
    root.add(scene.add.ellipse(x, y + 72, 176, 34, 0x000000, targetable ? 0.34 : 0.12));
  }
  if (selectedTargetEnabled && targetable) {
    if (options.targetRingKey && scene.textures.exists(options.targetRingKey)) {
      const ring = scene.add.image(x, y, options.targetRingKey).setDisplaySize(236, 236).setAlpha(0.9);
      context.visibleAssets.push({ key: options.targetRingKey, role: "combat-ui:target-ring" });
      root.add(ring);
    } else {
      root.add(scene.add.rectangle(x - 92, y - 92, 184, 244, 0xf4e04d, 0).setOrigin(0).setStrokeStyle(3, 0xf4e04d, 0.85));
    }
  }
  const sprite = image(scene, context, x, y, assets.getEnemySprite(enemy.enemyId).key, ENEMY_SIZE, ENEMY_SIZE, `enemy:${enemy.enemyId}`);
  if (sprite) {
    sprite.setAlpha(presentationState === "alive" ? 1 : presentationState === "dying" ? 0.58 : 0.34);
    if (presentationState === "dying") sprite.setDisplaySize(ENEMY_SIZE * 1.04, ENEMY_SIZE * 1.04);
    root.add(sprite);
  }
  root.add(renderHpBar(scene, x - 82, y + 96, 164, enemy.hp, enemy.maxHp, def.name));
  if (enemy.block > 0 && presentationState === "alive") root.add(renderStatPill(scene, x - 82, y + 142, `格擋 ${enemy.block}`, 0x39d98a));
  if (targetable) root.add(renderIntent(scene, context, assets, enemy.intent.type, enemy.intent.amount ?? 0, x + 36, y + 132));
  else root.add(renderStatPill(scene, x + 20, y + 128, presentationState === "dying" ? "倒下中" : "已擊倒", 0x6b7280));
  root.add(
    button(scene, context, `enemy:${enemy.instanceId}`, "目標", x - 54, y + 168, 108, 34, onTarget, selectedTargetEnabled && targetable, selectedTargetEnabled && targetable ? colors.red : colors.disabled)
  );
  return root;
}

function renderIntent(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry, intentType: IntentIconType, amount: number, x: number, y: number) {
  const root = scene.add.container(x, y);
  const icon = image(scene, context, 0, 0, assets.getIntentIcon(intentType).key, 34, 34, `intent:${intentType}`);
  if (icon) root.add(icon);
  root.add(label(scene, 24, -10, amount > 0 ? String(amount) : intentLabel(intentType), 14, colors.gold));
  return root;
}

function intentLabel(intentType: IntentIconType) {
  if (intentType === "attack") return "攻擊";
  if (intentType === "block") return "格擋";
  if (intentType === "debuff") return "狀態";
  return "混合";
}
