import type { ContractDefinition, GameData, MemoryType, NodeType } from "../types";

export interface AssetEntry {
  key: string;
  path: string;
}

export type IntentIconType = "attack" | "block" | "debuff" | "mixed";
export type AudioAssetKey = keyof GameData["assets"]["audio"];
export type CombatUiAssetKey =
  | "battleBg"
  | "playerPanel"
  | "playerStatusBase"
  | "playerStatusHpFillSlot"
  | "playerStatusEnergyValueSlot"
  | "playerStatusBlockValueSlot"
  | "topResourceFrame"
  | "turnDevice"
  | "tickerPanel"
  | "enemyPlatform"
  | "targetRing"
  | "handTray"
  | "dropZone";

export interface AssetRegistry {
  getCardArt(cardId: string): AssetEntry;
  getEnemySprite(enemyId: string): AssetEntry;
  getRelicIcon(relicId: string): AssetEntry;
  getEventImage(eventId: string): AssetEntry;
  getNodeIcon(nodeType: NodeType): AssetEntry;
  getIntentIcon(intentType: IntentIconType): AssetEntry;
  getCombatUiAsset(assetKey: CombatUiAssetKey): AssetEntry;
  getContractIcon(contractId: string): AssetEntry;
  getMemorySticker(memoryType: MemoryType | "empty"): AssetEntry;
  getAudio(audioKey: AudioAssetKey): AssetEntry;
  getPlaceholder(slot: string): AssetEntry;
  listPreloadEntries(): AssetEntry[];
}

const nodeIconKeys: Record<NodeType, keyof GameData["assets"]["ui"]> = {
  normalCombat: "nodeNormalCombat",
  eliteCombat: "nodeEliteCombat",
  event: "nodeEvent",
  rest: "nodeRest",
  shop: "nodeShop",
  boss: "nodeBoss"
};

const intentIconKeys: Record<IntentIconType, keyof GameData["assets"]["ui"]> = {
  attack: "intentAttack",
  block: "intentBlock",
  debuff: "intentDebuff",
  mixed: "intentAttack"
};

const combatUiAssetKeys: Record<CombatUiAssetKey, keyof GameData["assets"]["ui"]> = {
  battleBg: "combatBattleBg",
  playerPanel: "combatPlayerPanel",
  playerStatusBase: "combatPlayerStatusBase",
  playerStatusHpFillSlot: "combatPlayerStatusHpFillSlot",
  playerStatusEnergyValueSlot: "combatPlayerStatusEnergyValueSlot",
  playerStatusBlockValueSlot: "combatPlayerStatusBlockValueSlot",
  topResourceFrame: "combatTopResourceFrame",
  turnDevice: "combatTurnDevice",
  tickerPanel: "combatTickerPanel",
  enemyPlatform: "combatEnemyPlatform",
  targetRing: "combatTargetRing",
  handTray: "combatHandTray",
  dropZone: "combatDropZone"
};

const memoryStickerPaths: Record<MemoryType | "empty", string> = {
  bloodthirst: "stickers/bloodthirst.png",
  desperation: "stickers/desperation.png",
  grudge: "stickers/grudge.png",
  obsession: "stickers/obsession.png",
  witness: "stickers/witness.png",
  empty: "stickers/memory-empty.png"
};

function assetPath(path: string): string {
  return `/assets/${path}`;
}

function uniqueEntries(entries: AssetEntry[]): AssetEntry[] {
  const byKey = new Map<string, AssetEntry>();
  for (const entry of entries) {
    byKey.set(entry.key, entry);
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function createAssetRegistry(data: GameData): AssetRegistry {
  const cards = new Map(data.cards.map((card) => [card.id, card]));
  const enemies = new Map(data.enemies.map((enemy) => [enemy.id, enemy]));
  const relics = new Map(data.relics.map((relic) => [relic.id, relic]));
  const events = new Map(data.events.map((event) => [event.id, event]));
  const contracts = new Map(data.contracts.map((contract) => [contract.id, contract]));

  function placeholder(slot: string): AssetEntry {
    const path = data.assets.placeholders[slot] ?? data.assets.placeholders.uiIcon;
    return { key: `placeholder:${slot}`, path: assetPath(path) };
  }

  function uiEntry(id: keyof GameData["assets"]["ui"]): AssetEntry {
    const path = data.assets.ui[id] ?? data.assets.placeholders.uiIcon;
    return { key: `ui:${String(id)}`, path: assetPath(path) };
  }

  function contractEntry(contract: ContractDefinition | undefined, contractId: string): AssetEntry {
    return contract?.assets.icon ? { key: `contract:${contractId}:icon`, path: assetPath(contract.assets.icon) } : placeholder("uiIcon");
  }

  return {
    getCardArt(cardId) {
      const card = cards.get(cardId);
      return card?.assets.cardArt ? { key: `card:${cardId}:art`, path: assetPath(card.assets.cardArt) } : placeholder("cardArt");
    },
    getEnemySprite(enemyId) {
      const enemy = enemies.get(enemyId);
      return enemy?.assets.sprite ? { key: `enemy:${enemyId}:sprite`, path: assetPath(enemy.assets.sprite) } : placeholder("enemySprite");
    },
    getRelicIcon(relicId) {
      const relic = relics.get(relicId);
      return relic?.assets.icon ? { key: `relic:${relicId}:icon`, path: assetPath(relic.assets.icon) } : placeholder("relicIcon");
    },
    getEventImage(eventId) {
      const event = events.get(eventId);
      return event?.assets.eventImage ? { key: `event:${eventId}:image`, path: assetPath(event.assets.eventImage) } : placeholder("eventImage");
    },
    getNodeIcon(nodeType) {
      return uiEntry(nodeIconKeys[nodeType]);
    },
    getIntentIcon(intentType) {
      return uiEntry(intentIconKeys[intentType]);
    },
    getCombatUiAsset(assetKey) {
      return uiEntry(combatUiAssetKeys[assetKey]);
    },
    getContractIcon(contractId) {
      return contractEntry(contracts.get(contractId), contractId);
    },
    getMemorySticker(memoryType) {
      const path = memoryStickerPaths[memoryType];
      return path ? { key: `sticker:${memoryType}`, path: assetPath(path) } : placeholder("memorySticker");
    },
    getAudio(audioKey) {
      const path = data.assets.audio[audioKey];
      if (!path) {
        throw new Error(`Unknown audio asset key: ${String(audioKey)}`);
      }
      return { key: `audio:${String(audioKey)}`, path: assetPath(path) };
    },
    getPlaceholder(slot) {
      return placeholder(slot);
    },
    listPreloadEntries() {
      const entries: AssetEntry[] = [
        ...data.cards.map((card) => this.getCardArt(card.id)),
        ...data.enemies.map((enemy) => this.getEnemySprite(enemy.id)),
        ...data.relics.map((relic) => this.getRelicIcon(relic.id)),
        ...data.contracts.map((contract) => this.getContractIcon(contract.id)),
        ...data.events.map((event) => this.getEventImage(event.id)),
        ...(["empty", "bloodthirst", "desperation", "grudge", "obsession", "witness"] as const).map((memoryType) =>
          this.getMemorySticker(memoryType)
        ),
        ...Object.keys(data.assets.placeholders).map((slot) => placeholder(slot)),
        ...Object.entries(data.assets.ui).map(([id, path]) => ({ key: `ui:${id}`, path: assetPath(path) })),
        ...Object.entries(data.assets.audio).map(([id, path]) => ({ key: `audio:${id}`, path: assetPath(path) }))
      ];
      return uniqueEntries(entries);
    }
  };
}
