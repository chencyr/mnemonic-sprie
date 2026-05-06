import { describe, expect, it } from "vitest";
import type { CombatState } from "../../src/core";
import { createCombatPlayerStatusUiState } from "../../src/phaser/ui/combatPlayerStatusUi";

function combatFixture(overrides: Partial<CombatState["player"]> = {}): CombatState {
  return {
    id: "combat-test",
    floor: 1,
    enemyKind: "normal",
    phase: "player",
    turn: 1,
    player: {
      hp: 72,
      maxHp: 72,
      block: 0,
      energy: 3,
      statuses: {},
      ...overrides
    },
    enemies: [],
    cards: [],
    hand: ["hand-1", "hand-2"],
    drawPile: ["draw-1", "draw-2", "draw-3"],
    discardPile: ["discard-1"],
    exhaustPile: [],
    events: [],
    playedThisTurn: [],
    playedCounts: {},
    summary: {
      attackCards: 0,
      defenseCards: 0,
      skillCards: 0,
      zeroCostCards: 0,
      totalCards: 0,
      retainedCards: 0,
      won: false
    },
    firstMemoryGained: false,
    bossCountermeasure: undefined
  };
}

describe("combat player status UI state", () => {
  it("derives healthy player status and resource counts", () => {
    const state = createCombatPlayerStatusUiState(combatFixture());

    expect(state).toEqual({
      hp: 72,
      maxHp: 72,
      hpRatio: 1,
      hpState: "healthy",
      block: 0,
      hasBlock: false,
      energy: 3,
      maxEnergy: 3,
      drawPileCount: 3,
      discardPileCount: 1,
      handCount: 2
    });
  });

  it.each([
    [36, "wounded"],
    [18, "critical"],
    [0, "dead"]
  ] as const)("maps hp %i to %s", (hp, hpState) => {
    const state = createCombatPlayerStatusUiState(combatFixture({ hp }));

    expect(state.hpState).toBe(hpState);
  });

  it("clamps hp ratio and exposes block presence", () => {
    const state = createCombatPlayerStatusUiState(combatFixture({ hp: 90, block: 12, energy: 2 }));

    expect(state.hpRatio).toBe(1);
    expect(state.block).toBe(12);
    expect(state.hasBlock).toBe(true);
    expect(state.energy).toBe(2);
  });
});
