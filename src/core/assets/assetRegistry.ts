import type { GameData } from "../types";

export interface AssetEntry {
  key: string;
  path: string;
}

export interface AssetRegistry {
  getCardArt(cardId: string): AssetEntry;
  getEnemySprite(enemyId: string): AssetEntry;
  getRelicIcon(relicId: string): AssetEntry;
  getEventImage(eventId: string): AssetEntry;
  getPlaceholder(slot: string): AssetEntry;
  listPreloadEntries(): AssetEntry[];
}

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

  function placeholder(slot: string): AssetEntry {
    const path = data.assets.placeholders[slot] ?? data.assets.placeholders.uiIcon;
    return { key: `placeholder:${slot}`, path: assetPath(path) };
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
    getPlaceholder(slot) {
      return placeholder(slot);
    },
    listPreloadEntries() {
      const entries: AssetEntry[] = [
        ...data.cards.map((card) => this.getCardArt(card.id)),
        ...data.enemies.map((enemy) => this.getEnemySprite(enemy.id)),
        ...data.relics.map((relic) => this.getRelicIcon(relic.id)),
        ...data.events.map((event) => this.getEventImage(event.id)),
        ...Object.keys(data.assets.placeholders).map((slot) => placeholder(slot)),
        ...Object.entries(data.assets.ui).map(([id, path]) => ({ key: `ui:${id}`, path: assetPath(path) })),
        ...Object.entries(data.assets.audio).map(([id, path]) => ({ key: `audio:${id}`, path: assetPath(path) }))
      ];
      return uniqueEntries(entries);
    }
  };
}
