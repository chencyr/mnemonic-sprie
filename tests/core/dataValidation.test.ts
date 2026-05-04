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

import type { CardDefinition, EnemyDefinition, GameData } from "../../src/core";

describe("core type exports", () => {
  it("exports card, enemy, and game data contracts", () => {
    const card: CardDefinition = {
      id: "strike",
      name: "Strike",
      cost: 1,
      type: "attack",
      rarity: "basic",
      target: "singleEnemy",
      description: "Deal 6 damage.",
      effectId: "deal_damage_6",
      tags: ["starter"],
      mutationKeys: ["bloodthirst", "desperation"],
      assets: { cardArt: "cards/strike.png" }
    };

    const enemy: EnemyDefinition = {
      id: "sticker_punk",
      name: "Sticker Punk",
      kind: "normal",
      maxHp: 30,
      intents: [{ id: "poke", type: "attack", amount: 6, weight: 1 }],
      assets: { sprite: "enemies/sticker_punk.png" }
    };

    const data: Pick<GameData, "cards" | "enemies"> = {
      cards: [card],
      enemies: [enemy]
    };

    expect(data.cards[0].id).toBe("strike");
    expect(data.enemies[0].kind).toBe("normal");
  });
});

import { validateGameData } from "../../src/core/data/validate";

describe("validateGameData", () => {
  it("rejects duplicate ids inside a table", () => {
    const data = loadGameData();
    const duplicated = {
      ...data,
      cards: [data.cards[0], data.cards[0]]
    };

    expect(() => validateGameData(duplicated)).toThrow("Duplicate card id: strike");
  });

  it("rejects card effect ids missing from the known MVP effect id list", () => {
    const data = loadGameData();
    const invalid = {
      ...data,
      cards: [{ ...data.cards[0], effectId: "missing_effect" }]
    };

    expect(() => validateGameData(invalid)).toThrow("Unknown card effect id: missing_effect");
  });
});
