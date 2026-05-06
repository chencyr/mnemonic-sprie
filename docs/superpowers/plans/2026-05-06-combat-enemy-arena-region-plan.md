# Combat Enemy Arena Region Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Per `AGENTS.md`, using `superpowers:executing-plans` on this project must also use the `develop-web-game` workflow.

**Goal:** Make the central combat enemy arena state-driven so dead enemies cannot be targeted or act, death presentation lasts until completion, and victory/reward only advances after enemy death transitions finish.

**Architecture:** Keep core combat rules framework-neutral: `EnemyInstance.state` remains the gameplay state (`alive | dead`) and core does not know animation timing. Add a Phaser-side enemy presentation tracker (`alive | dying | dead`) that detects new core deaths, blocks target UI while dying, exposes state through `window.render_game_to_text()`, and gates `completeCurrentCombat()` until every death transition is done.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, Playwright E2E, Codex in-app browser / develop-web-game verification.

---

## File Structure

- `backlogs/24-combat-enemy-arena-region-backlog.md`: move to `backlogs/in-progress/` at execution start and `backlogs/done/` after verified merge.
- `progress.md`: append execution notes, checkpoints, and verification results.
- `src/phaser/combat/enemyPresentationState.ts`: new pure helper for Phaser enemy presentation state transitions.
- `tests/phaser/enemyPresentationState.test.ts`: Vitest coverage for alive/dying/dead state transitions and victory blocking.
- `src/phaser/ui/EnemyView.ts`: render alive/dying/dead differently and disable interaction for non-alive presentation states.
- `src/scenes/GameScene.ts`: own the scene-level enemy presentation map, detect new deaths, gate victory completion, expose test state.
- `tests/e2e/fullRunSmoke.mjs`: assert death presentation state is observable and reward does not appear until transitions complete.
- Optional only if needed: `tests/core/combatEngine.test.ts`, `tests/phaser/cardPlayRules.test.ts` for regression coverage around dead enemies.

---

### Task 0: Start Backlog Execution

**Files:**
- Move: `backlogs/24-combat-enemy-arena-region-backlog.md` -> `backlogs/in-progress/24-combat-enemy-arena-region-backlog.md`
- Modify: `progress.md`

- [ ] **Step 1: Create a dedicated worktree**

Run from `/Users/rexchen/Game/mnemonic-spire`:

```bash
git fetch origin
git worktree add .worktrees/combat-enemy-arena-region -b feature/combat-enemy-arena-region main
cd .worktrees/combat-enemy-arena-region
```

Expected: `git branch --show-current` prints `feature/combat-enemy-arena-region`.

- [ ] **Step 2: Read project rules and approved design**

Run:

```bash
sed -n '1,220p' AGENTS.md
sed -n '1,260p' docs/superpowers/specs/2026-05-06-combat-enemy-arena-region-design.md
```

Expected:

- Backlog execution requires prior brainstorm/design spec.
- `superpowers:executing-plans` must be paired with `develop-web-game`.
- Browser verification must use Codex in-app browser / Playwright target, not an external user browser.

- [ ] **Step 3: Move backlog into in-progress**

Run:

```bash
git mv backlogs/24-combat-enemy-arena-region-backlog.md backlogs/in-progress/24-combat-enemy-arena-region-backlog.md
```

Expected: `git status --short` shows the backlog rename.

- [ ] **Step 4: Append progress note**

Add this section to `progress.md`:

```md

## 2026-05-06 Combat Enemy Arena Region

- Continuing in `.worktrees/combat-enemy-arena-region` on branch `feature/combat-enemy-arena-region`.
- Goal: implement `docs/superpowers/specs/2026-05-06-combat-enemy-arena-region-design.md`.
- Direction: core enemy gameplay state stays `alive | dead`; Phaser owns presentation state `alive | dying | dead`.
- Victory/reward must wait for all enemy death presentation transitions to complete.
```

- [ ] **Step 5: Commit backlog state transition**

Run:

