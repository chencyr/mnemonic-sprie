import { describe, expect, it } from "vitest";
import {
  createRun,
  getCombatTurnActionState,
  loadGameData,
  selectMapNode,
  startRun,
  type CardInstance,
  type CombatState
} from "../../src/core";

const data = loadGameData();

function combatEngine() {
  const engine = createRun(data, { seed: 20260505, quick: true });
  startRun(engine);
  selectMapNode(engine, engine.run.reachableNodeIds[0]);
  if (!engine.run.currentCombat) throw new Error("fixture did not enter combat");
  return engine;
}

function card(instanceId: string, cardId: string): CardInstance {
  return {
    instanceId,
    cardId,
    memory: { bloodthirst: 0, desperation: 0, grudge: 0, obsession: 0, witness: 0 },
    combatCostDelta: 0,
    retained: false,
    retainedStreak: 0,
    usedThisCombat: 0,
    discardedThisCombat: 0,
    exhausted: false
  };
}

function setHand(combat: CombatState, cards: CardInstance[]) {
  combat.cards = cards;
  combat.hand = cards.map((item) => item.instanceId);
  combat.drawPile = [];
  combat.discardPile = [];
}

describe("combat turn action state", () => {
  it("returns notCombat outside combat", () => {
    const engine = createRun(data, { seed: 1, quick: true });

    expect(getCombatTurnActionState(engine)).toEqual({
      mode: "notCombat",
      maxEnergy: 3,
      canEndTurn: false,
      canPlayAnyHandCard: false,
      endTurnDisabledReason: "不在戰鬥中。",
      suggestedUiState: "notCombat"
    });
  });

  it("reports playerReady when at least one hand card can be played", () => {
    const engine = combatEngine();
    const combat = engine.run.currentCombat!;
    combat.phase = "player";
    combat.player.energy = 3;
    setHand(combat, [card("strike-1", "strike")]);

    expect(getCombatTurnActionState(engine)).toMatchObject({
      mode: "combat",
      combatPhase: "player",
      turn: combat.turn,
      energy: 3,
      maxEnergy: 3,
      canEndTurn: true,
      canPlayAnyHandCard: true,
      suggestedUiState: "playerReady"
    });
  });

  it("reports playerNoPlayableCards when the player has no legal plays", () => {
    const engine = combatEngine();
    const combat = engine.run.currentCombat!;
    combat.phase = "player";
    combat.player.energy = 0;
    setHand(combat, [card("strike-1", "strike")]);

    expect(getCombatTurnActionState(engine)).toMatchObject({
      mode: "combat",
      combatPhase: "player",
      energy: 0,
      canEndTurn: true,
      canPlayAnyHandCard: false,
      suggestedUiState: "playerNoPlayableCards"
    });
  });

  it("disables end turn during enemy phase", () => {
    const engine = combatEngine();
    const combat = engine.run.currentCombat!;
    combat.phase = "enemy";

    expect(getCombatTurnActionState(engine)).toMatchObject({
      mode: "combat",
      combatPhase: "enemy",
      canEndTurn: false,
      endTurnDisabledReason: "敵人行動中。",
      suggestedUiState: "enemyPhase"
    });
  });

  it("disables end turn during victory and defeat phases", () => {
    const victoryEngine = combatEngine();
    victoryEngine.run.currentCombat!.phase = "victory";
    expect(getCombatTurnActionState(victoryEngine)).toMatchObject({
      canEndTurn: false,
      endTurnDisabledReason: "勝利處理中。",
      suggestedUiState: "victory"
    });

    const defeatEngine = combatEngine();
    defeatEngine.run.currentCombat!.phase = "defeat";
    expect(getCombatTurnActionState(defeatEngine)).toMatchObject({
      canEndTurn: false,
      endTurnDisabledReason: "失敗處理中。",
      suggestedUiState: "defeat"
    });
  });
});
