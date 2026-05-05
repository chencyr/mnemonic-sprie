import { describe, expect, it } from "vitest";
import type { CardInstance, CombatState, EnemyInstance } from "../../src/core";
import { createRun, loadGameData, selectMapNode, startRun } from "../../src/core";
import { canAnyHandCardPlay, findAutoEnemyTarget, resolveDraggedCardPlay } from "../../src/phaser/input/cardPlayRules";

const data = loadGameData();

function combatFixture(): CombatState {
  const engine = createRun(data, { seed: 20260505, quick: true });
  startRun(engine);
  selectMapNode(engine, engine.run.reachableNodeIds[0]);
  if (!engine.run.currentCombat) throw new Error("fixture did not enter combat");
  return engine.run.currentCombat;
}

function enemy(id: string, hp: number, state: EnemyInstance["state"] = "alive"): EnemyInstance {
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

describe("card play drag rules", () => {
  it("auto-targets the only living enemy", () => {
    expect(findAutoEnemyTarget([enemy("enemy-a", 8)])).toBe("enemy-a");
  });

  it("auto-targets the lowest HP living enemy and breaks ties by order", () => {
    expect(findAutoEnemyTarget([enemy("enemy-a", 9), enemy("enemy-b", 3), enemy("enemy-c", 3)])).toBe("enemy-b");
  });

  it("ignores defeated enemies when auto-targeting", () => {
    expect(findAutoEnemyTarget([enemy("dead", 0), enemy("alive", 7)])).toBe("alive");
  });

  it("ignores dead-state enemies even if hp is stale", () => {
    expect(findAutoEnemyTarget([enemy("dead", 1, "dead"), enemy("alive", 7)])).toBe("alive");
  });

  it("resolves a single-target attack dropped on battlefield to auto target", () => {
    const combat = combatFixture();
    combat.enemies = [enemy("enemy-a", 8), enemy("enemy-b", 2)];
    combat.hand = ["strike-1"];
    combat.cards = [card("strike-1", "strike")];

    expect(resolveDraggedCardPlay(data, combat, "strike-1", { zone: "battlefield" })).toEqual({
      ok: true,
      targetEnemyId: "enemy-b"
    });
  });

  it("cancels a card dropped back to hand without consuming resources", () => {
    const combat = combatFixture();
    combat.hand = ["strike-1"];
    combat.cards = [card("strike-1", "strike")];

    expect(resolveDraggedCardPlay(data, combat, "strike-1", { zone: "hand" })).toEqual({
      ok: false,
      reason: "拖回手牌，取消出牌。"
    });
  });

  it("blocks cards that cost more than current energy", () => {
    const combat = combatFixture();
    combat.player.energy = 0;
    combat.hand = ["strike-1"];
    combat.cards = [card("strike-1", "strike")];

    expect(resolveDraggedCardPlay(data, combat, "strike-1", { zone: "battlefield" })).toEqual({
      ok: false,
      reason: "能量不足。"
    });
  });

  it("requires another hand card for handCard targets", () => {
    const combat = combatFixture();
    combat.hand = ["recall-1"];
    combat.cards = [card("recall-1", "recall")];

    expect(resolveDraggedCardPlay(data, combat, "recall-1", { zone: "battlefield" })).toEqual({
      ok: false,
      reason: "沒有可指定的手牌。"
    });
  });

  it("detects whether any hand card can currently be played", () => {
    const combat = combatFixture();
    combat.player.energy = 0;
    combat.hand = ["strike-1"];
    combat.cards = [card("strike-1", "strike")];
    expect(canAnyHandCardPlay(data, combat)).toBe(false);

    combat.hand = ["recall-1", "guard-1"];
    combat.cards = [card("recall-1", "recall"), card("guard-1", "guard")];
    expect(canAnyHandCardPlay(data, combat)).toBe(true);
  });
});