```bash
git add progress.md backlogs/in-progress/24-combat-enemy-arena-region-backlog.md
git commit -m "docs: start combat enemy arena backlog"
```

Expected: commit succeeds.

---

### Task 1: Add Pure Enemy Presentation State Helper

**Files:**
- Create: `src/phaser/combat/enemyPresentationState.ts`
- Create: `tests/phaser/enemyPresentationState.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/phaser/enemyPresentationState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  ENEMY_DEATH_PRESENTATION_MS,
  createEnemyPresentationSnapshot,
  reconcileEnemyPresentationStates,
  resolveEnemyPresentationTransitions,
  type EnemyPresentationStateMap
} from "../../src/phaser/combat/enemyPresentationState";
import type { EnemyInstance } from "../../src/core";

function enemy(id: string, state: EnemyInstance["state"], hp: number): EnemyInstance {
  return {
    instanceId: id,
    enemyId: "sticker_punk",
    state,
    hp,
    maxHp: 12,
    block: 0,
    statuses: {},
    intent: { id: "attack", type: "attack", amount: 4, weight: 1 }
  };
}

describe("enemy presentation state", () => {
  it("starts newly dead enemies in dying state and blocks victory", () => {
    const states: EnemyPresentationStateMap = new Map([["enemy-a", { state: "alive" }]]);

    const result = reconcileEnemyPresentationStates(states, [enemy("enemy-a", "dead", 0)], 1000, false);

    expect(result.changed).toBe(true);
    expect(states.get("enemy-a")).toEqual({ state: "dying", startedAt: 1000, dueAt: 1000 + ENEMY_DEATH_PRESENTATION_MS });
    expect(createEnemyPresentationSnapshot(states, [enemy("enemy-a", "dead", 0)])).toEqual({
      enemies: [{ id: "enemy-a", gameplayState: "dead", presentationState: "dying" }],
      pendingDeathTransitions: ["enemy-a"],
      victoryBlockedByEnemyTransitions: true,
      aliveTargetCount: 0
    });
  });

  it("resolves due dying enemies to stable dead state", () => {
    const states: EnemyPresentationStateMap = new Map([["enemy-a", { state: "dying", startedAt: 1000, dueAt: 2000 }]]);

    const result = resolveEnemyPresentationTransitions(states, 2000);

    expect(result.changed).toBe(true);
    expect(states.get("enemy-a")).toEqual({ state: "dead" });
  });

  it("keeps stale dead enemies dead across render reconciliation", () => {
    const states: EnemyPresentationStateMap = new Map([["enemy-a", { state: "dead" }]]);

    const result = reconcileEnemyPresentationStates(states, [enemy("enemy-a", "dead", 0)], 3000, false);

    expect(result.changed).toBe(false);
    expect(states.get("enemy-a")).toEqual({ state: "dead" });
  });

  it("resets presentation state when a new combat has alive enemies", () => {
    const states: EnemyPresentationStateMap = new Map([["old-enemy", { state: "dead" }]]);

    reconcileEnemyPresentationStates(states, [enemy("new-enemy", "alive", 8)], 4000, false);

    expect(Array.from(states.entries())).toEqual([["new-enemy", { state: "alive" }]]);
  });

  it("uses fast death duration in quick mode", () => {
    const states: EnemyPresentationStateMap = new Map([["enemy-a", { state: "alive" }]]);

    reconcileEnemyPresentationStates(states, [enemy("enemy-a", "dead", 0)], 1000, true);

    expect(states.get("enemy-a")).toEqual({ state: "dying", startedAt: 1000, dueAt: 1050 });
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- tests/phaser/enemyPresentationState.test.ts
```

Expected: fail because `src/phaser/combat/enemyPresentationState.ts` does not exist.

- [ ] **Step 3: Implement helper**

Create `src/phaser/combat/enemyPresentationState.ts`:

