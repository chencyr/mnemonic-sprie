import type { CardDefinition, ContractDefinition, EnemyDefinition, EventDefinition, GameData, RelicDefinition } from "../types";

const CARD_EFFECT_IDS = new Set([
  "deal_damage_6",
  "deal_damage_5_apply_vulnerable_1",
  "deal_all_damage_4",
  "countercut_damage",
  "memory_blade_damage",
  "terminus_damage",
  "gain_block_5",
  "gain_block_4_apply_weak_1",
  "stacked_defense_block",
  "reflect_shield_block_spike",
  "preserve_card",
  "recall_draw_memory",
  "organize_hand_discard_draw",
  "burning_notes_exhaust_damage",
  "rewrite_reduce_cost"
]);

function assertUnique<T extends { id: string }>(label: string, rows: T[]) {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) {
      throw new Error(`Duplicate ${label} id: ${row.id}`);
    }
    seen.add(row.id);
  }
}

function assertCards(cards: CardDefinition[]) {
  for (const card of cards) {
    if (!CARD_EFFECT_IDS.has(card.effectId)) {
      throw new Error(`Unknown card effect id: ${card.effectId}`);
    }
    if (card.cost < 0) {
      throw new Error(`Card cost cannot be negative: ${card.id}`);
    }
    if (!card.assets.cardArt) {
      throw new Error(`Card missing cardArt asset: ${card.id}`);
    }
  }

  if (cards.length !== 15) {
    throw new Error(`Expected 15 cards, got ${cards.length}`);
  }
}

function assertEnemies(enemies: EnemyDefinition[]) {
  const normalCount = enemies.filter((enemy) => enemy.kind === "normal").length;
  const eliteCount = enemies.filter((enemy) => enemy.kind === "elite").length;
  const bossCount = enemies.filter((enemy) => enemy.kind === "boss").length;

  if (normalCount !== 5 || eliteCount !== 1 || bossCount !== 1) {
    throw new Error(`Expected enemies normal=5 elite=1 boss=1, got normal=${normalCount} elite=${eliteCount} boss=${bossCount}`);
  }

  for (const enemy of enemies) {
    if (enemy.maxHp <= 0) {
      throw new Error(`Enemy maxHp must be positive: ${enemy.id}`);
    }
    if (enemy.intents.length === 0) {
      throw new Error(`Enemy must have at least one intent: ${enemy.id}`);
    }
    if (!enemy.assets.sprite) {
      throw new Error(`Enemy missing sprite asset: ${enemy.id}`);
    }
  }
}

function assertRelics(relics: RelicDefinition[]) {
  if (relics.length !== 5) {
    throw new Error(`Expected 5 relics, got ${relics.length}`);
  }
}

function assertContracts(contracts: ContractDefinition[]) {
  if (contracts.length !== 4) {
    throw new Error(`Expected 4 contracts, got ${contracts.length}`);
  }
}

function assertEvents(events: EventDefinition[], contracts: ContractDefinition[]) {
  if (events.length !== 4) {
    throw new Error(`Expected 4 events, got ${events.length}`);
  }

  const contractIds = new Set(contracts.map((contract) => contract.id));
  for (const event of events) {
    if (event.options.length < 2) {
      throw new Error(`Event must have at least two options: ${event.id}`);
    }
    for (const option of event.options) {
      if (option.contractId && !contractIds.has(option.contractId)) {
        throw new Error(`Event option references unknown contract: ${option.contractId}`);
      }
    }
  }
}

export function validateGameData(data: GameData): GameData {
  assertUnique("card", data.cards);
  assertUnique("enemy", data.enemies);
  assertUnique("relic", data.relics);
  assertUnique("contract", data.contracts);
  assertUnique("event", data.events);
  assertCards(data.cards);
  assertEnemies(data.enemies);
  assertRelics(data.relics);
  assertContracts(data.contracts);
  assertEvents(data.events, data.contracts);

  if (data.mapRules.floorCount !== 12 || data.mapRules.bossFloor !== 12) {
    throw new Error("Map rules must define a 12-floor tower with Boss on floor 12");
  }

  return data;
}

export const knownCardEffectIds = CARD_EFFECT_IDS;
