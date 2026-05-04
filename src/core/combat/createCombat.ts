import { pickWeighted, shuffle, type Rng } from "../rng";
import type { EnemyDefinition, GameData } from "../types";
import type { BossCountermeasure, CardInstance, CombatDataLookup, CombatState, EnemyInstance } from "./types";

export interface CreateCombatOptions {
  floor: number;
  enemyKind: EnemyDefinition["kind"];
  playerHp: number;
  playerMaxHp: number;
  deck: readonly CardInstance[];
  enemyIds?: readonly string[];
  bossCountermeasure?: BossCountermeasure;
  quick?: boolean;
}

export function createCombatLookup(data: GameData): CombatDataLookup {
  const cards = new Map(data.cards.map((card) => [card.id, card]));
  const enemies = new Map(data.enemies.map((enemy) => [enemy.id, enemy]));
  return {
    getCard(cardId) {
      const card = cards.get(cardId);
      if (!card) throw new Error(`Unknown card id: ${cardId}`);
      return card;
    },
    getEnemy(enemyId) {
      const enemy = enemies.get(enemyId);
      if (!enemy) throw new Error(`Unknown enemy id: ${enemyId}`);
      return enemy;
    }
  };
}

export function createCombat(data: GameData, rng: Rng, options: CreateCombatOptions): CombatState {
  const lookup = createCombatLookup(data);
  const enemyDefs = options.enemyIds
    ? options.enemyIds.map((id) => lookup.getEnemy(id))
    : chooseEnemies(data, rng, options.enemyKind);
  const cards = options.deck.map((card) => ({
    ...card,
    memory: { ...card.memory },
    mutation: card.mutation ? { ...card.mutation } : undefined,
    combatCostDelta: 0,
    retained: false,
    exhausted: false
  }));
  const drawPile = shuffle(cards.map((card) => card.instanceId), rng);
  const combat: CombatState = {
    id: `combat-${options.floor}-${rng.nextInt(1_000_000)}`,
    floor: options.floor,
    enemyKind: options.enemyKind,
    phase: "player",
    turn: 1,
    player: {
      hp: options.playerHp,
      maxHp: options.playerMaxHp,
      block: 0,
      energy: 3,
      statuses: {}
    },
    cards,
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    enemies: enemyDefs.map((enemy, index): EnemyInstance => ({
      instanceId: `${enemy.id}-${index + 1}`,
      enemyId: enemy.id,
      hp: options.quick ? Math.min(enemy.maxHp, enemy.kind === "boss" ? 24 : 8) : enemy.maxHp,
      maxHp: options.quick ? Math.min(enemy.maxHp, enemy.kind === "boss" ? 24 : 8) : enemy.maxHp,
      block: 0,
      statuses: {},
      intent: pickWeighted(enemy.intents.map((intent) => ({ value: intent, weight: intent.weight })), rng)
    })),
    events: [],
    playedThisTurn: [],
    playedCounts: {},
    summary: {
      attackCards: 0,
      defenseCards: 0,
      skillCards: 0,
      zeroCostCards: 0,
      totalCards: 0,
      retainedCards: 0,
      won: false
    },
    firstMemoryGained: false,
    bossCountermeasure: options.bossCountermeasure
  };
  drawCards(combat, 5, rng);
  combat.events.push({ type: "COMBAT_STARTED", message: "戰鬥開始。", payload: { enemyKind: options.enemyKind } });
  if (options.bossCountermeasure) {
    combat.events.push({
      type: "BOSS_COUNTERMEASURE_REVEALED",
      message: bossCountermeasureLabel(options.bossCountermeasure),
      payload: { bossCountermeasure: options.bossCountermeasure }
    });
  }
  return combat;
}

export function findCard(combat: CombatState, instanceId: string): CardInstance {
  const card = combat.cards.find((item) => item.instanceId === instanceId);
  if (!card) throw new Error(`Unknown card instance: ${instanceId}`);
  return card;
}

export function findLivingEnemy(combat: CombatState, instanceId?: string): EnemyInstance {
  const living = combat.enemies.filter((enemy) => enemy.hp > 0);
  const enemy = instanceId ? living.find((item) => item.instanceId === instanceId) : living[0];
  if (!enemy) throw new Error(`No living enemy target available: ${instanceId ?? "first"}`);
  return enemy;
}

export function drawCards(combat: CombatState, count: number, rng: Rng): string[] {
  const drawn: string[] = [];
  for (let i = 0; i < count; i += 1) {
    if (combat.drawPile.length === 0) {
      if (combat.discardPile.length === 0) break;
      combat.drawPile = shuffle(combat.discardPile, rng);
      combat.discardPile = [];
    }
    const next = combat.drawPile.shift();
    if (!next) break;
    combat.hand.push(next);
    drawn.push(next);
  }
  if (drawn.length > 0) {
    combat.events.push({ type: "CARDS_DRAWN", message: `抽了 ${drawn.length} 張牌。`, payload: { cards: drawn } });
  }
  return drawn;
}

function chooseEnemies(data: GameData, rng: Rng, kind: EnemyDefinition["kind"]): EnemyDefinition[] {
  const pool = data.enemies.filter((enemy) => enemy.kind === kind);
  if (pool.length === 0) throw new Error(`No enemies for kind: ${kind}`);
  if (kind !== "normal") return [pool[rng.nextInt(pool.length)]];
  const count = rng.next() > 0.72 ? 2 : 1;
  return Array.from({ length: count }, () => pool[rng.nextInt(pool.length)]);
}

function bossCountermeasureLabel(countermeasure: BossCountermeasure): string {
  switch (countermeasure) {
    case "spikes_vs_attacks":
      return "Boss 讀出你偏好攻擊牌，獲得反傷尖刺。";
    case "guard_breaker":
      return "Boss 讀出你偏好防禦，準備破甲攻擊。";
    case "skill_tax":
      return "Boss 讀出你偏好技能，技能牌會附帶壓力。";
    case "fatigue_draw":
      return "Boss 讀出你常大量出牌，抽牌會更危險。";
    case "zero_cost_ward":
      return "Boss 讀出你偏好 0 費牌，首次 0 費傷害減半。";
    case "retention_punish":
      return "Boss 讀出你常保留手牌，回合結束會加壓。";
  }
}