```ts
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
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
npm test -- tests/phaser/enemyPresentationState.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit helper**

Run:

```bash
git add src/phaser/combat/enemyPresentationState.ts tests/phaser/enemyPresentationState.test.ts
git commit -m "feat: add enemy presentation state helper"
```

Expected: commit succeeds.

---

### Task 2: Render Enemy Views From Presentation State

**Files:**
- Modify: `src/phaser/ui/EnemyView.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Add render contract to EnemyView**

In `src/phaser/ui/EnemyView.ts`, update imports and options:

```ts
import type { EnemyPresentationState } from "../combat/enemyPresentationState";
```

Change `EnemyViewOptions`:

```ts
export interface EnemyViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  data: GameData;
  assets: AssetRegistry;
  enemy: EnemyInstance;
  presentationState: EnemyPresentationState;
  x: number;
  y: number;
  selectedTargetEnabled: boolean;
  onTarget: () => void;
}
```

Then change the first lines inside `renderEnemyView`:

```ts
const { scene, context, data, assets, enemy, presentationState, x, y, selectedTargetEnabled, onTarget } = options;
const def = data.enemies.find((item) => item.id === enemy.enemyId) as EnemyDefinition;
const gameplayAlive = isEnemyAlive(enemy);
const targetable = gameplayAlive && presentationState === "alive";
const root = scene.add.container(0, 0);
root.add(scene.add.ellipse(x, y + 72, 176, 34, 0x000000, targetable ? 0.34 : 0.12));
const sprite = image(scene, context, x, y, assets.getEnemySprite(enemy.enemyId).key, ENEMY_SIZE, ENEMY_SIZE, `enemy:${enemy.enemyId}`);
if (sprite) {
  sprite.setAlpha(presentationState === "alive" ? 1 : presentationState === "dying" ? 0.58 : 0.34);
  if (presentationState === "dying") sprite.setScale(ENEMY_SIZE / Math.max(sprite.width, sprite.height) * 1.04);
  root.add(sprite);
}
```

Replace the intent/dead label and target button section:

```ts
if (enemy.block > 0 && presentationState === "alive") root.add(renderStatPill(scene, x - 82, y + 142, `格擋 ${enemy.block}`, 0x39d98a));
if (targetable) root.add(renderIntent(scene, context, assets, enemy.intent.type, enemy.intent.amount ?? 0, x + 36, y + 132));
else root.add(renderStatPill(scene, x + 20, y + 128, presentationState === "dying" ? "倒下中" : "已擊倒", 0x6b7280));
root.add(button(scene, context, `enemy:${enemy.instanceId}`, "目標", x - 54, y + 168, 108, 34, onTarget, selectedTargetEnabled && targetable, selectedTargetEnabled && targetable ? colors.red : colors.disabled));
if (selectedTargetEnabled && targetable) {
  root.add(scene.add.rectangle(x - 92, y - 92, 184, 244, 0xf4e04d, 0).setOrigin(0).setStrokeStyle(3, 0xf4e04d, 0.85));
}
```

- [ ] **Step 2: Pass presentation state from GameScene**

In `src/scenes/GameScene.ts`, import helper types:

```ts
import {
  createEnemyPresentationSnapshot,
  enemyPresentationState,
  hasPendingEnemyDeathTransitions,
  reconcileEnemyPresentationStates,
  resolveEnemyPresentationTransitions,
  type EnemyPresentationStateMap
} from "../phaser/combat/enemyPresentationState";
```

Add class field:

```ts
private enemyPresentationStates: EnemyPresentationStateMap = new Map();
```

In the enemy render call inside `drawCombat()`, pass:

```ts
presentationState: enemyPresentationState(this.enemyPresentationStates, enemy),
```

Expected context: the existing call to `renderEnemyView({ ... })` should now include the new property.

- [ ] **Step 3: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: initial failure may point to missing `presentationState` call sites. Fix only those call sites, then rerun until build passes.

- [ ] **Step 4: Commit render contract**

Run:

```bash
git add src/phaser/ui/EnemyView.ts src/scenes/GameScene.ts
git commit -m "feat: render enemies from presentation state"
```

