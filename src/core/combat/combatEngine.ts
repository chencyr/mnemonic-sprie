import { pickWeighted, type Rng } from "../rng";
import type { GameData } from "../types";
import { addMemoryProgress } from "../memory/memoryRules";
import { drawCards, findCard, findLivingEnemy } from "./createCombat";
import { resolveCombatEffect } from "./cardEffects";
import type { CardInstance, CombatState, EnemyInstance, StatusKey } from "./types";

export interface PlayCardOptions {
  targetEnemyId?: string;
  targetCardId?: string;
}

export function effectiveCardCost(data: GameData, card: CardInstance): number {
  const definition = data.cards.find((item) => item.id === card.cardId);
  if (!definition) throw new Error(`Unknown card id: ${card.cardId}`);
  return Math.max(0, definition.cost + card.combatCostDelta + (card.mutation?.costDelta ?? 0));
}

export function playCard(combat: CombatState, data: GameData, rng: Rng, cardInstanceId: string, options: PlayCardOptions = {}) {
  if (combat.phase !== "player") throw new Error("Cards can only be played during the player phase.");
  if (!combat.hand.includes(cardInstanceId)) throw new Error(`Card is not in hand: ${cardInstanceId}`);
  const cardInstance = findCard(combat, cardInstanceId);
  const card = data.cards.find((item) => item.id === cardInstance.cardId);
  if (!card) throw new Error(`Unknown card id: ${cardInstance.cardId}`);
  const cost = effectiveCardCost(data, cardInstance);
  if (combat.player.energy < cost) throw new Error(`Not enough energy for ${card.name}.`);
  const targetEnemy = card.target === "singleEnemy" || card.target === "allEnemies" ? findLivingEnemy(combat, options.targetEnemyId) : undefined;

  combat.player.energy -= cost;
  combat.hand = combat.hand.filter((id) => id !== cardInstanceId);
  combat.playedThisTurn.push(cardInstanceId);
  combat.playedCounts[cardInstanceId] = (combat.playedCounts[cardInstanceId] ?? 0) + 1;
  cardInstance.usedThisCombat += 1;
  combat.summary.totalCards += 1;
  if (card.type === "attack") combat.summary.attackCards += 1;
  if (card.type === "defense") combat.summary.defenseCards += 1;
  if (card.type === "skill") combat.summary.skillCards += 1;
  if (cost === 0) combat.summary.zeroCostCards += 1;

  const outcome = resolveCombatEffect(card.effectId)({ combat, data, card, cardInstanceId, targetEnemy, targetCardId: options.targetCardId });
  if (outcome.memoryProgress) addMemoryProgress(combat, cardInstance, outcome.memoryProgress);
  if (outcome.killedEnemyIds.length > 0) {
    addMemoryProgress(combat, cardInstance, "bloodthirst");
    if (cardInstance.mutation?.drawOnKill) drawCards(combat, cardInstance.mutation.drawOnKill, rng);
  }
  if (combat.player.hp <= combat.player.maxHp / 2) addMemoryProgress(combat, cardInstance, "desperation");
  if (targetEnemy && isEliteOrBoss(data, targetEnemy)) addMemoryProgress(combat, cardInstance, "witness");
  if (combat.bossCountermeasure === "spikes_vs_attacks" && card.type === "attack") damagePlayer(combat, 1);
  if (combat.bossCountermeasure === "skill_tax" && card.type === "skill") damagePlayer(combat, 1);

  if (outcome.exhaustPlayedCard || cardInstance.exhausted) {
    combat.exhaustPile.push(cardInstanceId);
  } else {
    combat.discardPile.push(cardInstanceId);
  }
  combat.events.push({ type: "CARD_PLAYED", message: `打出 ${displayCardName(card.name, cardInstance)}。`, payload: { card: cardInstanceId, cardId: card.id, cost } });
  checkCombatEnd(combat);
}

export function endPlayerTurn(combat: CombatState, data: GameData, rng: Rng) {
  if (combat.phase !== "player") throw new Error("Cannot end turn outside player phase.");
  for (const cardId of [...combat.hand]) {
    const card = findCard(combat, cardId);
    if (card.retained) {
      card.retained = false;
      card.retainedStreak += 1;
      combat.summary.retainedCards += 1;
      addMemoryProgress(combat, card, "obsession");
      continue;
    }
    card.discardedThisCombat += 1;
    addMemoryProgress(combat, card, "grudge");
    combat.discardPile.push(cardId);
  }
  combat.hand = combat.hand.filter((id) => !combat.discardPile.includes(id));
  combat.player.block = 0;
  combat.phase = "enemy";
  resolveEnemyTurn(combat, data, rng);
  if (combat.phase !== "enemy") return;
  startPlayerTurn(combat, rng);
}

