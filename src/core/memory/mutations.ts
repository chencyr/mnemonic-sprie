import type { CardDefinition, GameData, MemoryType } from "../types";
import type { CardInstance } from "../combat/types";
import { eligibleMemoryTypes, memoryLabel } from "./memoryRules";

export interface MutationResult {
  card: CardInstance;
  label: string;
}

export function canMutate(card: CardInstance, memoryType?: MemoryType): boolean {
  const eligible = eligibleMemoryTypes(card);
  return memoryType ? eligible.includes(memoryType) : eligible.length > 0;
}

export function mutateCardInstance(data: GameData, card: CardInstance, memoryType?: MemoryType, floor = 0): MutationResult {
  const selected = memoryType ?? eligibleMemoryTypes(card)[0];
  if (!selected || !canMutate(card, selected)) {
    throw new Error(`Card is not eligible for mutation: ${card.instanceId}`);
  }
  const definition = data.cards.find((item) => item.id === card.cardId);
  if (!definition) throw new Error(`Unknown card id for mutation: ${card.cardId}`);
  card.mutation = buildMutation(definition, selected, floor);
  return { card, label: card.mutation.name };
}

function buildMutation(card: CardDefinition, memoryType: MemoryType, floor: number) {
  const label = memoryLabel(memoryType);
  const isAttack = card.type === "attack";
  const isDefense = card.type === "defense";
  const name = `${label}${card.name}`;
  const mutation = {
    memoryType,
    name,
    description: `${card.description} ${mutationSuffix(memoryType)}`,
    mutatedAtFloor: floor,
    damageBonus: isAttack ? 0 : undefined,
    blockBonus: isDefense ? 0 : undefined,
    costDelta: 0,
    eliteBossDamageBonus: 0,
    drawOnKill: 0
  };
  switch (memoryType) {
    case "bloodthirst":
      mutation.damageBonus = isAttack ? 2 : undefined;
      mutation.drawOnKill = 1;
      break;
    case "desperation":
      mutation.damageBonus = isAttack ? 6 : undefined;
      mutation.blockBonus = isDefense ? 4 : undefined;
      break;
    case "grudge":
      mutation.costDelta = -1;
      break;
    case "obsession":
      mutation.blockBonus = isDefense ? 4 : undefined;
      mutation.costDelta = card.cost > 0 ? -1 : 0;
      break;
    case "witness":
      mutation.eliteBossDamageBonus = isAttack ? 6 : 0;
      mutation.damageBonus = isAttack ? 1 : undefined;
      break;
  }
  return mutation;
}

function mutationSuffix(memoryType: MemoryType): string {
  switch (memoryType) {
    case "bloodthirst":
      return "若擊殺敵人，抽 1 張牌。";
    case "desperation":
      return "低生命時效果更強。";
    case "grudge":
      return "若曾被棄置，費用更低。";
    case "obsession":
      return "更容易被反覆使用。";
    case "witness":
      return "對精英與 Boss 更有效。";
  }
}