Expected: commit succeeds.

---

### Task 3: Reconcile Presentation State During Combat Render

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Reset enemy presentation state outside combat**

In `render()`, update the existing non-combat reset block:

```ts
if (this.engine?.run.mode !== "combat") {
  this.turnTransition = undefined;
  this.victoryTransition = undefined;
  this.feedbackItems = [];
  this.enemyPresentationStates.clear();
}
```

- [ ] **Step 2: Reconcile enemy presentation state before drawing combat**

At the beginning of `drawCombat()`, after `const combat = this.engine.run.currentCombat; if (!combat) return;`, add:

```ts
resolveEnemyPresentationTransitions(this.enemyPresentationStates, this.virtualNow);
const presentationUpdate = reconcileEnemyPresentationStates(this.enemyPresentationStates, combat.enemies, this.virtualNow, this.quick);
if (presentationUpdate.newlyDyingEnemyIds.length > 0) {
  this.turnTransition = undefined;
  this.selected = undefined;
  if (this.dragCard.active) this.dragCard = { active: false, reasonIfBlocked: "目標已倒下。" };
  this.clearDragFeedback();
}
```

Do not call `this.render()` from this block; it runs during render.

- [ ] **Step 3: Resolve due transitions from test time advancement**

In `window.advanceTime`, replace:

```ts
this.resolvePendingVictoryTransition();
```

with:

```ts
this.resolvePendingEnemyPresentationTransitions();
this.resolvePendingVictoryTransition();
```

Then add this method near the victory transition methods:

```ts
private resolvePendingEnemyPresentationTransitions() {
  const result = resolveEnemyPresentationTransitions(this.enemyPresentationStates, this.virtualNow);
  if (result.changed) this.resolvePendingVictoryTransition();
}
```

- [ ] **Step 4: Ensure timed transition resolves in real browser time**

Add a class field near the other transition fields:

```ts
private enemyPresentationTimer?: Phaser.Time.TimerEvent;
```

In `drawCombat()`, after the reconcile block, schedule the next due transition with a guard:

```ts
const pendingEnemyDeathDueAt = Array.from(this.enemyPresentationStates.values())
  .filter((entry) => entry.state === "dying" && typeof entry.dueAt === "number")
  .map((entry) => entry.dueAt as number)
  .sort((a, b) => a - b)[0];
if (!this.enemyPresentationTimer && typeof pendingEnemyDeathDueAt === "number") {
  const delay = Math.max(0, pendingEnemyDeathDueAt - this.virtualNow);
  this.enemyPresentationTimer = this.time.delayedCall(delay, () => {
    this.enemyPresentationTimer = undefined;
    this.virtualNow = Math.max(this.virtualNow, pendingEnemyDeathDueAt);
    this.resolvePendingEnemyPresentationTransitions();
    this.render();
  });
}
```

Clear the timer inside the non-combat reset block in `render()`:

```ts
this.enemyPresentationTimer?.remove(false);
this.enemyPresentationTimer = undefined;
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 6: Commit reconciliation**

Run:

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: reconcile enemy presentation transitions"
```

Expected: commit succeeds.

---

### Task 4: Gate Victory Completion On Enemy Presentation

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Update victory transition start**

In `maybeBeginVictoryTransition()`, keep the combat phase check, then ensure death transitions are started before victory completion:

```ts
private maybeBeginVictoryTransition(): boolean {
  const combat = this.engine.run.currentCombat;
  if (this.engine.run.mode !== "combat" || !combat || combat.phase !== "victory") return false;
  reconcileEnemyPresentationStates(this.enemyPresentationStates, combat.enemies, this.virtualNow, this.quick);
  this.beginVictoryTransition();
  return true;
}
```

- [ ] **Step 2: Update victory transition delay**

Replace `beginVictoryTransition()` with this behavior:

