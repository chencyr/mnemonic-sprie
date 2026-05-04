import { shuffle, type Rng } from "../rng";
import type { CardDefinition, GameData, RelicDefinition } from "../types";
import type { RewardState } from "./types";

export function createCombatReward(data: GameData, rng: Rng, elite: boolean): RewardState {
  const pool = data.cards.filter((card) => card.rarity !== "basic" && card.rarity !== "curse");
  const cards = shuffle(pool, rng).slice(0, 3);
  const relicPool = data.relics.filter((relic) => relic.rarity !== "starter");
  const relic: RelicDefinition | undefined = elite && relicPool.length > 0 ? relicPool[rng.nextInt(relicPool.length)] : undefined;
  return {
    cards,
    relic,
    gold: elite ? 45 : 20
  };
}

export function rareCard(data: GameData, rng: Rng): CardDefinition {
  const rarePool = data.cards.filter((card) => card.rarity === "rare");
  return rarePool[rng.nextInt(rarePool.length)];
}
