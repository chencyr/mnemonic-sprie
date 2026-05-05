import type { CardDefinition, GameData, MemoryType } from "../types";
import { isEnemyAlive, syncEnemyDeathState } from "./enemyState";
import type { CombatState, EnemyInstance, StatusKey } from "./types";

export interface EffectContext {
  combat: CombatState;
  data: GameData;
  card: CardDefinition;
  cardInstanceId: string;
  targetEnemy?: EnemyInstance;
  targetCardId?: string;
}

export interface EffectOutcome {
  damageDealt: number;
  killedEnemyIds: string[];
  memoryProgress?: MemoryType;
  exhaustPlayedCard?: boolean;
}

export type CombatEffectHandler = (context: EffectContext) => EffectOutcome;

export function resolveCombatEffect(effectId: string): CombatEffectHandler {
  const handler = handlers[effectId];
  if (!handler) throw new Error(`No combat effect handler for: ${effectId}`);
  return handler;
}

export function combatEffectIds(): string[] {
  return Object.keys(handlers).sort();
}

const handlers: Record<string, CombatEffectHandler> = {
  deal_damage_6: (context) => damageSingle(context, 6),
  deal_damage_5_apply_vulnerable_1: (context) => {
    const outcome = damageSingle(context, 5);
    addStatus(context.targetEnemy, "vulnerable", 1);
    return outcome;
  },
  deal_all_damage_4: (context) => damageAll(context, 4),
  countercut_damage: (context) => damageSingle(context, context.combat.player.block > 0 ? 9 : 5),
  memory_blade_damage: (context) => ({
    ...damageSingle(context, 10),
    memoryProgress: context.targetEnemy && isEliteOrBoss(context.data, context.targetEnemy) ? "witness" : undefined
  }),
  terminus_damage: (context) => {
    const target = requireEnemy(context);
    return damageSingle(context, target.hp <= Math.ceil(target.maxHp * 0.4) ? 18 : 12);
  },
  gain_block_5: (context) => {
    gainBlock(context, 5);
    return emptyOutcome();
  },
  gain_block_4_apply_weak_1: (context) => {
    gainBlock(context, 4);
    addStatus(context.targetEnemy, "weak", 1);
    return emptyOutcome();
  },
  stacked_defense_block: (context) => {
    const playedDefense = context.combat.playedThisTurn.some((instanceId) => {
      const instance = context.combat.cards.find((card) => card.instanceId === instanceId);
      const definition = instance ? context.data.cards.find((card) => card.id === instance.cardId) : undefined;
      return definition?.type === "defense";
    });
    gainBlock(context, playedDefense ? 10 : 6);
    return emptyOutcome();
  },
  reflect_shield_block_spike: (context) => {
    gainBlock(context, 8);
    context.combat.player.statuses.spikes = (context.combat.player.statuses.spikes ?? 0) + 2;
    return emptyOutcome();
  },
  preserve_card: (context) => {
    const target = context.combat.cards.find((card) => card.instanceId === context.targetCardId);
    if (!target || !context.combat.hand.includes(target.instanceId)) {
      throw new Error("保存需要選擇一張手牌。");
    }
    target.retained = true;
    context.combat.events.push({ type: "CARD_RETAINED", message: "一張牌被保存到下回合。", payload: { card: target.instanceId } });
    return { ...emptyOutcome(), memoryProgress: "obsession" };
  },
  recall_draw_memory: (context) => {
    const target = context.combat.cards.find((card) => card.instanceId === context.targetCardId);
    if (target && context.combat.hand.includes(target.instanceId)) {
      target.memory.obsession += 1;
      context.combat.events.push({ type: "MEMORY_PROGRESS_GAINED", message: "回想讓一張手牌獲得記憶進度。", payload: { card: target.instanceId, memoryType: "obsession" } });
    }
    return { ...emptyOutcome(), memoryProgress: "obsession" };
  },
  organize_hand_discard_draw: (context) => {
    const target = context.combat.cards.find((card) => card.instanceId === context.targetCardId);
    if (target && context.combat.hand.includes(target.instanceId)) {
      context.combat.hand = context.combat.hand.filter((id) => id !== target.instanceId);
      context.combat.discardPile.push(target.instanceId);
      target.discardedThisCombat += 1;
      target.memory.grudge += 1;
      context.combat.events.push({ type: "CARD_DISCARDED", message: "整理手牌棄掉一張牌。", payload: { card: target.instanceId } });
    }
    return { ...emptyOutcome(), memoryProgress: "grudge" };
  },
  burning_notes_exhaust_damage: (context) => {
    const target = context.combat.cards.find((card) => card.instanceId === context.targetCardId);
    if (target && context.combat.hand.includes(target.instanceId)) {
      context.combat.hand = context.combat.hand.filter((id) => id !== target.instanceId);
      context.combat.exhaustPile.push(target.instanceId);
      target.exhausted = true;
    }
    return damageSingle(context, 8);
  },
  rewrite_reduce_cost: (context) => {
    const target = context.combat.cards.find((card) => card.instanceId === context.targetCardId);
    if (!target || !context.combat.hand.includes(target.instanceId)) {
      throw new Error("複寫需要選擇一張手牌。");
    }
    target.combatCostDelta -= 1;
    context.combat.events.push({ type: "CARD_COST_REDUCED", message: "一張手牌本場戰鬥費用降低。", payload: { card: target.instanceId } });
    return { ...emptyOutcome(), memoryProgress: "obsession" };
  }
};

