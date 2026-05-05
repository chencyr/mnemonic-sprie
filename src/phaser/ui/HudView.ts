import Phaser from "phaser";
import type { AssetRegistry, GameData, RunState } from "../../core";
import { button, label, panel } from "./uiPrimitives";
import { colors, HUD_FONT, layout } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { renderContractRow } from "./ContractView";
import { renderRelicRow } from "./RelicView";
import { renderHpBar, renderStatPill } from "./StatusView";

export { HUD_FONT };

export function renderHudShell(
  scene: Phaser.Scene,
  context: UiRenderContext,
  data: GameData,
  assets: AssetRegistry,
  run: RunState,
  muted: boolean,
  onToggleMute: () => void
) {
  const root = scene.add.container(0, 0);
  root.add(scene.add.rectangle(0, 0, 1280, layout.topBarHeight, colors.panel, 0.96).setOrigin(0));
  root.add(label(scene, 24, 14, "記憶牌塔", 24, colors.ink));
  root.add(label(scene, 158, 18, `F${run.floor || 0}/12`, 20, colors.ink));
  root.add(label(scene, 290, 20, `金幣 ${run.gold}`, 18, colors.gold));
  root.add(renderRelicRow(scene, context, data, assets, run.relics, 430, 13));
  root.add(renderContractRow(scene, context, data, assets, run.activeContracts, 708, 13));
  root.add(button(scene, context, "mute", muted ? "音訊關" : "音訊開", 1130, 18, 110, 36, onToggleMute));
  return root;
}

export interface PlayerPanelVitals {
  hp: number;
  maxHp: number;
  energy: number;
  block: number;
}

export function renderPlayerPanel(scene: Phaser.Scene, run: RunState, vitals?: PlayerPanelVitals) {
  const hp = vitals?.hp ?? run.playerHp;
  const maxHp = vitals?.maxHp ?? run.playerMaxHp;
  const energy = vitals?.energy ?? 0;
  const block = vitals?.block ?? 0;
  const root = panel(scene, layout.leftPanel.x, layout.leftPanel.y, layout.leftPanel.w, layout.leftPanel.h, "拾憶者");
  root.add(renderHpBar(scene, 14, 52, 184, hp, maxHp, "HP"));
  root.add(renderStatPill(scene, 14, 104, `能量 ${energy}/3`, 0x2dd4bf));
  root.add(renderStatPill(scene, 106, 104, `格擋 ${block}`, 0x39d98a));
  root.add(label(scene, 14, 154, `牌組 ${run.deck.length}`, 15, "#a7f3d0"));
  root.add(label(scene, 14, 184, `樓層 ${run.floor || 0}`, 15, colors.ink));
  return root;
}
