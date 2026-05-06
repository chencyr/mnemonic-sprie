import type Phaser from "phaser";
import type { AssetRegistry, CombatTurnActionState } from "../../core";
import { image, label } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export type TurnActionUiState =
  | "playerReady"
  | "playerNoPlayableCards"
  | "manualEnding"
  | "autoEndingNoPlayableCards"
  | "enemyActing"
  | "victoryPresentation"
  | "disabled";

export interface TurnActionPresentationState {
  turnTransition?: {
    kind: "manual" | "autoNoPlayableCards";
    message: string;
  };
  victoryTransition?: {
    message: string;
  };
}

export interface TurnActionUiSnapshot {
  state: TurnActionUiState;
  title: string;
  message: string;
  turn: number;
  energy: number;
  maxEnergy: number;
  labelAsset: "endTurnLabel" | "enemyTurnLabel";
  endTurnEnabled: boolean;
  endTurnDisabledReason?: string;
}

export interface RenderTurnActionViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  assets: AssetRegistry;
  x: number;
  y: number;
  snapshot: TurnActionUiSnapshot;
  onEndTurn: () => void;
}

const BUTTON_CENTER_X = 170;
const BUTTON_CENTER_Y = 136;
const BUTTON_DISPLAY_W = 292;
const BUTTON_DISPLAY_H = 154;
const BUTTON_LEFT_X = BUTTON_CENTER_X - BUTTON_DISPLAY_W / 2;
const BUTTON_ROTATION = (-20 * Math.PI) / 180;
const LABEL_DISPLAY_W = 169;
const LABEL_DISPLAY_H = 55;
const STATE_FRAME_W = 150;
const STATE_FRAME_H = 48;
const STATE_FRAME_CENTER_X = BUTTON_LEFT_X + STATE_FRAME_W / 2;
const STATE_FRAME_CENTER_Y = 31;

export function deriveTurnActionUiSnapshot(
  coreState: CombatTurnActionState,
  presentation: TurnActionPresentationState = {}
): TurnActionUiSnapshot {
  const turn = coreState.turn ?? 0;
  const energy = coreState.energy ?? 0;
  const maxEnergy = coreState.maxEnergy;

  if (presentation.victoryTransition) {
    return {
      state: "victoryPresentation",
      title: "勝利過場",
      message: presentation.victoryTransition.message,
      turn,
      energy,
      maxEnergy,
      labelAsset: "endTurnLabel",
      endTurnEnabled: false,
      endTurnDisabledReason: "勝利處理中。"
    };
  }

  if (presentation.turnTransition?.kind === "manual") {
    return {
      state: "manualEnding",
      title: "回合結束",
      message: presentation.turnTransition.message,
      turn,
      energy,
      maxEnergy,
      labelAsset: "enemyTurnLabel",
      endTurnEnabled: false
    };
  }

  if (presentation.turnTransition?.kind === "autoNoPlayableCards") {
    return {
      state: "autoEndingNoPlayableCards",
      title: "自動結束",
      message: presentation.turnTransition.message,
      turn,
      energy,
      maxEnergy,
      labelAsset: "enemyTurnLabel",
      endTurnEnabled: false
    };
  }

  if (coreState.suggestedUiState === "playerReady") {
    return {
      state: "playerReady",
      title: "玩家回合",
      message: "選擇卡牌，或主動結束回合。",
      turn,
      energy,
      maxEnergy,
      labelAsset: "endTurnLabel",
      endTurnEnabled: coreState.canEndTurn
    };
  }

  if (coreState.suggestedUiState === "playerNoPlayableCards") {
    return {
      state: "playerNoPlayableCards",
      title: "自動結束",
      message: "沒有可出的牌，系統會自動結束回合。",
      turn,
      energy,
      maxEnergy,
      labelAsset: "endTurnLabel",
      endTurnEnabled: coreState.canEndTurn
    };
  }

  if (coreState.suggestedUiState === "enemyPhase") {
    return {
      state: "enemyActing",
      title: "敵方回合",
      message: "敵人行動中。",
      turn,
      energy,
      maxEnergy,
      labelAsset: "enemyTurnLabel",
      endTurnEnabled: false,
      endTurnDisabledReason: coreState.endTurnDisabledReason
    };
  }

  return {
    state: "disabled",
    title: coreState.suggestedUiState === "defeat" ? "挑戰失敗" : "不可操作",
    message: coreState.endTurnDisabledReason ?? "目前不能結束回合。",
    turn,
    energy,
    maxEnergy,
    labelAsset: "endTurnLabel",
    endTurnEnabled: false,
    endTurnDisabledReason: coreState.endTurnDisabledReason
  };
}

