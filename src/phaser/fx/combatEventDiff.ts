import type { CombatEvent } from "../../core";

export interface CombatEventCursor {
  combatId?: string;
  eventCount: number;
}

export interface CombatEventDiff {
  events: CombatEvent[];
  cursor: CombatEventCursor;
}

export function consumeNewCombatEvents(cursor: CombatEventCursor, combatId: string, events: readonly CombatEvent[]): CombatEventDiff {
  const shouldReset = cursor.combatId !== combatId || cursor.eventCount > events.length;
  const start = shouldReset ? 0 : cursor.eventCount;

  return {
    events: events.slice(start),
    cursor: {
      combatId,
      eventCount: events.length
    }
  };
}
