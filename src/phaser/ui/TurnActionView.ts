import Phaser from "phaser";
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
      labelAsset: "endTurnLabel",
      endTurnEnabled: false,
      endTurnDisabledReason: "回合切換中。"
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
      labelAsset: "endTurnLabel",
      endTurnEnabled: false,
      endTurnDisabledReason: "回合切換中。"
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

  const frame = image(scene, context, 168, 36, assets.getCombatUiAsset("turnEnergyFrame").key, 282, 90, "combat-ui:turn-energy-frame");
  if (frame) root.add(frame);
  else root.add(scene.add.rectangle(18, 4, 300, 86, 0x000000, 0.64).setOrigin(0).setStrokeStyle(2, 0xf4c542, 0.86));

  root.add(label(scene, 60, 10, `回合 ${snapshot.turn}`, 15, colors.ink, 92));
  root.add(label(scene, 60, 43, `能量 ${snapshot.energy}/${snapshot.maxEnergy}`, 14, colors.cyanText, 104));

  for (let index = 0; index < snapshot.maxEnergy; index += 1) {
    const icon = image(
      scene,
      context,
      206 + index * 30,
      50,
      assets.getCombatUiAsset("energyLightningIcon").key,
      22,
      22,
      `combat-ui:energy-lightning-icon-${index}`,
      index < snapshot.energy ? 1 : 0.26
    );
    if (icon) root.add(icon);
  }

  const plateAlpha = snapshot.endTurnEnabled || snapshot.state === "enemyActing" ? 1 : 0.52;
  const plate = image(scene, context, 170, 136, assets.getCombatUiAsset("endTurnButtonPlate").key, 292, 154, "combat-ui:end-turn-button-plate", plateAlpha);
  if (plate) root.add(plate);

  const labelRole = snapshot.labelAsset === "enemyTurnLabel" ? "combat-ui:enemy-turn-label" : "combat-ui:end-turn-label";
  const labelSprite = image(scene, context, 170, 136, assets.getCombatUiAsset(snapshot.labelAsset).key, 178, 58, labelRole, plateAlpha);
  if (labelSprite) root.add(labelSprite);

  const hitZone = scene.add.zone(38, 90, 264, 88).setOrigin(0).setInteractive({ useHandCursor: snapshot.endTurnEnabled });
  hitZone.setName("end-turn");
  hitZone.on("pointerup", () => {
    if (snapshot.endTurnEnabled) onEndTurn();
  });
  context.buttons.push({
    id: "end-turn",
    label: snapshot.labelAsset === "enemyTurnLabel" ? "敵方回合" : "結束回合",
    x: x + 170,
    y: y + 136,
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