```ts
private beginVictoryTransition() {
  if (this.victoryTransition || this.engine.run.mode !== "combat") return;
  const pendingDueAt = Array.from(this.enemyPresentationStates.values())
    .filter((entry) => entry.state === "dying" && typeof entry.dueAt === "number")
    .map((entry) => entry.dueAt as number)
    .sort((a, b) => a - b)[0];
  const dueAt = pendingDueAt ?? this.virtualNow + (this.quick ? 50 : 1000);
  const delayMs = Math.max(0, dueAt - this.virtualNow);
  const transition: VictoryTransitionState = { message: "敵人倒下，記憶正在沉澱。", dueAt };
  transition.timer = this.time.delayedCall(delayMs, () => {
    this.virtualNow = Math.max(this.virtualNow, dueAt);
    this.resolvePendingEnemyPresentationTransitions();
    this.resolvePendingVictoryTransition(true);
    this.render();
  });
  this.victoryTransition = transition;
  this.turnTransition = undefined;
  this.selected = undefined;
}
```

- [ ] **Step 3: Block completion while enemies are dying**

At the top of `resolvePendingVictoryTransition(force = false)`, after checking `this.victoryTransition`, add:

```ts
resolveEnemyPresentationTransitions(this.enemyPresentationStates, this.virtualNow);
if (hasPendingEnemyDeathTransitions(this.enemyPresentationStates)) return;
```

The method should still only call `completeCurrentCombat(this.engine)` after pending death transitions are done.

- [ ] **Step 4: Update E2E victory transition assertions**

In `tests/e2e/fullRunSmoke.mjs`, inside `assertVictoryTransitionDelaysReward(page)`, after the existing dead enemy assertion:

```js
assert.equal(current.combat.enemies[0].presentationState, "dying");
assert.deepEqual(current.combatEnemyArena.pendingDeathTransitions, ["transition-target"]);
assert.equal(current.combatEnemyArena.victoryBlockedByEnemyTransitions, true);
```

After the 500ms wait assertion, add:

```js
assert.equal(current.combat.enemies[0].presentationState, "dying");
assert.equal(current.combatEnemyArena.victoryBlockedByEnemyTransitions, true);
```

After the final reward assertion, no enemy arena state is required because mode is no longer combat.

- [ ] **Step 5: Run E2E to see the expected current failure**

Run:

```bash
npm run test:e2e
```

Expected before Task 5: fail because snapshot does not yet expose `presentationState` / `combatEnemyArena`.

- [ ] **Step 6: Keep Task 4 changes uncommitted until snapshot exposure is implemented**

Do not commit after Task 4 because the updated E2E assertions intentionally require snapshot fields added in Task 5.

Expected: `git status --short` shows modified `src/scenes/GameScene.ts` and `tests/e2e/fullRunSmoke.mjs`.

---

### Task 5: Expose Enemy Arena State In Text Snapshot

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Extend TextSnapshot**

In `src/scenes/GameScene.ts`, add to `interface TextSnapshot`:

```ts
combatEnemyArena?: ReturnType<typeof createEnemyPresentationSnapshot>;
```

- [ ] **Step 2: Extend combat enemy snapshot**

In `snapshot()`, change enemy mapping from:

```ts
enemies: combat.enemies.map((enemy) => ({ id: enemy.instanceId, enemyId: enemy.enemyId, state: enemy.state, hp: enemy.hp, maxHp: enemy.maxHp, intent: enemy.intent.type })),
```

to:

```ts
enemies: combat.enemies.map((enemy) => ({
  id: enemy.instanceId,
  enemyId: enemy.enemyId,
  state: enemy.state,
  gameplayState: enemy.state,
  presentationState: enemyPresentationState(this.enemyPresentationStates, enemy),
  hp: enemy.hp,
  maxHp: enemy.maxHp,
  intent: enemy.intent.type
})),
```

- [ ] **Step 3: Add combatEnemyArena snapshot**

In `snapshot()` return object, near `combat`, add:

```ts
combatEnemyArena: combat ? createEnemyPresentationSnapshot(this.enemyPresentationStates, combat.enemies) : undefined,
```

