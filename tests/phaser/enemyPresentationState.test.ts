import { describe, expect, it } from "vitest";
import {
  ENEMY_DEATH_PRESENTATION_MS,
  createEnemyPresentationSnapshot,
  reconcileEnemyPresentationStates,
  resolveEnemyPresentationTransitions,
  type EnemyPresentationStateMap
} from "../../src/phaser/combat/enemyPresentationState";
import type { EnemyInstance } from "../../src/core";

function enemy(id: string, state: EnemyInstance["state"], hp: number): EnemyInstance {
  return {
    instanceId: id,
    enemyId: "sticker_punk",
    state,
    hp,
    maxHp: 12,
    block: 0,
    statuses: {},
    intent: { id: "attack", type: "attack", amount: 4, weight: 1 }
  };
}

describe("enemy presentation state", () => {
  it("starts newly dead enemies in dying state and blocks victory", () => {
    const states: EnemyPresentationStateMap = new Map([["enemy-a", { state: "alive" }]]);

    const result = reconcileEnemyPresentationStates(states, [enemy("enemy-a", "dead", 0)], 1000, false);

    expect(result.changed).toBe(true);
    expect(states.get("enemy-a")).toEqual({ state: "dying", startedAt: 1000, dueAt: 1000 + ENEMY_DEATH_PRESENTATION_MS });
    expect(createEnemyPresentationSnapshot(states, [enemy("enemy-a", "dead", 0)])).toEqual({
      enemies: [{ id: "enemy-a", gameplayState: "dead", presentationState: "dying" }],
      pendingDeathTransitions: ["enemy-a"],
      victoryBlockedByEnemyTransitions: true,
      aliveTargetCount: 0
    });
  });

  it("resolves due dying enemies to stable dead state", () => {
    const states: EnemyPresentationStateMap = new Map([["enemy-a", { state: "dying", startedAt: 1000, dueAt: 2000 }]]);

    const result = resolveEnemyPresentationTransitions(states, 2000);

    expect(result.changed).toBe(true);
    expect(states.get("enemy-a")).toEqual({ state: "dead" });
  });

  it("keeps stale dead enemies dead across render reconciliation", () => {
    const states: EnemyPresentationStateMap = new Map([["enemy-a", { state: "dead" }]]);

    const result = reconcileEnemyPresentationStates(states, [enemy("enemy-a", "dead", 0)], 3000, false);

    expect(result.changed).toBe(false);
    expect(states.get("enemy-a")).toEqual({ state: "dead" });
  });

  it("resets presentation state when a new combat has alive enemies", () => {
    const states: EnemyPresentationStateMap = new Map([["old-enemy", { state: "dead" }]]);

    reconcileEnemyPresentationStates(states, [enemy("new-enemy", "alive", 8)], 4000, false);

    expect(Array.from(states.entries())).toEqual([["new-enemy", { state: "alive" }]]);
  });

  it("uses fast death duration in quick mode", () => {
    const states: EnemyPresentationStateMap = new Map([["enemy-a", { state: "alive" }]]);

    reconcileEnemyPresentationStates(states, [enemy("enemy-a", "dead", 0)], 1000, true);

    expect(states.get("enemy-a")).toEqual({ state: "dying", startedAt: 1000, dueAt: 1050 });
  });
});
