import assets from "../../data/assets.json";
import cards from "../../data/cards.json";
import contracts from "../../data/contracts.json";
import enemies from "../../data/enemies.json";
import events from "../../data/events.json";
import mapRules from "../../data/mapRules.json";
import relics from "../../data/relics.json";
import type { GameData } from "../types";
import { validateGameData } from "./validate";

export function loadGameData(): GameData {
  return validateGameData({
    cards,
    enemies,
    relics,
    contracts,
    events,
    mapRules,
    assets
  } as GameData);
}
