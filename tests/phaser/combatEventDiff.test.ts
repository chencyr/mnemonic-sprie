import { describe, expect, it } from "vitest";
import type { CombatEvent } from "../../src/core";
import { consumeNewCombatEvents, type CombatEventCursor } from "../../src/phaser/fx/combatEventDiff";

function event(type: string, message = type): CombatEvent {
  return { type, message };
}

describe("consumeNewCombatEvents", () => {
  it("returns every event when entering a new combat id", () => {
    const cursor: CombatEventCursor = { combatId: "old-combat", eventCount: 4 };
    const result = consumeNewCombatEvents(cursor, "new-combat", [event("COMBAT_STARTED"), event("CARDS_DRAWN")]);

    expect(result.events.map((item) => item.type)).toEqual(["COMBAT_STARTED", "CARDS_DRAWN"]);
    expect(result.cursor).toEqual({ combatId: "new-combat", eventCount: 2 });
  });

  it("returns only events appended after the last cursor count", () => {
    const cursor: CombatEventCursor = { combatId: "combat-1", eventCount: 2 };
    const result = consumeNewCombatEvents(cursor, "combat-1", [event("COMBAT_STARTED"), event("CARDS_DRAWN"), event("PLAYER_DAMAGED")]);

    expect(result.events.map((item) => item.type)).toEqual(["PLAYER_DAMAGED"]);
    expect(result.cursor).toEqual({ combatId: "combat-1", eventCount: 3 });
  });

  it("recovers when an event list is shorter than the stored count", () => {
    const cursor: CombatEventCursor = { combatId: "combat-1", eventCount: 9 };
    const result = consumeNewCombatEvents(cursor, "combat-1", [event("COMBAT_STARTED")]);

    expect(result.events.map((item) => item.type)).toEqual(["COMBAT_STARTED"]);
    expect(result.cursor).toEqual({ combatId: "combat-1", eventCount: 1 });
  });
});
