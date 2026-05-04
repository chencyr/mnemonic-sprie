import { describe, expect, it } from "vitest";
import { loadGameData } from "../../src/core/data/loadGameData";

describe("game data validation", () => {
  it("loads all bundled MVP data tables", () => {
    const data = loadGameData();

    expect(data.cards).toHaveLength(15);
    expect(data.enemies.filter((enemy) => enemy.kind === "normal")).toHaveLength(5);
    expect(data.enemies.filter((enemy) => enemy.kind === "elite")).toHaveLength(1);
    expect(data.enemies.filter((enemy) => enemy.kind === "boss")).toHaveLength(1);
    expect(data.relics).toHaveLength(5);
    expect(data.contracts).toHaveLength(4);
    expect(data.events).toHaveLength(4);
    expect(data.mapRules.floorCount).toBe(12);
  });
});
