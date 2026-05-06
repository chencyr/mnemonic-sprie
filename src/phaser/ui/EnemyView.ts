import Phaser from "phaser";
import { isEnemyAlive, type AssetRegistry, type EnemyDefinition, type EnemyInstance, type GameData, type IntentIconType } from "../../core";
import type { EnemyPresentationState } from "../combat/enemyPresentationState";
import { image, label } from "./uiPrimitives";
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
  root.add(scene.add.ellipse(x, y + 72, 176, 34, 0x000000, targetable ? 0.34 : 0.12));
  const sprite = image(scene, context, x, y, assets.getEnemySprite(enemy.enemyId).key, ENEMY_SIZE, ENEMY_SIZE, `enemy:${enemy.enemyId}`);
  if (sprite) {
    sprite.setAlpha(presentationState === "alive" ? 1 : presentationState === "dying" ? 0.58 : 0.34);
    if (presentationState === "dying") sprite.setDisplaySize(ENEMY_SIZE * 1.04, ENEMY_SIZE * 1.04);
    if (presentationState === "alive") {
      scene.tweens.add({
        targets: sprite,
        y: y - 4,
        duration: 1600,
        ease: "Sine.inOut",
        yoyo: true,
        repeat: -1
      });
    }
    root.add(sprite);
  }
  root.add(renderHpBar(scene, x - 82, y + 96, 164, enemy.hp, enemy.maxHp, def.name));
  if (enemy.block > 0 && presentationState === "alive") root.add(renderStatPill(scene, x - 82, y + 142, `格擋 ${enemy.block}`, 0x39d98a));
  if (targetable) root.add(renderIntent(scene, context, assets, enemy.intent.type, enemy.intent.amount ?? 0, x + 36, y + 132));
  else root.add(renderStatPill(scene, x + 20, y + 128, presentationState === "dying" ? "倒下中" : "已擊倒", 0x6b7280));
  root.add(registerInvisibleTargetZone(scene, context, `enemy:${enemy.instanceId}`, x, y, onTarget, selectedTargetEnabled && targetable));
  return root;
}

function registerInvisibleTargetZone(scene: Phaser.Scene, context: UiRenderContext, id: string, x: number, y: number, onTarget: () => void, enabled: boolean) {
  const w = 220;
  const h = 260;
  const zone = scene.add.zone(x, y + 10, w, h).setOrigin(0.5);
  if (enabled) {
    zone.setInteractive({ useHandCursor: true });
    zone.on("pointerup", onTarget);
  }
  context.buttons.push({ id, label: "目標", x, y: y + 10, w, h, enabled });
  return zone;
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
