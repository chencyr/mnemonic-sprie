import { describe, expect, it } from "vitest";
import type { CombatEvent } from "../../src/core";
import { activeFeedbackItems, mapCombatEventsToFeedback, tickerItems, type CombatFeedbackItem } from "../../src/phaser/fx/combatFeedback";

function event(type: string, payload?: unknown, message = type): CombatEvent {
  return { type, message, payload };
}

describe("combat feedback mapping", () => {
  it("maps enemy damage into local feedback and ticker text", () => {
    const feedback = mapCombatEventsToFeedback([event("DAMAGE_DEALT", { enemy: "enemy-1", damage: 6 }, "造成 6 傷害。")], {
      now: 1000,
      sequenceStart: 0
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        id: "feedback-1000-0",
        type: "damage",
        text: "-6",
        tickerText: "造成 6 傷害",
        anchor: "enemy",
        enemyId: "enemy-1",
        createdAt: 1000,
        expiresAt: 1800
      })
    ]);
  });

  it("maps player block gain into player feedback", () => {
    const feedback = mapCombatEventsToFeedback([event("BLOCK_GAINED", { block: 5 }, "獲得 5 格擋。")], {
      now: 2000,
      sequenceStart: 3
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        id: "feedback-2000-3",
        type: "block",
        text: "+5 格擋",
        tickerText: "獲得 5 格擋",
        anchor: "player"
      })
    ]);
  });

  it("maps memory progress into memory feedback", () => {
    const feedback = mapCombatEventsToFeedback([event("MEMORY_PROGRESS_GAINED", { card: "strike-1", memoryType: "bloodthirst", value: 1 })], {
      now: 3000,
      sequenceStart: 8
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        id: "feedback-3000-8",
        type: "memory",
        text: "記憶 +1",
        tickerText: "strike-1 獲得記憶",
        anchor: "hand",
        cardInstanceId: "strike-1"
      })
    ]);
  });

  it("maps card draw into hand feedback", () => {
    const feedback = mapCombatEventsToFeedback([event("CARDS_DRAWN", { cards: ["a", "b", "c"] })], {
      now: 4000,
      sequenceStart: 4
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        type: "draw",
        text: "抽 3 張",
        tickerText: "抽 3 張牌",
        anchor: "hand"
      })
    ]);
  });

  it("maps enemy death into center feedback", () => {
    const feedback = mapCombatEventsToFeedback([event("ENEMY_STATE_CHANGED", { enemy: "enemy-1", from: "alive", to: "dead" })], {
      now: 5000,
      sequenceStart: 1
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        type: "death",
        text: "敵人被擊倒",
        tickerText: "敵人被擊倒",
        anchor: "enemy",
        enemyId: "enemy-1",
        center: true
      })
    ]);
  });

  it("keeps active items by expiration and returns the last six ticker items", () => {
    const items: CombatFeedbackItem[] = Array.from({ length: 8 }, (_, index) => ({
      id: `item-${index}`,
      type: "system",
      text: `item ${index}`,
      tickerText: `ticker ${index}`,
      anchor: "ticker",
      createdAt: index * 100,
      expiresAt: 1000 + index
    }));

    expect(activeFeedbackItems(items, 1002).map((item) => item.id)).toEqual(["item-2", "item-3", "item-4", "item-5", "item-6", "item-7"]);
    expect(tickerItems(items).map((item) => item.id)).toEqual(["item-2", "item-3", "item-4", "item-5", "item-6", "item-7"]);
  });
});