function emptyOutcome(): EffectOutcome {
  return { damageDealt: 0, killedEnemyIds: [] };
}

function gainBlock(context: EffectContext, amount: number) {
  const instance = context.combat.cards.find((card) => card.instanceId === context.cardInstanceId);
  const bonus = instance?.mutation?.blockBonus ?? 0;
  const frailPenalty = context.combat.player.statuses.frail ? 0.75 : 1;
  const block = Math.max(0, Math.floor((amount + bonus) * frailPenalty));
  context.combat.player.block += block;
  context.combat.events.push({ type: "BLOCK_GAINED", message: `獲得 ${block} 格擋。`, payload: { block } });
}

function damageSingle(context: EffectContext, base: number): EffectOutcome {
  const enemy = requireEnemy(context);
  return damageEnemies(context, [enemy], base);
}

function damageAll(context: EffectContext, base: number): EffectOutcome {
  return damageEnemies(context, context.combat.enemies.filter(isEnemyAlive), base);
}

function damageEnemies(context: EffectContext, enemies: EnemyInstance[], base: number): EffectOutcome {
  const instance = context.combat.cards.find((card) => card.instanceId === context.cardInstanceId);
  let amount = base + (instance?.mutation?.damageBonus ?? 0);
  if (instance?.mutation?.eliteBossDamageBonus && context.targetEnemy && isEliteOrBoss(context.data, context.targetEnemy)) {
    amount += instance.mutation.eliteBossDamageBonus;
  }
  if (context.combat.player.statuses.weak) amount = Math.floor(amount * 0.75);
  const killedEnemyIds: string[] = [];
  let total = 0;
  for (const enemy of enemies) {
    let finalAmount = amount;
    if (enemy.statuses.vulnerable) finalAmount = Math.ceil(finalAmount * 1.5);
    if (context.combat.bossCountermeasure === "zero_cost_ward" && context.card.cost === 0) {
      finalAmount = Math.ceil(finalAmount / 2);
    }
    const blocked = Math.min(enemy.block, finalAmount);
    enemy.block -= blocked;
    const hpDamage = finalAmount - blocked;
    enemy.hp = Math.max(0, enemy.hp - hpDamage);
    total += hpDamage;
    context.combat.events.push({ type: "DAMAGE_DEALT", message: `造成 ${hpDamage} 傷害。`, payload: { enemy: enemy.instanceId, damage: hpDamage } });
    if (syncEnemyDeathState(context.combat, enemy)) killedEnemyIds.push(enemy.instanceId);
  }
  return { damageDealt: total, killedEnemyIds };
}

function requireEnemy(context: EffectContext): EnemyInstance {
  if (!context.targetEnemy || !isEnemyAlive(context.targetEnemy)) {
    throw new Error("這張牌需要一個存活敵人目標。");
  }
  return context.targetEnemy;
}

function addStatus(target: EnemyInstance | undefined, status: StatusKey, amount: number) {
  if (!target) return;
  target.statuses[status] = (target.statuses[status] ?? 0) + amount;
}

function isEliteOrBoss(data: GameData, enemy: EnemyInstance): boolean {
  const definition = data.enemies.find((item) => item.id === enemy.enemyId);
  return definition?.kind === "elite" || definition?.kind === "boss";
}
