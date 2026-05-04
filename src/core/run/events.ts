import type { ContractDefinition, EventDefinition, GameData } from "../types";

export function pickEvent(data: GameData, floor: number): EventDefinition {
  return data.events[floor % data.events.length];
}

export function contractById(data: GameData, contractId: string): ContractDefinition {
  const contract = data.contracts.find((item) => item.id === contractId);
  if (!contract) throw new Error(`Unknown contract id: ${contractId}`);
  return contract;
}