export function startPlayerTurn(combat: CombatState, rng: Rng) {
  combat.phase = "player";
  combat.turn += 1;
  combat.player.energy = 3;
  combat.playedThisTurn = [];
  tickStatuses(combat.player.statuses);
  for (const enemy of combat.enemies) {
    tickStatuses(enemy.statuses);
  }
  if (combat.bossCountermeasure === "retention_punish") {
    const retained = combat.cards.filter((card) => card.retainedStreak > 0).length;
    if (retained > 0) damagePlayer(combat, Math.min(4, retained));
  }
  drawCards(combat, 5 - combat.hand.length, rng);
}

function resolveEnemyTurn(combat: CombatState, data: GameData, rng: Rng) {
  for (const enemy of combat.enemies.filter((item) => item.hp > 0)) {
    const intent = enemy.intent;
    if (intent.type === "attack" || intent.type === "mixed") {
      const weakPenalty = enemy.statuses.weak ? 0.75 : 1;
      const guardBreakerBonus = combat.bossCountermeasure === "guard_breaker" ? 3 : 0;
      damagePlayer(combat, Math.floor((intent.amount ?? 0) * weakPenalty) + guardBreakerBonus);
      if ((combat.player.statuses.spikes ?? 0) > 0) {
        enemy.hp = Math.max(0, enemy.hp - (combat.player.statuses.spikes ?? 0));
      }
    }
    if (intent.type === "block") {
      enemy.block += intent.amount ?? 0;
      combat.events.push({ type: "ENEMY_BLOCK_GAINED", message: `${enemy.instanceId} 獲得格擋。`, payload: { enemy: enemy.instanceId, block: intent.amount ?? 0 } });
    }
    if ((intent.type === "debuff" || intent.type === "mixed") && intent.status) {
      const status = intent.status as StatusKey;
      combat.player.statuses[status] = (combat.player.statuses[status] ?? 0) + (intent.amount ?? 1);
      combat.events.push({ type: "PLAYER_STATUS_GAINED", message: `你被施加 ${intent.status}。`, payload: { status: intent.status, amount: intent.amount ?? 1 } });
    }
    const enemyDefinition = data.enemies.find((item) => item.id === enemy.enemyId);
    if (enemyDefinition) {
      enemy.intent = pickWeighted(enemyDefinition.intents.map((next) => ({ value: next, weight: next.weight })), rng);
    }
  }
  checkCombatEnd(combat);
}

function damagePlayer(combat: CombatState, amount: number) {
  const blocked = Math.min(combat.player.block, amount);
  combat.player.block -= blocked;
  const hpDamage = Math.max(0, amount - blocked);
  combat.player.hp = Math.max(0, combat.player.hp - hpDamage);
  combat.events.push({ type: "PLAYER_DAMAGED", message: `受到 ${hpDamage} 傷害。`, payload: { damage: hpDamage } });
  if (combat.player.hp <= 0) {
    combat.phase = "defeat";
    combat.events.push({ type: "COMBAT_DEFEAT", message: "生命歸零。" });
  }
}

export function checkCombatEnd(combat: CombatState) {
  if (combat.enemies.every((enemy) => enemy.hp <= 0)) {
    combat.phase = "victory";
    combat.summary.won = true;
    combat.events.push({ type: "COMBAT_VICTORY", message: "戰鬥勝利。" });
  }
  if (combat.player.hp <= 0) {
    combat.phase = "defeat";
  }
}

function tickStatuses(statuses: Partial<Record<StatusKey, number>>) {
  for (const key of Object.keys(statuses) as StatusKey[]) {
    const next = (statuses[key] ?? 0) - 1;
    if (next <= 0) delete statuses[key];
    else statuses[key] = next;
  }
}

function isEliteOrBoss(data: GameData, enemy: EnemyInstance): boolean {
  const definition = data.enemies.find((item) => item.id === enemy.enemyId);
  return definition?.kind === "elite" || definition?.kind === "boss";
}

function displayCardName(baseName: string, card: CardInstance): string {
  return card.mutation?.name ?? baseName;
}
