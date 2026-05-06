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

export interface UiBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TurnActionUiLayoutSnapshot {
  statusFrame: UiBounds;
  statusContent: {
    turnText: UiBounds;
    energyText: UiBounds;
    energyIcons: UiBounds[];
  };
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
const LABEL_CENTER_X = BUTTON_CENTER_X + 10;
const LABEL_CENTER_Y = BUTTON_CENTER_Y - 5;
const LABEL_ROTATION = (-15 * Math.PI) / 180;
const LABEL_DISPLAY_W = 184;
const LABEL_DISPLAY_H = 60;
const STATE_FRAME_W = 156;
const STATE_FRAME_H = 54;
const STATE_FRAME_CENTER_X = BUTTON_LEFT_X + STATE_FRAME_W / 2;
const STATE_FRAME_CENTER_Y = 72;
const STATUS_FRAME_LEFT_X = STATE_FRAME_CENTER_X - STATE_FRAME_W / 2;
const STATUS_FRAME_TOP_Y = STATE_FRAME_CENTER_Y - STATE_FRAME_H / 2;
const TURN_TEXT_X = STATUS_FRAME_LEFT_X + 30;
const TURN_TEXT_Y = STATUS_FRAME_TOP_Y + 7;
const TURN_TEXT_W = 72;
const TURN_TEXT_H = 18;
const ENERGY_TEXT_X = STATUS_FRAME_LEFT_X + 30;
const ENERGY_TEXT_Y = STATUS_FRAME_TOP_Y + 29;
const ENERGY_TEXT_W = 42;
const ENERGY_TEXT_H = 18;
const ENERGY_ICON_SIZE = 20;
const ENERGY_ICON_X = STATUS_FRAME_LEFT_X + 88;
const ENERGY_ICON_Y = STATUS_FRAME_TOP_Y + 38;
const ENERGY_ICON_GAP = 14;

function absoluteBounds(rootX: number, rootY: number, bounds: UiBounds): UiBounds {
  return {
    x: rootX + bounds.x,
    y: rootY + bounds.y,
    w: bounds.w,
    h: bounds.h
  };
}

function imageBounds(centerX: number, centerY: number, size: number): UiBounds {
  return {
    x: centerX - size / 2,
    y: centerY - size / 2,
    w: size,
    h: size
  };
}

export function getTurnActionUiLayout(x: number, y: number, snapshot: TurnActionUiSnapshot): TurnActionUiLayoutSnapshot {
  return {
    statusFrame: absoluteBounds(x, y, {
      x: STATUS_FRAME_LEFT_X,
      y: STATUS_FRAME_TOP_Y,
      w: STATE_FRAME_W,
      h: STATE_FRAME_H
    }),
    statusContent: {
      turnText: absoluteBounds(x, y, {
        x: TURN_TEXT_X,
        y: TURN_TEXT_Y,
        w: TURN_TEXT_W,
        h: TURN_TEXT_H
      }),
      energyText: absoluteBounds(x, y, {
        x: ENERGY_TEXT_X,
        y: ENERGY_TEXT_Y,
        w: ENERGY_TEXT_W,
        h: ENERGY_TEXT_H
      }),
      energyIcons: Array.from({ length: snapshot.maxEnergy }, (_, index) =>
        absoluteBounds(x, y, imageBounds(ENERGY_ICON_X + index * ENERGY_ICON_GAP, ENERGY_ICON_Y, ENERGY_ICON_SIZE))
      )
    }
  };
}

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
  else root.add(scene.add.rectangle(STATUS_FRAME_LEFT_X, STATUS_FRAME_TOP_Y, STATE_FRAME_W, STATE_FRAME_H, 0x000000, 0.64).setOrigin(0).setStrokeStyle(2, 0xf4c542, 0.86));

  const turnText = label(scene, TURN_TEXT_X, TURN_TEXT_Y, `回合 ${snapshot.turn}`, 15, "#fff3a6", TURN_TEXT_W);
  turnText.setFontStyle("900");
  turnText.setShadow(1, 1, "#111827", 2, true, true);
  root.add(turnText);

  const energyText = label(scene, ENERGY_TEXT_X, ENERGY_TEXT_Y, `能量`, 14, colors.cyanText, ENERGY_TEXT_W);
  energyText.setFontStyle("900");
  energyText.setShadow(1, 1, "#111827", 2, true, true);
  root.add(energyText);

  for (let index = 0; index < snapshot.maxEnergy; index += 1) {
    const icon = image(
      scene,
      context,
      ENERGY_ICON_X + index * ENERGY_ICON_GAP,
      ENERGY_ICON_Y,
      assets.getCombatUiAsset("energyLightningIcon").key,
      ENERGY_ICON_SIZE,
      ENERGY_ICON_SIZE,
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
  const labelSprite = image(scene, context, LABEL_CENTER_X, LABEL_CENTER_Y, assets.getCombatUiAsset(snapshot.labelAsset).key, LABEL_DISPLAY_W, LABEL_DISPLAY_H, labelRole, plateAlpha);
  if (labelSprite) root.add(labelSprite.setRotation(LABEL_ROTATION));

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
