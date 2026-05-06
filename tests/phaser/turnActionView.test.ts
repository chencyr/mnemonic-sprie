import { describe, expect, it } from "vitest";
import type { CombatTurnActionState } from "../../src/core";
import { deriveTurnActionUiSnapshot } from "../../src/phaser/ui/TurnActionView";

const playerReady: CombatTurnActionState = {
  mode: "combat",
  combatPhase: "player",
  turn: 2,
  energy: 3,
  maxEnergy: 3,
  canEndTurn: true,
  canPlayAnyHandCard: true,
  suggestedUiState: "playerReady"
};

describe("turn action view", () => {
  it("maps player-ready core state to an enabled end-turn action", () => {
    expect(deriveTurnActionUiSnapshot(playerReady)).toMatchObject({
      state: "playerReady",
      title: "玩家回合",
      turn: 2,
      energy: 3,
      maxEnergy: 3,
      labelAsset: "endTurnLabel",
      endTurnEnabled: true
    });
  });

  it("maps no-playable-card core state to an auto-end presentation", () => {
    expect(
      deriveTurnActionUiSnapshot({
        ...playerReady,
        energy: 0,
        canPlayAnyHandCard: false,
        suggestedUiState: "playerNoPlayableCards"
      })
    ).toMatchObject({
      state: "playerNoPlayableCards",
      title: "自動結束",
      message: "沒有可出的牌，系統會自動結束回合。",
      endTurnEnabled: true,
      labelAsset: "endTurnLabel"
    });
  });

  it("maps active manual transition to a disabled ending state", () => {
    expect(deriveTurnActionUiSnapshot(playerReady, { turnTransition: { kind: "manual", message: "回合結束。" } })).toMatchObject({
      state: "manualEnding",
      title: "回合結束",
      message: "回合結束。",
      endTurnEnabled: false,
      endTurnDisabledReason: "回合切換中。"
    });
  });

  it("maps enemy phase to the enemy-turn label asset", () => {
    expect(
      deriveTurnActionUiSnapshot({
        ...playerReady,
        combatPhase: "enemy",
        canEndTurn: false,
        canPlayAnyHandCard: false,
        endTurnDisabledReason: "敵人行動中。",
        suggestedUiState: "enemyPhase"
      })
    ).toMatchObject({
      state: "enemyActing",
      title: "敵方回合",
      labelAsset: "enemyTurnLabel",
      endTurnEnabled: false,
      endTurnDisabledReason: "敵人行動中。"
    });
  });

  it("keeps victory presentation separate from generic disabled state", () => {
    expect(deriveTurnActionUiSnapshot(playerReady, { victoryTransition: { message: "敵人倒下，記憶正在沉澱。" } })).toMatchObject({
      state: "victoryPresentation",
      title: "勝利過場",
      message: "敵人倒下，記憶正在沉澱。",
      labelAsset: "endTurnLabel",
      endTurnEnabled: false
    });
  });
});