export function renderTurnActionView(options: RenderTurnActionViewOptions) {
  const { scene, context, assets, x, y, snapshot, onEndTurn } = options;
  const root = scene.add.container(x, y);

  const frame = image(
    scene,
    context,
    STATE_FRAME_CENTER_X,
    STATE_FRAME_CENTER_Y,
    assets.getCombatUiAsset("turnEnergyFrame").key,
    STATE_FRAME_W,
    STATE_FRAME_H,
    "combat-ui:turn-energy-frame"
  );
  if (frame) root.add(frame);
  else root.add(scene.add.rectangle(BUTTON_LEFT_X, 7, STATE_FRAME_W, STATE_FRAME_H, 0x000000, 0.64).setOrigin(0).setStrokeStyle(2, 0xf4c542, 0.86));

  root.add(label(scene, BUTTON_LEFT_X + 17, 15, `回合 ${snapshot.turn}`, 10, colors.ink, 58));
  root.add(label(scene, BUTTON_LEFT_X + 17, 34, `能量`, 10, colors.cyanText, 42));

  for (let index = 0; index < snapshot.maxEnergy; index += 1) {
    const icon = image(
      scene,
      context,
      BUTTON_LEFT_X + 89 + index * 18,
      39,
      assets.getCombatUiAsset("energyLightningIcon").key,
      14,
      14,
      `combat-ui:energy-lightning-icon-${index}`,
      index < snapshot.energy ? 1 : 0.26
    );
    if (icon) root.add(icon);
  }

  const plateAlpha = snapshot.endTurnEnabled || snapshot.labelAsset === "enemyTurnLabel" ? 1 : 0.52;
  const plate = image(
    scene,
    context,
    BUTTON_CENTER_X,
    BUTTON_CENTER_Y,
    assets.getCombatUiAsset("endTurnButtonPlate").key,
    BUTTON_DISPLAY_W,
    BUTTON_DISPLAY_H,
    "combat-ui:end-turn-button-plate",
    plateAlpha
  );
  if (plate) root.add(plate.setRotation(BUTTON_ROTATION));

  const labelRole = snapshot.labelAsset === "enemyTurnLabel" ? "combat-ui:enemy-turn-label" : "combat-ui:end-turn-label";
  const labelSprite = image(scene, context, BUTTON_CENTER_X, BUTTON_CENTER_Y, assets.getCombatUiAsset(snapshot.labelAsset).key, LABEL_DISPLAY_W, LABEL_DISPLAY_H, labelRole, plateAlpha);
  if (labelSprite) root.add(labelSprite);

  const hitZone = scene.add.zone(38, 90, 264, 88).setOrigin(0).setInteractive({ useHandCursor: snapshot.endTurnEnabled });
  hitZone.setName("end-turn");
  hitZone.on("pointerup", () => {
    if (snapshot.endTurnEnabled) onEndTurn();
  });
  context.buttons.push({
    id: "end-turn",
    label: snapshot.labelAsset === "enemyTurnLabel" ? "敵方回合" : "結束回合",
    x: x + BUTTON_CENTER_X,
    y: y + BUTTON_CENTER_Y,
    w: 264,
    h: 88,
    enabled: snapshot.endTurnEnabled
  });
  root.add(hitZone);

  if (snapshot.endTurnDisabledReason) {
    root.add(label(scene, 38, 184, snapshot.endTurnDisabledReason, 11, "#d1d5db", 260));
  }

  return root;
}
