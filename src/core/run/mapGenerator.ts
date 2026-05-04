import { type Rng } from "../rng";
import type { GameData, NodeType } from "../types";
import type { MapNode } from "./types";

export function generateMap(data: GameData, rng: Rng): MapNode[] {
  const floors: MapNode[][] = [];
  for (let floor = 1; floor <= data.mapRules.floorCount; floor += 1) {
    const count = floor === 1 || floor === data.mapRules.bossFloor ? 1 : 3;
    floors.push(
      Array.from({ length: count }, (_, index): MapNode => ({
        id: `f${floor}n${index + 1}`,
        floor,
        type: nodeTypeForFloor(data, rng, floor, index),
        next: [],
        x: count === 1 ? 0.5 : 0.22 + index * 0.28
      }))
    );
  }

  for (let i = 0; i < floors.length - 1; i += 1) {
    for (const node of floors[i]) {
      node.next = floors[i + 1].map((next) => next.id);
    }
  }
  return floors.flat();
}

function nodeTypeForFloor(data: GameData, rng: Rng, floor: number, index: number): NodeType {
  if (floor === 1) return "normalCombat";
  if (floor === data.mapRules.bossFloor) return "boss";
  if (floor === data.mapRules.requiredRestFloorMin && index === 1) return "rest";
  if (floor === data.mapRules.lateSpecialFloorMin && index === 1) return "shop";
  if (floor === 4 && index === 1) return "event";
  if (floor === 7 && index === 0) return "eliteCombat";
  const route = ["normalCombat", "event", "normalCombat", "rest", "normalCombat", "shop"] as const;
  return route[(floor + index + rng.nextInt(route.length)) % route.length];
}

export function firstFloorNodeId(map: readonly MapNode[]): string {
  const node = map.find((item) => item.floor === 1);
  if (!node) throw new Error("Map has no first floor node.");
  return node.id;
}
