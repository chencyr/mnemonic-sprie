import type { CombatEvent } from "../../core";

export type CombatFeedbackType = "damage" | "block" | "memory" | "draw" | "death" | "turn" | "system";
export type CombatFeedbackAnchor = "player" | "enemy" | "hand" | "battlefield" | "ticker";

export interface CombatFeedbackItem {
  id: string;
  type: CombatFeedbackType;
  text: string;
  tickerText: string;
  anchor: CombatFeedbackAnchor;
  enemyId?: string;
  cardInstanceId?: string;
  center?: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface FeedbackMappingOptions {
  now: number;
  sequenceStart: number;
}

const DEFAULT_TTL = 800;
const CENTER_TTL = 1200;
const TICKER_LIMIT = 6;

type EventPayload = Record<string, unknown>;

export function mapCombatEventsToFeedback(events: readonly CombatEvent[], options: FeedbackMappingOptions): CombatFeedbackItem[] {
  const feedback: CombatFeedbackItem[] = [];

  events.forEach((event, index) => {
    const item = mapCombatEventToFeedback(event, options.now, options.sequenceStart + index);
    if (item) feedback.push(item);
  });

  return feedback;
}

export function activeFeedbackItems(items: readonly CombatFeedbackItem[], now: number): CombatFeedbackItem[] {
  return items.filter((item) => item.expiresAt >= now);
}

export function tickerItems(items: readonly CombatFeedbackItem[], limit = TICKER_LIMIT): CombatFeedbackItem[] {
  return items.slice(-limit);
}

function mapCombatEventToFeedback(event: CombatEvent, now: number, sequence: number): CombatFeedbackItem | undefined {
  const payload = eventPayload(event.payload);
  const id = `feedback-${now}-${sequence}`;

  if (event.type === "DAMAGE_DEALT") {
    const damage = numberValue(payload.damage);
    if (damage <= 0) return undefined;
    return {
      id,
      type: "damage",
      text: `-${damage}`,
      tickerText: `造成 ${damage} 傷害`,
      anchor: "enemy",
      enemyId: stringValue(payload.enemy),
      createdAt: now,
      expiresAt: now + DEFAULT_TTL
    };
  }

  if (event.type === "PLAYER_DAMAGED") {
    const damage = numberValue(payload.damage);
    if (damage <= 0) return undefined;
    return {
      id,
      type: "damage",
      text: `-${damage} HP`,
      tickerText: `受到 ${damage} 傷害`,
      anchor: "player",
      createdAt: now,
      expiresAt: now + DEFAULT_TTL
    };
  }

  if (event.type === "BLOCK_GAINED") {
    const block = numberValue(payload.block);
    if (block <= 0) return undefined;
    return {
      id,
      type: "block",
      text: `+${block} 格擋`,
      tickerText: `獲得 ${block} 格擋`,
      anchor: "player",
      createdAt: now,
      expiresAt: now + DEFAULT_TTL
    };
  }

  if (event.type === "ENEMY_BLOCK_GAINED") {
    const block = numberValue(payload.block);
    if (block <= 0) return undefined;
    return {
      id,
      type: "block",
      text: `+${block} 格擋`,
      tickerText: `敵人獲得 ${block} 格擋`,
      anchor: "enemy",
      enemyId: stringValue(payload.enemy),
      createdAt: now,
      expiresAt: now + DEFAULT_TTL
    };
  }

  if (event.type === "MEMORY_PROGRESS_GAINED") {
    const value = Math.max(1, numberValue(payload.amount, 1));
    const card = stringValue(payload.card);
    return {
      id,
      type: "memory",
      text: `記憶 +${value}`,
      tickerText: `${card ?? "卡牌"} 獲得記憶`,
      anchor: "hand",
      cardInstanceId: card,
      createdAt: now,
      expiresAt: now + DEFAULT_TTL
    };
  }

  if (event.type === "CARDS_DRAWN") {
    const count = Array.isArray(payload.cards) ? payload.cards.length : numberValue(payload.count);
    if (count <= 0) return undefined;
    return {
      id,
      type: "draw",
      text: `抽 ${count} 張`,
      tickerText: `抽 ${count} 張牌`,
      anchor: "hand",
      createdAt: now,
      expiresAt: now + DEFAULT_TTL
    };
  }

  if (event.type === "ENEMY_STATE_CHANGED" && payload.to === "dead") {
    return {
      id,
      type: "death",
      text: "敵人被擊倒",
      tickerText: "敵人被擊倒",
      anchor: "enemy",
      enemyId: stringValue(payload.enemy),
      center: true,
      createdAt: now,
      expiresAt: now + CENTER_TTL
    };
  }

  if (event.type === "CARD_PLAYED") {
    return {
      id,
      type: "system",
      text: event.message,
      tickerText: event.message.replace(/。$/u, ""),
      anchor: "ticker",
      createdAt: now,
      expiresAt: now + DEFAULT_TTL
    };
  }

  return undefined;
}

function eventPayload(payload: unknown): EventPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  return payload as EventPayload;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
