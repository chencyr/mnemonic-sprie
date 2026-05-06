import { isEnemyAlive, type EnemyInstance } from "../../core";

export type EnemyPresentationState = "alive" | "dying" | "dead";

export interface EnemyPresentationEntry {
  state: EnemyPresentationState;
  startedAt?: number;
  dueAt?: number;
}

export type EnemyPresentationStateMap = Map<string, EnemyPresentationEntry>;

export const ENEMY_DEATH_PRESENTATION_MS = 1000;
export const QUICK_ENEMY_DEATH_PRESENTATION_MS = 50;

export interface EnemyPresentationUpdateResult {
  changed: boolean;
  newlyDyingEnemyIds: string[];
}

export interface EnemyPresentationSnapshot {
  enemies: Array<{
    id: string;
    gameplayState: EnemyInstance["state"];
    presentationState: EnemyPresentationState;
  }>;
  pendingDeathTransitions: string[];
  victoryBlockedByEnemyTransitions: boolean;
  aliveTargetCount: number;
}

export function reconcileEnemyPresentationStates(states: EnemyPresentationStateMap, enemies: readonly EnemyInstance[], now: number, quick: boolean): EnemyPresentationUpdateResult {
  let changed = false;
  const newlyDyingEnemyIds: string[] = [];
  const liveIds = new Set(enemies.map((enemy) => enemy.instanceId));

  for (const id of Array.from(states.keys())) {
    if (!liveIds.has(id)) {
      states.delete(id);
      changed = true;
    }
  }

  for (const enemy of enemies) {
    const current = states.get(enemy.instanceId);
    if (isEnemyAlive(enemy)) {
      if (!current || current.state !== "alive") {
        states.set(enemy.instanceId, { state: "alive" });
        changed = true;
      }
      continue;
    }

    if (current?.state === "dead" || current?.state === "dying") continue;

    const duration = quick ? QUICK_ENEMY_DEATH_PRESENTATION_MS : ENEMY_DEATH_PRESENTATION_MS;
    states.set(enemy.instanceId, { state: "dying", startedAt: now, dueAt: now + duration });
    newlyDyingEnemyIds.push(enemy.instanceId);
    changed = true;
  }

  return { changed, newlyDyingEnemyIds };
}

export function resolveEnemyPresentationTransitions(states: EnemyPresentationStateMap, now: number): EnemyPresentationUpdateResult {
  let changed = false;
  const newlyDyingEnemyIds: string[] = [];

  for (const [id, entry] of states.entries()) {
    if (entry.state === "dying" && typeof entry.dueAt === "number" && now >= entry.dueAt) {
      states.set(id, { state: "dead" });
      changed = true;
    }
  }

  return { changed, newlyDyingEnemyIds };
}

export function enemyPresentationState(states: EnemyPresentationStateMap, enemy: EnemyInstance): EnemyPresentationState {
  return states.get(enemy.instanceId)?.state ?? (isEnemyAlive(enemy) ? "alive" : "dead");
}

export function hasPendingEnemyDeathTransitions(states: EnemyPresentationStateMap): boolean {
  return Array.from(states.values()).some((entry) => entry.state === "dying");
}

export function createEnemyPresentationSnapshot(states: EnemyPresentationStateMap, enemies: readonly EnemyInstance[]): EnemyPresentationSnapshot {
  const snapshotEnemies = enemies.map((enemy) => ({
    id: enemy.instanceId,
    gameplayState: enemy.state,
    presentationState: enemyPresentationState(states, enemy)
  }));
  const pendingDeathTransitions = snapshotEnemies.filter((enemy) => enemy.presentationState === "dying").map((enemy) => enemy.id);

  return {
    enemies: snapshotEnemies,
    pendingDeathTransitions,
    victoryBlockedByEnemyTransitions: pendingDeathTransitions.length > 0,
    aliveTargetCount: enemies.filter((enemy) => isEnemyAlive(enemy) && enemyPresentationState(states, enemy) === "alive").length
  };
}
