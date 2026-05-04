import type { CombatState } from "../combat/types";

export function applyBrokenNotes(combat: CombatState) {
  const [mostUsed] = Object.entries(combat.playedCounts).sort((a, b) => b[1] - a[1]);
  if (!mostUsed) return;
  const card = combat.cards.find((item) => item.instanceId === mostUsed[0]);
  if (!card) return;
  card.memory.obsession += 1;
  combat.events.push({ type: "RELIC_TRIGGERED", message: "破碎筆記讓使用最多的牌獲得記憶。", payload: { relic: "broken_notes", card: card.instanceId } });
}

export function hasRelic(relicIds: readonly string[], relicId: string): boolean {
  return relicIds.includes(relicId);
}
