import type { CardDefinition, EventDefinition, NodeType, RelicDefinition } from "../types";
import type { CombatState, CombatSummary, CardInstance } from "../combat/types";

export type RunMode = "title" | "map" | "combat" | "reward" | "rest" | "shop" | "event" | "victory" | "defeat";

export interface MapNode {
  id: string;
  floor: number;
  type: NodeType;
  next: string[];
  x: number;
}

export interface RewardState {
  cards: CardDefinition[];
  relic?: RelicDefinition;
  gold: number;
}

export interface ShopItem {
  id: string;
  kind: "card" | "relic" | "remove";
  itemId: string;
  price: number;
  sold: boolean;
}

export interface ActiveContract {
  id: string;
  remainingUses: number;
}

export interface RunState {
  seed: number;
  mode: RunMode;
  floor: number;
  playerHp: number;
  playerMaxHp: number;
  gold: number;
  deck: CardInstance[];
  relics: string[];
  activeContracts: ActiveContract[];
  map: MapNode[];
  currentNodeId?: string;
  reachableNodeIds: string[];
  currentCombat?: CombatState;
  reward?: RewardState;
  shop?: ShopItem[];
  activeEvent?: EventDefinition;
  recentCombatSummaries: CombatSummary[];
  log: string[];
  quick: boolean;
}

export interface RunSnapshot {
  mode: RunMode;
  floor: number;
  hp: number;
  maxHp: number;
  gold: number;
  deckSize: number;
  relics: string[];
  contracts: ActiveContract[];
}
