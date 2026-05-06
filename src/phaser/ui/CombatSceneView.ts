import Phaser from "phaser";
import type { AssetRegistry, RunState } from "../../core";
import { bar, image, label } from "./uiPrimitives";
import { colors, HUD_FONT } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export interface RectSpec {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CardPose extends RectSpec {
  rotation: number;
}

export const combatLayout = {
  playerPanel: { x: 24, y: 18, w: 318, h: 178 },
  topResource: { x: 650, y: 18, w: 468, h: 54 },
  battlefield: { x: 250, y: 86, w: 846, h: 422 },
  ticker: { x: 1112, y: 86, w: 148, h: 430 },
  handTray: { x: 252, y: 502, w: 760, h: 206 },
  turnDevice: { x: 1032, y: 532, w: 220, h: 168 },
  deckCounter: { x: 24, y: 612, w: 92, h: 92 },
  discardCounter: { x: 124, y: 624, w: 78, h: 78 }
} satisfies Record<string, RectSpec>;

export function handCardPose(index: number, total: number): CardPose {
  const w = 132;
  const h = 184;
  const clampedTotal = Math.max(1, total);
  const spacing = Math.min(144, combatLayout.handTray.w / clampedTotal);
  const totalWidth = spacing * (clampedTotal - 1) + w;
  const startX = combatLayout.handTray.x + Math.max(0, (combatLayout.handTray.w - totalWidth) / 2);
  const offsetFromCenter = index - (clampedTotal - 1) / 2;
  return {
    x: startX + index * spacing,
    y: combatLayout.handTray.y + 24 + Math.abs(offsetFromCenter) * 4,
    w,
    h,
    rotation: offsetFromCenter * 0.05
  };
}

export function enemyPose(index: number, total: number) {
  const poses = [
    { x: 462, y: 246 },
    { x: 742, y: 196 },
    { x: 940, y: 330 },
    { x: 560, y: 366 }
  ];
  return (
    poses[index] || {
      x: combatLayout.battlefield.x + 160 + (index % Math.max(1, total)) * 180,
      y: combatLayout.battlefield.y + 180
    }
  );
}

export function renderCombatBackground(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry) {
  const root = scene.add.container(0, 0);
  const bg = image(scene, context, 640, 360, assets.getCombatUiAsset("battleBg").key, 1280, 720, "combat-ui:background");
  if (bg) root.add(bg);
  root.add(scene.add.rectangle(0, 0, 1280, 720, 0x05070b, 0.22).setOrigin(0));
  return root;
}

export function renderCombatPlayerPanel(
  scene: Phaser.Scene,
  run: RunState,
  vitals: { hp: number; maxHp: number; energy: number; block: number }
) {
  const root = scene.add.container(combatLayout.playerPanel.x, combatLayout.playerPanel.y);
  root.add(translucentRegion(scene, combatLayout.playerPanel.w, combatLayout.playerPanel.h));
  root.add(label(scene, 82, 18, "HP", 16, "#ff4f8b"));
  root.add(label(scene, 82, 42, `${vitals.hp}/${vitals.maxHp}`, 22, colors.ink));
  root.add(bar(scene, 82, 74, 210, 12, vitals.hp / vitals.maxHp, colors.red, 0x111827));
  root.add(label(scene, 82, 100, `能量 ${vitals.energy}/3`, 17, colors.cyanText));
  root.add(label(scene, 82, 130, `格擋 ${vitals.block}`, 17, "#9cff72"));
  root.add(label(scene, 250, 130, `牌組 ${run.deck.length}`, 13, colors.muted));
  return root;
}

export function renderCombatTopResource(scene: Phaser.Scene, run: RunState) {
  const root = scene.add.container(combatLayout.topResource.x, combatLayout.topResource.y);
  root.add(translucentRegion(scene, combatLayout.topResource.w, combatLayout.topResource.h));
  root.add(label(scene, 22, 15, `F${run.floor || 0}/12`, 18, colors.ink));
  root.add(label(scene, 132, 15, `金幣 ${run.gold}`, 17, colors.gold));
  root.add(label(scene, 292, 15, `遺物 ${run.relics.length}`, 15, colors.purpleText));
  root.add(label(scene, 398, 15, `契約 ${run.activeContracts.length ? run.activeContracts.length : "無"}`, 15, colors.ink));
  return root;
}

export function renderCombatTurnDevice(scene: Phaser.Scene, turn: number, energy: number) {
  const root = scene.add.container(combatLayout.turnDevice.x, combatLayout.turnDevice.y);
  root.add(translucentRegion(scene, combatLayout.turnDevice.w, combatLayout.turnDevice.h));
  root.add(label(scene, 42, 22, `回合 ${turn}`, 17, colors.ink));
  root.add(label(scene, 42, 50, `能量 ${energy}/3`, 16, colors.cyanText));
  return root;
}

export function renderCombatTickerSurface(scene: Phaser.Scene) {
  const root = scene.add.container(combatLayout.ticker.x, combatLayout.ticker.y);
  root.add(translucentRegion(scene, combatLayout.ticker.w, combatLayout.ticker.h));
  root.add(label(scene, 20, 24, "戰況", 18, colors.ink));
  return root;
}

export function renderCombatHandTray(scene: Phaser.Scene) {
  return scene.add.container(combatLayout.handTray.x, combatLayout.handTray.y);
}

export function combatText(scene: Phaser.Scene, x: number, y: number, text: string, size: number, color = colors.ink) {
  return scene.add.text(x, y, text, {
    color,
    fontFamily: HUD_FONT,
    fontSize: `${size}px`,
    fontStyle: size >= 18 ? "800" : "650"
  });
}

function translucentRegion(scene: Phaser.Scene, w: number, h: number) {
  return scene.add.rectangle(0, 0, w, h, 0x000000, 0.58).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.14);
}
