import { shuffle, type Rng } from "../rng";
import type { GameData } from "../types";
import type { ShopItem } from "./types";

export function createShopInventory(data: GameData, rng: Rng, priceMultiplier = 1): ShopItem[] {
  const cards = shuffle(data.cards.filter((card) => card.rarity !== "basic" && card.rarity !== "curse"), rng).slice(0, 3);
  const relics = shuffle(data.relics.filter((relic) => relic.rarity !== "starter"), rng).slice(0, 2);
  return [
    ...cards.map((card, index): ShopItem => ({
      id: `shop-card-${index + 1}`,
      kind: "card",
      itemId: card.id,
      price: Math.ceil((card.rarity === "rare" ? 90 : 55) * priceMultiplier),
      sold: false
    })),
    ...relics.map((relic, index): ShopItem => ({
      id: `shop-relic-${index + 1}`,
      kind: "relic",
      itemId: relic.id,
      price: Math.ceil((relic.rarity === "rare" ? 140 : 85) * priceMultiplier),
      sold: false
    })),
    { id: "shop-remove", kind: "remove", itemId: "remove", price: Math.ceil(70 * priceMultiplier), sold: false }
  ];
}