- [ ] **Step 4: Run targeted E2E**

Run:

```bash
npm run test:e2e
```

Expected: victory transition assertions pass. If the full run finds timing issues, fix only enemy presentation timing and rerun.

- [ ] **Step 5: Run unit/build verification**

Run:

```bash
npm test
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 6: Commit snapshot exposure**

Run:

```bash
git add src/scenes/GameScene.ts tests/e2e/fullRunSmoke.mjs
git commit -m "test: expose enemy arena presentation state"
```

Expected: commit succeeds.

---

### Task 6: Browser Verification With develop-web-game

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Start local Vite server**

Run from the implementation worktree:

```bash
npm run dev -- --host 127.0.0.1 --port 5177
```

Expected: server is available at `http://127.0.0.1:5177/?e2e=1`.

- [ ] **Step 2: Use Codex in-app browser / Playwright target**

Navigate only in Codex app browser or equivalent MCP Playwright target:

```text
http://127.0.0.1:5177/?e2e=1
```

Do not use macOS `open`, Chrome, Safari, Firefox, or any external user-installed browser.

- [ ] **Step 3: Verify death transition state**

Through browser interaction or `$WEB_GAME_CLIENT`, verify:

- combat can be entered
- attack can kill an enemy
- killed enemy becomes `presentationState: "dying"`
- killed enemy cannot be targeted during `dying`
- reward does not appear before death transition completes
- after transition, mode advances to reward or victory as expected
- console/page errors are empty

- [ ] **Step 4: Record browser verification**

Append to `progress.md`:

```md
- develop-web-game / Codex in-app browser verification passed for combat enemy arena:
  - enemy death enters `dying` presentation state.
  - dead/dying enemies are not targetable.
  - reward waits for enemy death presentation completion.
  - `window.render_game_to_text()` exposes `combatEnemyArena`.
  - console/page errors were empty.
```

- [ ] **Step 5: Commit verification note**

Run:

```bash
git add progress.md
git commit -m "docs: record combat enemy arena verification"
```

Expected: commit succeeds.

---

### Task 7: Final Verification And Backlog Close

**Files:**
- Move: `backlogs/in-progress/24-combat-enemy-arena-region-backlog.md` -> `backlogs/done/24-combat-enemy-arena-region-backlog.md`
- Modify: `progress.md`

- [ ] **Step 1: Run final verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected:

- Vitest passes.
- TypeScript/Vite build passes.
- E2E passes.

- [ ] **Step 2: Move backlog to done**

Run:

```bash
git mv backlogs/in-progress/24-combat-enemy-arena-region-backlog.md backlogs/done/24-combat-enemy-arena-region-backlog.md
```

Expected: backlog is now under `backlogs/done/`.

- [ ] **Step 3: Append completion note**

Append to `progress.md`:

```md
- Final verification passed for combat enemy arena:
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
- Completed `24-combat-enemy-arena-region-backlog.md` and moved it to `backlogs/done/`.
```

- [ ] **Step 4: Commit completion**

Run:

```bash
git add progress.md backlogs/done/24-combat-enemy-arena-region-backlog.md
git commit -m "docs: complete combat enemy arena backlog"
```

Expected: commit succeeds.

- [ ] **Step 5: Push feature branch**

Run:

```bash
git push -u origin feature/combat-enemy-arena-region
```

Expected: feature branch is pushed to GitHub.

---

## Acceptance Criteria Checklist

- Dead enemy is never targetable.
- Dead enemy never acts on enemy turn.
- Dead enemy keeps dead visual state across render.
- Newly killed enemy enters `dying` presentation state.
- Death transition lasts 1 second in normal mode or uses explicit fast duration in `?e2e=1`.
- Victory/reward waits until all death presentation transitions complete.
- `window.render_game_to_text()` exposes gameplay state, presentation state, pending death transitions, victory blocked state, and alive target count.
- `npm test`, `npm run build`, and `npm run test:e2e` pass.
- Codex in-app browser / develop-web-game verification is recorded.
