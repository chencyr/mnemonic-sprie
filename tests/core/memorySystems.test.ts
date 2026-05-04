import { describe, expect, it } from "vitest";
import { chooseBossCountermeasure, loadGameData, mutateCardInstance, type CardInstance } from "../../src/core";

describe("memory systems", () => {
  it("mutates an eligible card once", () => {
    const data = loadGameData();
    const card: CardInstance = {
      instanceId: "strike-1",
      cardId: "strike",
      memory: { bloodthirst: 3, desperation: 0, grudge: 0, obsession: 0, witness: 0 },
      combatCostDelta: 0,
      retained: false,
      retainedStreak: 0,
      usedThisCombat: 0,
      discardedThisCombat: 0,
      exhausted: false
    };

    const result = mutateCardInstance(data, card, "bloodthirst", 4);

    expect(result.label).toContain("嗜血");
    expect(card.mutation?.damageBonus).toBe(2);
    expect(() => mutateCardInstance(data, card, "bloodthirst", 5)).toThrow("not eligible");
  });

  it("selects a Boss countermeasure from recent habits", () => {
    expect(
      chooseBossCountermeasure([
        { attackCards: 5, defenseCards: 1, skillCards: 0, zeroCostCards: 0, totalCards: 6, retainedCards: 0, won: true },
        { attackCards: 4, defenseCards: 1, skillCards: 0, zeroCostCards: 0, totalCards: 5, retainedCards: 0, won: true }
      ])
    ).toBe("spikes_vs_attacks");

    expect(
      chooseBossCountermeasure([
        { attackCards: 0, defenseCards: 1, skillCards: 4, zeroCostCards: 4, totalCards: 5, retainedCards: 0, won: true }
      ])
    ).toBe("zero_cost_ward");
  });
});
