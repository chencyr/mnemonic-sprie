import { describe, expect, it } from "vitest";
import { createCombat, createRng, endPlayerTurn, loadGameData, playCard } from "../../src/core";

describe("combat engine", () => {
  it("starts combat with energy, hand, piles, and enemies", () => {
    const data = loadGameData();
    const combat = createCombat(data, createRng(7), {
      floor: 1,
      enemyKind: "normal",
      playerHp: 72,
      playerMaxHp: 72,
      deck: starterDeck(),
      enemyIds: ["sticker_punk"]
    });

    expect(combat.player.energy).toBe(3);
    expect(combat.player.hp).toBe(72);
    expect(combat.hand).toHaveLength(5);
    expect(combat.drawPile.length + combat.discardPile.length + combat.hand.length).toBe(11);
    expect(combat.enemies).toHaveLength(1);
  });

  it("plays a Strike, spends energy, damages target, and moves card to discard", () => {
    const data = loadGameData();
    const combat = createCombat(data, createRng(2), {
      floor: 1,
      enemyKind: "normal",
      playerHp: 72,
      playerMaxHp: 72,
      deck: starterDeck(),
      enemyIds: ["sticker_punk"]
    });
    const strike = combat.hand.map((id) => combat.cards.find((card) => card.instanceId === id)).find((card) => card?.cardId === "strike");
    expect(strike).toBeTruthy();

    playCard(combat, data, createRng(3), strike!.instanceId, { targetEnemyId: combat.enemies[0].instanceId });

    expect(combat.player.energy).toBe(2);
    expect(combat.enemies[0].hp).toBe(24);
    expect(combat.discardPile).toContain(strike!.instanceId);
  });

  it("resolves enemy turn and draws a new hand", () => {
    const data = loadGameData();
    const combat = createCombat(data, createRng(9), {
      floor: 1,
      enemyKind: "normal",
      playerHp: 72,
      playerMaxHp: 72,
      deck: starterDeck(),
      enemyIds: ["sticker_punk"]
    });

    endPlayerTurn(combat, data, createRng(10));

    expect(combat.phase).toBe("player");
    expect(combat.turn).toBe(2);
    expect(combat.hand.length).toBeGreaterThan(0);
    expect(combat.player.hp).toBeLessThanOrEqual(72);
  });
});

function starterDeck() {
  return [
    ...Array.from({ length: 5 }, (_, index) => card("strike", `strike-${index + 1}`)),
    ...Array.from({ length: 5 }, (_, index) => card("guard", `guard-${index + 1}`)),
    card("recall", "recall-1")
  ];
}

function card(cardId: string, instanceId: string) {
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
