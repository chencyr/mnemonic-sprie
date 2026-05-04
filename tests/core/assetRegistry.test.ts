import { describe, expect, it } from "vitest";
import { createAssetRegistry, loadGameData } from "../../src/core";

describe("asset registry", () => {
  it("resolves card art texture keys from data", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getCardArt("strike")).toEqual({
      key: "card:strike:art",
      path: "/assets/cards/strike.png"
    });
  });

  it("resolves enemy sprite texture keys from data", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getEnemySprite("tower_heart")).toEqual({
      key: "enemy:tower_heart:sprite",
      path: "/assets/enemies/tower_heart.png"
    });
  });

  it("returns placeholder entries for unknown content ids", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getCardArt("missing")).toEqual({
      key: "placeholder:cardArt",
      path: "/assets/ui/placeholders/card-art.png"
    });
  });

  it("lists preloadable asset entries without duplicate keys", () => {
    const registry = createAssetRegistry(loadGameData());
    const entries = registry.listPreloadEntries();
    const keys = entries.map((entry) => entry.key);

    expect(keys).toContain("card:strike:art");
    expect(keys).toContain("enemy:tower_heart:sprite");
    expect(new Set(keys).size).toBe(keys.length);
  });
});
