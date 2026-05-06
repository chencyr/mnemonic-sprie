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

  it("resolves map node icon texture keys from data", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getNodeIcon("normalCombat")).toEqual({
      key: "ui:nodeNormalCombat",
      path: "/assets/ui/nodes/normal-combat.png"
    });
    expect(registry.getNodeIcon("boss")).toEqual({
      key: "ui:nodeBoss",
      path: "/assets/ui/nodes/boss.png"
    });
  });

  it("resolves intent icon texture keys from data", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getIntentIcon("attack")).toEqual({
      key: "ui:intentAttack",
      path: "/assets/ui/intents/attack.png"
    });
    expect(registry.getIntentIcon("mixed")).toEqual({
      key: "ui:intentAttack",
      path: "/assets/ui/intents/attack.png"
    });
  });

  it("resolves contract and memory sticker texture keys", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getContractIcon("blood_contract")).toEqual({
      key: "contract:blood_contract:icon",
      path: "/assets/ui/contracts/blood_contract.png"
    });
    expect(registry.getMemorySticker("witness")).toEqual({
      key: "sticker:witness",
      path: "/assets/stickers/witness.png"
    });
  });

  it("resolves audio entries through the registry", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getAudio("bgm")).toEqual({
      key: "audio:bgm",
      path: "/assets/audio/bgm/main-loop.ogg"
    });
    expect(registry.getAudio("combatBgm")).toEqual({
      key: "audio:combatBgm",
      path: "/assets/audio/bgm/combat-loop.ogg"
    });
    expect(registry.getAudio("cardDragStart")).toEqual({
      key: "audio:cardDragStart",
      path: "/assets/audio/sfx/card-played.ogg"
    });
    expect(registry.getAudio("cardDropCancel")).toEqual({
      key: "audio:cardDropCancel",
      path: "/assets/audio/sfx/failure.ogg"
    });
    expect(registry.getAudio("autoEndTurn")).toEqual({
      key: "audio:autoEndTurn",
      path: "/assets/audio/sfx/mutation.ogg"
    });
  });

  it("preloads combat background music from the asset data", () => {
    const registry = createAssetRegistry(loadGameData());
    const entries = registry.listPreloadEntries();

    expect(entries).toContainEqual({
      key: "audio:combatBgm",
      path: "/assets/audio/bgm/combat-loop.ogg"
    });
  });

  it("resolves combat UI assets through typed lookup", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getCombatUiAsset("battleBg")).toEqual({
      key: "ui:combatBattleBg",
      path: "/assets/ui/combat/battle-bg.png"
    });
    expect(registry.getCombatUiAsset("turnDevice")).toEqual({
      key: "ui:combatTurnDevice",
      path: "/assets/ui/combat/turn-device.png"
    });
    expect(registry.getCombatUiAsset("endTurnButtonPlate")).toEqual({
      key: "ui:combatEndTurnButtonPlate",
      path: "/assets/ui/combat/end-turn-button-plate.png"
    });
    expect(registry.getCombatUiAsset("endTurnLabel")).toEqual({
      key: "ui:combatEndTurnLabel",
      path: "/assets/ui/combat/end-turn-label.png"
    });
    expect(registry.getCombatUiAsset("enemyTurnLabel")).toEqual({
      key: "ui:combatEnemyTurnLabel",
      path: "/assets/ui/combat/enemy-turn-label.png"
    });
    expect(registry.getCombatUiAsset("turnEnergyFrame")).toEqual({
      key: "ui:combatTurnEnergyFrame",
      path: "/assets/ui/combat/turn-energy-frame.png"
    });
    expect(registry.getCombatUiAsset("energyLightningIcon")).toEqual({
      key: "ui:combatEnergyLightningIcon",
      path: "/assets/ui/combat/energy-lightning-icon.png"
    });
  });

  it("preloads combat UI assets from asset data", () => {
    const registry = createAssetRegistry(loadGameData());
    const entries = registry.listPreloadEntries();

    expect(entries).toContainEqual({
      key: "ui:combatBattleBg",
      path: "/assets/ui/combat/battle-bg.png"
    });
    expect(entries).toContainEqual({
      key: "ui:combatHandTray",
      path: "/assets/ui/combat/hand-tray.png"
    });
    expect(entries).toContainEqual({
      key: "ui:combatEndTurnButtonPlate",
      path: "/assets/ui/combat/end-turn-button-plate.png"
    });
    expect(entries).toContainEqual({
      key: "ui:combatEndTurnLabel",
      path: "/assets/ui/combat/end-turn-label.png"
    });
    expect(entries).toContainEqual({
      key: "ui:combatEnemyTurnLabel",
      path: "/assets/ui/combat/enemy-turn-label.png"
    });
    expect(entries).toContainEqual({
      key: "ui:combatTurnEnergyFrame",
      path: "/assets/ui/combat/turn-energy-frame.png"
    });
    expect(entries).toContainEqual({
      key: "ui:combatEnergyLightningIcon",
      path: "/assets/ui/combat/energy-lightning-icon.png"
    });
  });
});
