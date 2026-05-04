export type CardType = "attack" | "defense" | "skill" | "status" | "curse";
export type CardRarity = "basic" | "common" | "uncommon" | "rare" | "curse";
export type TargetType = "singleEnemy" | "allEnemies" | "self" | "none" | "handCard";
export type MemoryType = "bloodthirst" | "desperation" | "grudge" | "obsession" | "witness";
export type EnemyKind = "normal" | "elite" | "boss";
export type NodeType = "normalCombat" | "eliteCombat" | "event" | "rest" | "shop" | "boss";
export type RelicTrigger = "combatStart" | "cardPlayed" | "memoryGained" | "shopOpened" | "restSite" | "combatEnd";
export type ContractTrigger = "combatStart" | "shopOpened" | "bossStart" | "immediate";

export type AssetSlots = Record<string, string>;

export interface CardDefinition {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: CardRarity;
  target: TargetType;
  description: string;
  effectId: string;
  tags: string[];
  mutationKeys: MemoryType[];
  assets: AssetSlots;
}

export interface EnemyIntentDefinition {
  id: string;
  type: "attack" | "block" | "debuff" | "mixed";
  amount?: number;
  status?: string;
  weight: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  kind: EnemyKind;
  maxHp: number;
  intents: EnemyIntentDefinition[];
  assets: AssetSlots;
}

export interface RelicDefinition {
  id: string;
  name: string;
  rarity: "starter" | "common" | "uncommon" | "rare";
  description: string;
  trigger: RelicTrigger;
  assets: AssetSlots;
}

export interface ContractDefinition {
  id: string;
  name: string;
  benefit: string;
  cost: string;
  trigger: ContractTrigger;
  remainingUses: number;
  assets: AssetSlots;
}

export interface EventOptionDefinition {
  id: string;
  label: string;
  description: string;
  contractId?: string;
  effectId: string;
}

export interface EventDefinition {
  id: string;
  name: string;
  body: string;
  options: EventOptionDefinition[];
  assets: AssetSlots;
}

export interface MapRules {
  floorCount: number;
  minNodesPerMiddleFloor: number;
  maxNodesPerMiddleFloor: number;
  bossFloor: number;
  firstFloorNodeType: NodeType;
  requiredRestFloorMin: number;
  requiredRestFloorMax: number;
  lateSpecialFloorMin: number;
  lateSpecialFloorMax: number;
  maxConsecutiveNonCombat: number;
}

export interface AssetDefaults {
  placeholders: Record<string, string>;
  ui: Record<string, string>;
  audio: Record<string, string>;
}

export interface GameData {
  cards: CardDefinition[];
  enemies: EnemyDefinition[];
  relics: RelicDefinition[];
  contracts: ContractDefinition[];
  events: EventDefinition[];
  mapRules: MapRules;
  assets: AssetDefaults;
}
