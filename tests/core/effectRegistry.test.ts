import { describe, expect, it } from "vitest";
import { createEffectRegistry, loadGameData, registerMvpEffectPlaceholders } from "../../src/core";

describe("effect registry", () => {
  it("registers every MVP card effect id", () => {
    const registry = createEffectRegistry();
    registerMvpEffectPlaceholders(registry);

    const data = loadGameData();
    for (const card of data.cards) {
      expect(registry.has(card.effectId)).toBe(true);
    }
  });

  it("rejects duplicate effect ids", () => {
    const registry = createEffectRegistry();
    registry.register("deal_damage_6", () => ({ events: [] }));

    expect(() => registry.register("deal_damage_6", () => ({ events: [] }))).toThrow("Effect already registered: deal_damage_6");
  });

  it("throws when resolving an unknown effect", () => {
    const registry = createEffectRegistry();

    expect(() => registry.resolve("missing")).toThrow("Unknown effect id: missing");
  });
});
