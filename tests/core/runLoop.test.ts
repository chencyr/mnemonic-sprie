import { describe, expect, it } from "vitest";
import { autoWinCombat, chooseCardReward, chooseEventOption, createRun, loadGameData, restHeal, selectMapNode, skipCardReward, startRun } from "../../src/core";

describe("run loop", () => {
  it("creates seeker run with 12-floor map and starting state", () => {
    const engine = createRun(loadGameData(), { seed: 11 });
    startRun(engine);

    expect(engine.run.deck).toHaveLength(11);
    expect(engine.run.relics).toContain("broken_notes");
    expect(engine.run.playerHp).toBe(72);
    expect(engine.run.gold).toBe(99);
    expect(engine.run.map.some((node) => node.floor === 12 && node.type === "boss")).toBe(true);
    expect(engine.run.reachableNodeIds).toHaveLength(1);
  });

  it("enters combat, produces rewards, and advances map", () => {
    const engine = createRun(loadGameData(), { seed: 12, quick: true });
    startRun(engine);
    selectMapNode(engine, engine.run.reachableNodeIds[0]);
    expect(engine.run.mode).toBe("combat");

    autoWinCombat(engine);
    expect(engine.run.mode).toBe("reward");
    expect(engine.run.reward?.cards).toHaveLength(3);

    chooseCardReward(engine, engine.run.reward!.cards[0].id);
    expect(engine.run.mode).toBe("map");
    expect(engine.run.deck.length).toBe(12);
    expect(engine.run.reachableNodeIds.length).toBeGreaterThan(0);
  });

  it("handles rest, event contracts, and skip rewards", () => {
    const engine = createRun(loadGameData(), { seed: 13, quick: true });
    startRun(engine);
    engine.run.playerHp = 40;
    const rest = engine.run.map.find((node) => node.type === "rest")!;
    engine.run.reachableNodeIds = [rest.id];
    selectMapNode(engine, rest.id);
    restHeal(engine);
    expect(engine.run.playerHp).toBeGreaterThan(40);

    const event = engine.run.map.find((node) => node.type === "event")!;
    engine.run.reachableNodeIds = [event.id];
    selectMapNode(engine, event.id);
    chooseEventOption(engine, engine.run.activeEvent!.options[0].id);
    expect(engine.run.mode).toBe("map");
    expect(engine.run.activeContracts.length).toBeGreaterThanOrEqual(0);

    const combat = engine.run.map.find((node) => node.type === "normalCombat" && node.floor > event.floor)!;
    engine.run.reachableNodeIds = [combat.id];
    selectMapNode(engine, combat.id);
    autoWinCombat(engine);
    const gold = engine.run.gold;
    skipCardReward(engine);
    expect(engine.run.gold).toBeGreaterThan(gold);
  });
});
