import Phaser from "phaser";
import type { AssetRegistry, RunState } from "../../core";
import { image, label } from "./uiPrimitives";
import { colors, HUD_FONT } from "./uiTheme";
import type { CombatPlayerStatusUiState } from "./combatPlayerStatusUi";
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
  playerPanel: { x: 16, y: 12, w: 336, h: 192 },
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
  context: UiRenderContext,
  assets: AssetRegistry,
  status: CombatPlayerStatusUiState
) {
  const root = scene.add.container(combatLayout.playerPanel.x, combatLayout.playerPanel.y);
  const assetKey = assets.getCombatUiAsset("playerStatusBase").key;
  const hpFill = playerStatusHpFill(status);
  root.add(scene.add.rectangle(hpFill.x, hpFill.y, hpFill.w * status.hpRatio, hpFill.h, hpFill.color, 0.96).setOrigin(0));
  const base = image(
    scene,
    context,
    combatLayout.playerPanel.w / 2,
    combatLayout.playerPanel.h / 2,
    assetKey,
    combatLayout.playerPanel.w,
    combatLayout.playerPanel.h,
    "combat-ui:player-status-base"
  );
  if (base) root.add(base);

  root.add(statusText(scene, 212, 92, `${status.hp}/${status.maxHp}`, 21, "#fff8d8", 0.5));
  root.add(statusText(scene, 153, 137, `${status.energy}/${status.maxEnergy}`, 20, "#062024", 0.5));
  root.add(statusText(scene, 266, 137, `${status.block}`, 20, status.hasBlock ? "#f1ffe9" : "#c4d8bf", 0.5));
  return root;
}

function playerStatusHpFill(status: CombatPlayerStatusUiState) {
  const colorByState: Record<CombatPlayerStatusUiState["hpState"], number> = {
    healthy: 0xff335f,
    wounded: 0xff7a2f,
    critical: 0xff1f6d,
    dead: 0x3f0b18
  };
  return {
    x: 122,
    y: 80,
    w: 172,
    h: 22,
    color: colorByState[status.hpState]
  };
}

function statusText(scene: Phaser.Scene, x: number, y: number, value: string, size: number, color: string, originX = 0) {
  return scene.add
    .text(x, y, value, {
      color,
      fontFamily: HUD_FONT,
      fontSize: `${size}px`,
      fontStyle: size >= 18 ? "800" : "650",
      align: "center"
    })
    .setOrigin(originX, 0.5);
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
  const root = scene.add.container(combatLayout.handTray.x, combatLayout.handTray.y);
  root.add(translucentRegion(scene, combatLayout.handTray.w, combatLayout.handTray.h));
  root.add(label(scene, 12, 12, "手牌", 18, colors.ink));
  return root;
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
