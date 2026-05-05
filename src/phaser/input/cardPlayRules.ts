import { effectiveCardCost, isEnemyAlive, type CardDefinition, type CardInstance, type CombatState, type EnemyInstance, type GameData } from "../../core";

export type DropZoneKind = "enemy" | "battlefield" | "player" | "hand" | "invalid";

export interface CardDropResult {
  zone: DropZoneKind;
  enemyId?: string;
}

export interface ResolvedCardPlay {
  ok: boolean;
  targetEnemyId?: string;
  targetCardId?: string;
  reason?: string;
}

export function findAutoEnemyTarget(enemies: readonly EnemyInstance[]): string | undefined {
  return enemies
    .filter(isEnemyAlive)
    .reduce<EnemyInstance | undefined>((best, enemy) => {
      if (!best) return enemy;
      if (enemy.hp < best.hp) return enemy;
      return best;
    }, undefined)?.instanceId;
}

export function canAnyHandCardPlay(data: GameData, combat: CombatState): boolean {
  return combat.hand.some((cardInstanceId) => playabilityReason(data, combat, cardInstanceId) === undefined);
}

export function playabilityReason(data: GameData, combat: CombatState, cardInstanceId: string): string | undefined {
  const cardInstance = combat.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = cardInstance ? cardDefinition(data, cardInstance) : undefined;
  if (!cardInstance || !definition) return "找不到卡牌。";
  if (!combat.hand.includes(cardInstanceId)) return "卡牌不在手牌中。";
  if (effectiveCardCost(data, cardInstance) > combat.player.energy) return "能量不足。";
  if ((definition.target === "singleEnemy" || definition.target === "allEnemies") && !findAutoEnemyTarget(combat.enemies)) return "沒有可攻擊目標。";
  if (definition.target === "handCard" && !targetHandCard(combat, cardInstanceId)) return "沒有可指定的手牌。";
  return undefined;
}

export function resolveDraggedCardPlay(data: GameData, combat: CombatState, cardInstanceId: string, drop: CardDropResult): ResolvedCardPlay {
  if (drop.zone === "hand") return { ok: false, reason: "拖回手牌，取消出牌。" };
  if (drop.zone === "invalid") return { ok: false, reason: "沒有放到可出牌區域。" };

  const cardInstance = combat.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = cardInstance ? cardDefinition(data, cardInstance) : undefined;
  if (!cardInstance || !definition) return { ok: false, reason: "找不到卡牌。" };

  const reason = playabilityReason(data, combat, cardInstanceId);
  if (reason) return { ok: false, reason };

  if (definition.target === "singleEnemy") {
    if (drop.zone !== "enemy" && drop.zone !== "battlefield") return { ok: false, reason: "攻擊牌需要放到敵人或戰場。" };
    return { ok: true, targetEnemyId: livingEnemyId(combat, drop.enemyId) ?? findAutoEnemyTarget(combat.enemies) };
  }

  if (definition.target === "allEnemies") {
    if (drop.zone !== "enemy" && drop.zone !== "battlefield") return { ok: false, reason: "群體攻擊需要放到戰場。" };
    return { ok: true };
  }

  if (definition.target === "self" || definition.target === "none") {
    if (drop.zone !== "player" && drop.zone !== "battlefield") return { ok: false, reason: "這張牌需要放到玩家區或戰場。" };
    return { ok: true };
  }

  if (definition.target === "handCard") {
    if (drop.zone !== "player" && drop.zone !== "battlefield") return { ok: false, reason: "這張牌需要放到玩家區或戰場。" };
    return { ok: true, targetCardId: targetHandCard(combat, cardInstanceId) };
  }

  return { ok: false, reason: "不支援的卡牌目標。" };
}

function cardDefinition(data: GameData, card: CardInstance): CardDefinition | undefined {
  return data.cards.find((definition) => definition.id === card.cardId);
}

function livingEnemyId(combat: CombatState, enemyId?: string): string | undefined {
  return combat.enemies.find((enemy) => enemy.instanceId === enemyId && isEnemyAlive(enemy))?.instanceId;
}

function targetHandCard(combat: CombatState, cardInstanceId: string): string | undefined {
  return combat.hand.find((id) => id !== cardInstanceId);
}
