import type { CombatState, EnemyInstance } from "./types";

export function isEnemyAlive(enemy: EnemyInstance): boolean {
  return enemy.state === "alive" && enemy.hp > 0;
}

export function markEnemyDead(combat: CombatState, enemy: EnemyInstance): boolean {
  if (enemy.state === "dead") {
    enemy.hp = 0;
    enemy.block = 0;
    return false;
  }
  if (enemy.hp > 0) return false;
  enemy.hp = 0;
  enemy.block = 0;
  enemy.state = "dead";
  combat.events.push({
    type: "ENEMY_STATE_CHANGED",
    message: `${enemy.instanceId} 被擊倒。`,
    payload: { enemy: enemy.instanceId, from: "alive", to: "dead" }
  });
  return true;
}

export function syncEnemyDeathState(combat: CombatState, enemy: EnemyInstance): boolean {
  if (enemy.hp <= 0) return markEnemyDead(combat, enemy);
  return false;
}
