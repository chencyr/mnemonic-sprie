import type { CardDefinition, EnemyDefinition, EnemyIntentDefinition, MemoryType } from "../types";

export type CombatPhase = "player" | "enemy" | "victory" | "defeat";
export type StatusKey = "weak" | "vulnerable" | "frail" | "spikes";
export type EnemyLifecycleState = "alive" | "dead";

export interface CardMemoryState {
  bloodthirst: number;
  desperation: number;
  grudge: number;
  obsession: number;
  witness: number;
}

export interface CardMutationState {
  memoryType: MemoryType;
  name: string;
  description: string;
  damageBonus?: number;
  blockBonus?: number;
  costDelta?: number;
  eliteBossDamageBonus?: number;
  drawOnKill?: number;
  mutatedAtFloor?: number;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  memory: CardMemoryState;
  mutation?: CardMutationState;
  combatCostDelta: number;
  retained: boolean;
  retainedStreak: number;
  usedThisCombat: number;
  discardedThisCombat: number;
  exhausted: boolean;
}

export interface PlayerCombatState {
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  statuses: Partial<Record<StatusKey, number>>;
}

export interface EnemyInstance {
  instanceId: string;
  enemyId: string;
  state: EnemyLifecycleState;
  hp: number;
  maxHp: number;
  block: number;
  statuses: Partial<Record<StatusKey, number>>;
  intent: EnemyIntentDefinition;
}

export interface CombatEvent {
  type: string;
  message: string;
  payload?: unknown;
}

export interface CombatSummary {
  attackCards: number;
  defenseCards: number;
  skillCards: number;
  zeroCostCards: number;
  totalCards: number;
  retainedCards: number;
  won: boolean;
}

export interface CombatState {
  id: string;
  floor: number;
  enemyKind: EnemyDefinition["kind"];
  phase: CombatPhase;
  turn: number;
  player: PlayerCombatState;
  cards: CardInstance[];
  drawPile: string[];
  hand: string[];
  discardPile: string[];
  exhaustPile: string[];
  enemies: EnemyInstance[];
  events: CombatEvent[];
  playedThisTurn: string[];
  playedCounts: Record<string, number>;
  summary: CombatSummary;
  firstMemoryGained: boolean;
  bossCountermeasure?: BossCountermeasure;
}

export type BossCountermeasure =
  | "spikes_vs_attacks"
  | "guard_breaker"
  | "skill_tax"
  | "fatigue_draw"
  | "zero_cost_ward"
  | "retention_punish";

export interface CombatDataLookup {
  getCard(cardId: string): CardDefinition;
  getEnemy(enemyId: string): EnemyDefinition;
}

export function emptyMemory(): CardMemoryState {
  return {
    bloodthirst: 0,
    desperation: 0,
    grudge: 0,
    obsession: 0,
    witness: 0
  };
}
