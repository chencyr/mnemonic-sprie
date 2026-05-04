import type { MemoryType } from "../types";
import type { CardInstance, CombatState } from "../combat/types";

export const MEMORY_THRESHOLDS: Record<MemoryType, number> = {
  bloodthirst: 3,
  desperation: 2,
  grudge: 3,
  obsession: 2,
  witness: 1
};

export function addMemoryProgress(combat: CombatState, card: CardInstance, memoryType: MemoryType, amount = 1) {
  card.memory[memoryType] += amount;
  combat.firstMemoryGained = true;
  combat.events.push({
    type: "MEMORY_PROGRESS_GAINED",
    message: `${card.instanceId} 獲得 ${memoryLabel(memoryType)} 記憶。`,
    payload: { card: card.instanceId, memoryType, value: card.memory[memoryType] }
  });
}

export function eligibleMemoryTypes(card: CardInstance): MemoryType[] {
  if (card.mutation) return [];
  return (Object.keys(MEMORY_THRESHOLDS) as MemoryType[]).filter((type) => card.memory[type] >= MEMORY_THRESHOLDS[type]);
}

export function memoryLabel(memoryType: MemoryType): string {
  switch (memoryType) {
    case "bloodthirst":
      return "嗜血";
    case "desperation":
      return "絕境";
    case "grudge":
      return "怨念";
    case "obsession":
      return "執念";
    case "witness":
      return "見證";
  }
}
