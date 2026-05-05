# Combat Feedback Readability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mixed-layer combat feedback so damage, block, memory, draw, death, and turn events are readable without scanning the full combat log.

**Architecture:** Keep core combat unchanged and add Phaser-only presentation state under `src/phaser/fx/`. Convert new `CombatEvent`s into deterministic `CombatFeedbackItem`s with a pure mapper, then let `GameScene` render active floating feedback, a concise ticker, and rare center messages. Expose feedback state through `window.render_game_to_text()` for E2E and develop-web-game verification.

**Tech Stack:** Phaser 3, TypeScript, Vitest, Playwright E2E, develop-web-game Playwright client.

---

### Task 0: Start Feature Worktree And Move Backlog

**Files:**
- Move: `backlogs/03-combat-feedback-readability-backlog.md` -> `backlogs/in-progress/03-combat-feedback-readability-backlog.md`

- [ ] **Step 1: Create the feature worktree from main**

Run from `/Users/rexchen/Game/mnemonic-spire`:

```bash
git fetch origin
git worktree add .worktrees/combat-feedback-readability -b feature/combat-feedback-readability main
cd .worktrees/combat-feedback-readability
```

Expected: worktree is created and branch is `feature/combat-feedback-readability`.

- [ ] **Step 2: Move the backlog into in-progress**

Run:

```bash
git mv backlogs/03-combat-feedback-readability-backlog.md backlogs/in-progress/03-combat-feedback-readability-backlog.md
```

Expected: `git status --short` shows the backlog rename.

- [ ] **Step 3: Commit the backlog state transition**

Run:

```bash
git add backlogs/in-progress/03-combat-feedback-readability-backlog.md
git commit -m "docs: start combat feedback readability backlog"
```

Expected: commit succeeds.

---

### Task 1: Pure Combat Feedback Mapping

**Files:**
- Create: `src/phaser/fx/combatFeedback.ts`
- Create: `tests/phaser/combatFeedback.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/phaser/combatFeedback.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CombatEvent } from "../../src/core";
import { activeFeedbackItems, mapCombatEventsToFeedback, tickerItems, type CombatFeedbackItem } from "../../src/phaser/fx/combatFeedback";

function event(type: string, payload?: unknown, message = type): CombatEvent {
  return { type, message, payload };
}

describe("combat feedback mapping", () => {
  it("maps enemy damage into local feedback and ticker text", () => {
    const feedback = mapCombatEventsToFeedback([event("DAMAGE_DEALT", { enemy: "enemy-1", damage: 6 }, "造成 6 傷害。")], {
      now: 1000,
      sequenceStart: 0
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        id: "feedback-1000-0",
        type: "damage",
        text: "-6",
        tickerText: "造成 6 傷害",
        anchor: "enemy",
        enemyId: "enemy-1",
        createdAt: 1000,
        expiresAt: 1800
      })
    ]);
  });

  it("maps player block gain into player feedback", () => {
    const feedback = mapCombatEventsToFeedback([event("BLOCK_GAINED", { block: 5 }, "獲得 5 格擋。")], {
      now: 2000,
      sequenceStart: 3
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        id: "feedback-2000-3",
        type: "block",
        text: "+5 格擋",
        tickerText: "獲得 5 格擋",
        anchor: "player"
      })
    ]);
  });

  it("maps memory progress into memory feedback", () => {
    const feedback = mapCombatEventsToFeedback([event("MEMORY_PROGRESS_GAINED", { card: "strike-1", memoryType: "bloodthirst", value: 1 })], {
      now: 3000,
      sequenceStart: 8
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        id: "feedback-3000-8",
        type: "memory",
        text: "記憶 +1",
        tickerText: "strike-1 獲得記憶",
        anchor: "hand",
        cardInstanceId: "strike-1"
      })
    ]);
  });

  it("maps card draw into hand feedback", () => {
    const feedback = mapCombatEventsToFeedback([event("CARDS_DRAWN", { cards: ["a", "b", "c"] })], {
      now: 4000,
      sequenceStart: 4
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        type: "draw",
        text: "抽 3 張",
        tickerText: "抽 3 張牌",
        anchor: "hand"
      })
    ]);
  });

  it("maps enemy death into center feedback", () => {
    const feedback = mapCombatEventsToFeedback([event("ENEMY_STATE_CHANGED", { enemy: "enemy-1", from: "alive", to: "dead" })], {
      now: 5000,
      sequenceStart: 1
    });

    expect(feedback).toEqual([
      expect.objectContaining({
        type: "death",
        text: "敵人被擊倒",
        tickerText: "敵人被擊倒",
        anchor: "enemy",
        enemyId: "enemy-1",
        center: true
      })
    ]);
  });

  it("keeps active items by expiration and returns the last six ticker items", () => {
    const items: CombatFeedbackItem[] = Array.from({ length: 8 }, (_, index) => ({
      id: `item-${index}`,
      type: "system",
      text: `item ${index}`,
      tickerText: `ticker ${index}`,
      anchor: "ticker",
      createdAt: index * 100,
      expiresAt: 1000 + index
    }));

    expect(activeFeedbackItems(items, 1002).map((item) => item.id)).toEqual(["item-2", "item-3", "item-4", "item-5", "item-6", "item-7"]);
    expect(tickerItems(items).map((item) => item.id)).toEqual(["item-2", "item-3", "item-4", "item-5", "item-6", "item-7"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/phaser/combatFeedback.test.ts
```

Expected: fail because `src/phaser/fx/combatFeedback.ts` does not exist.

- [ ] **Step 3: Implement the feedback mapper**

Create `src/phaser/fx/combatFeedback.ts`:

```ts
import type { CombatEvent } from "../../core";

export type CombatFeedbackType = "damage" | "block" | "memory" | "draw" | "death" | "turn" | "system";
export type CombatFeedbackAnchor = "player" | "enemy" | "hand" | "battlefield" | "ticker";

export interface CombatFeedbackItem {
  id: string;
  type: CombatFeedbackType;
  text: string;
  tickerText: string;
  anchor: CombatFeedbackAnchor;
  enemyId?: string;
  cardInstanceId?: string;
  center?: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface FeedbackMappingOptions {
  now: number;
  sequenceStart: number;
}

const DEFAULT_TTL = 800;
const CENTER_TTL = 1200;
const TICKER_LIMIT = 6;

export function mapCombatEventsToFeedback(events: readonly CombatEvent[], options: FeedbackMappingOptions): CombatFeedbackItem[] {
  return events.flatMap((event, index) => {
    const id = `feedback-${options.now}-${options.sequenceStart + index}`;
    return mapCombatEventToFeedback(event, id, options.now);
  });
}

export function activeFeedbackItems(items: readonly CombatFeedbackItem[], now: number): CombatFeedbackItem[] {
  return items.filter((item) => item.expiresAt > now);
}

export function tickerItems(items: readonly CombatFeedbackItem[]): CombatFeedbackItem[] {
  return items.slice(-TICKER_LIMIT);
}

function mapCombatEventToFeedback(event: CombatEvent, id: string, now: number): CombatFeedbackItem[] {
  if (event.type === "DAMAGE_DEALT") {
    const payload = event.payload as { enemy?: string; damage?: number } | undefined;
    const damage = payload?.damage ?? 0;
    if (damage <= 0) return [];
    return [
      item({
        id,
        type: "damage",
        text: `-${damage}`,
        tickerText: `造成 ${damage} 傷害`,
        anchor: "enemy",
        enemyId: payload?.enemy,
        now
      })
    ];
  }

  if (event.type === "PLAYER_DAMAGED") {
    const payload = event.payload as { damage?: number } | undefined;
    const damage = payload?.damage ?? 0;
    return [
      item({
        id,
        type: damage > 0 ? "damage" : "block",
        text: damage > 0 ? `-${damage} HP` : "格擋",
        tickerText: damage > 0 ? `受到 ${damage} 傷害` : "格擋了攻擊",
        anchor: "player",
        now
      })
    ];
  }

  if (event.type === "BLOCK_GAINED") {
    const payload = event.payload as { block?: number } | undefined;
    const block = payload?.block ?? 0;
    if (block <= 0) return [];
    return [
      item({
        id,
        type: "block",
        text: `+${block} 格擋`,
        tickerText: `獲得 ${block} 格擋`,
        anchor: "player",
        now
      })
    ];
  }

  if (event.type === "ENEMY_BLOCK_GAINED") {
    const payload = event.payload as { enemy?: string; block?: number } | undefined;
    const block = payload?.block ?? 0;
    if (block <= 0) return [];
    return [
      item({
        id,
        type: "block",
        text: `+${block} 格擋`,
        tickerText: `敵人獲得 ${block} 格擋`,
        anchor: "enemy",
        enemyId: payload?.enemy,
        now
      })
    ];
  }

  if (event.type === "MEMORY_PROGRESS_GAINED") {
    const payload = event.payload as { card?: string } | undefined;
    return [
      item({
        id,
        type: "memory",
        text: "記憶 +1",
        tickerText: `${payload?.card ?? "卡牌"} 獲得記憶`,
        anchor: "hand",
        cardInstanceId: payload?.card,
        now
      })
    ];
  }

  if (event.type === "CARDS_DRAWN") {
    const payload = event.payload as { cards?: string[] } | undefined;
    const count = payload?.cards?.length ?? 0;
    if (count <= 0) return [];
    return [
      item({
        id,
        type: "draw",
        text: `抽 ${count} 張`,
        tickerText: `抽 ${count} 張牌`,
        anchor: "hand",
        now
      })
    ];
  }

  if (event.type === "ENEMY_STATE_CHANGED") {
    const payload = event.payload as { enemy?: string; to?: string } | undefined;
    if (payload?.to !== "dead") return [];
    return [
      item({
        id,
        type: "death",
        text: "敵人被擊倒",
        tickerText: "敵人被擊倒",
        anchor: "enemy",
        enemyId: payload.enemy,
        center: true,
        now,
        ttl: CENTER_TTL
      })
    ];
  }

  if (event.type === "BOSS_COUNTERMEASURE_REVEALED") {
    return [
      item({
        id,
        type: "system",
        text: "Boss 讀出了你的習慣",
        tickerText: event.message,
        anchor: "battlefield",
        center: true,
        now,
        ttl: CENTER_TTL
      })
    ];
  }

  return [];
}

function item(input: Omit<CombatFeedbackItem, "createdAt" | "expiresAt"> & { now: number; ttl?: number }): CombatFeedbackItem {
  const { now, ttl, ...rest } = input;
  return {
    ...rest,
    createdAt: now,
    expiresAt: now + (ttl ?? DEFAULT_TTL)
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/phaser/combatFeedback.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/phaser/fx/combatFeedback.ts tests/phaser/combatFeedback.test.ts
git commit -m "test: add combat feedback mapping"
```

Expected: commit succeeds.

---

### Task 2: Add Feedback State To GameScene Snapshot

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Test: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add E2E assertions for feedback state**

In `tests/e2e/fullRunSmoke.mjs`, update `assertDragAttackAutoTargets()` so it also verifies damage feedback after dragging an attack:

```js
async function assertDragAttackAutoTargets(page) {
  let current = await state(page);
  const attack = current.combat.hand.find((card) => card.type === "attack" && card.cost <= current.combat.energy);
  if (!attack) return;
  const enemyBefore = current.combat.enemies.find((enemy) => enemy.state === "alive");
  assert.ok(enemyBefore, "Expected a living enemy before drag attack.");
  current = await dragButtonTo(page, `card:${attack.id}`, 620, 260);
  const enemyAfter = current.combat?.enemies.find((enemy) => enemy.id === enemyBefore.id);
  assert.ok(enemyAfter && enemyAfter.hp < enemyBefore.hp, "Dragging attack to battlefield should damage auto target.");
  assert.ok(current.feedback?.active?.some((item) => item.type === "damage" && item.anchor === "enemy"), "Damage feedback should be active after an attack.");
  assert.ok(current.feedback?.ticker?.some((item) => item.type === "damage"), "Damage ticker should be visible after an attack.");
}
```

- [ ] **Step 2: Run E2E to verify it fails**

Run:

```bash
npm run test:e2e
```

Expected: fail because `render_game_to_text()` does not expose `feedback`.

- [ ] **Step 3: Wire feedback state into `GameScene`**

In `src/scenes/GameScene.ts`, extend imports:

```ts
import {
  activeFeedbackItems,
  mapCombatEventsToFeedback,
  tickerItems,
  type CombatFeedbackItem
} from "../phaser/fx/combatFeedback";
```

Add to `TextSnapshot`:

```ts
  feedback: {
    active: Pick<CombatFeedbackItem, "id" | "type" | "text" | "anchor" | "enemyId" | "cardInstanceId">[];
    ticker: Pick<CombatFeedbackItem, "id" | "type" | "tickerText">[];
    centerMessage?: Pick<CombatFeedbackItem, "id" | "type" | "text">;
  };
```

Add class fields:

```ts
  private feedbackItems: CombatFeedbackItem[] = [];
  private feedbackSequence = 0;
```

In `render()`, when leaving combat, clear feedback:

```ts
    if (this.engine?.run.mode !== "combat") {
      this.turnTransition = undefined;
      this.victoryTransition = undefined;
      this.feedbackItems = [];
    }
```

In `drawCombat()`, replace the direct `playCombatFx(diff.events, anchors);` call with:

```ts
    const mappedFeedback = mapCombatEventsToFeedback(diff.events, {
      now: this.virtualNow,
      sequenceStart: this.feedbackSequence
    });
    this.feedbackSequence += diff.events.length;
    this.feedbackItems = [...activeFeedbackItems(this.feedbackItems, this.virtualNow), ...mappedFeedback];
    this.playCombatFx(diff.events, anchors);
```

In `snapshot()`, add:

```ts
      feedback: this.feedbackSnapshot(),
```

Add a method near `snapshot()`:

```ts
  private feedbackSnapshot() {
    const active = activeFeedbackItems(this.feedbackItems, this.virtualNow);
    const center = [...active].reverse().find((item) => item.center);
    return {
      active: active.map((item) => ({
        id: item.id,
        type: item.type,
        text: item.text,
        anchor: item.anchor,
        enemyId: item.enemyId,
        cardInstanceId: item.cardInstanceId
      })),
      ticker: tickerItems(this.feedbackItems).map((item) => ({
        id: item.id,
        type: item.type,
        tickerText: item.tickerText
      })),
      centerMessage: center ? { id: center.id, type: center.type, text: center.text } : undefined
    };
  }
```

- [ ] **Step 4: Run E2E to verify feedback state exists**

Run:

```bash
npm run test:e2e
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/scenes/GameScene.ts tests/e2e/fullRunSmoke.mjs
git commit -m "feat: expose combat feedback state"
```

Expected: commit succeeds.

---

### Task 3: Render Ticker And Center Message

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Replace long combat log rendering with ticker rows**

In `src/scenes/GameScene.ts`, add helper methods near `playCombatFx()`:

```ts
  private renderCombatTicker(logPanel: Phaser.GameObjects.Container) {
    const ticker = tickerItems(this.feedbackItems).slice(-6);
    if (ticker.length === 0) {
      logPanel.add(label(this, 14, 48, "等待行動。", 14, "#d1d5db", layout.rightPanel.w - 28));
      return;
    }
    ticker.forEach((item, index) => {
      const y = 48 + index * 34;
      logPanel.add(this.add.rectangle(14, y + 2, 5, 24, feedbackColor(item.type), 0.94).setOrigin(0));
      logPanel.add(label(this, 28, y, item.tickerText, 14, "#e5e7eb", layout.rightPanel.w - 44));
    });
  }

  private renderCenterFeedback() {
    const center = [...activeFeedbackItems(this.feedbackItems, this.virtualNow)].reverse().find((item) => item.center);
    if (!center) return;
    const root = this.add.container(layout.battlefield.x + layout.battlefield.w / 2 - 180, layout.battlefield.y + 18);
    root.add(this.add.rectangle(0, 0, 360, 44, 0x101827, 0.74).setOrigin(0).setStrokeStyle(2, feedbackColor(center.type), 0.58));
    root.add(label(this, 180, 22, center.text, 18, "#fff8d8", 320).setOrigin(0.5));
    this.root?.add(root);
  }
```

Add a file-level helper at the bottom of `GameScene.ts`:

```ts
function feedbackColor(type: string): number {
  if (type === "damage") return 0xee4266;
  if (type === "block") return 0x39d98a;
  if (type === "memory") return 0x8b5cf6;
  if (type === "draw") return 0xf4e04d;
  if (type === "death") return 0xff6b6b;
  return 0xd1d5db;
}
```

In `drawCombat()`, replace:

```ts
    const logLines = combat.events.map((event) => event.message).slice(-8);
    if (this.turnTransition) logLines.push(this.turnTransition.message);
    if (this.victoryTransition) logLines.push(this.victoryTransition.message);
    if (this.dragCard.reasonIfBlocked) logLines.push(this.dragCard.reasonIfBlocked);
    logPanel.add(label(this, 14, 48, logLines.join("\n"), 13, "#d1d5db", layout.rightPanel.w - 28));
```

with:

```ts
    this.renderCombatTicker(logPanel);
    if (this.turnTransition) logPanel.add(label(this, 14, layout.rightPanel.h - 92, this.turnTransition.message, 14, "#fff8d8", layout.rightPanel.w - 28));
    if (this.victoryTransition) logPanel.add(label(this, 14, layout.rightPanel.h - 68, this.victoryTransition.message, 14, "#fff8d8", layout.rightPanel.w - 28));
    if (this.dragCard.reasonIfBlocked) logPanel.add(label(this, 14, layout.rightPanel.h - 44, this.dragCard.reasonIfBlocked, 13, "#ff9aa9", layout.rightPanel.w - 28));
```

After `this.playCombatFx(diff.events, anchors);`, call:

```ts
    this.renderCenterFeedback();
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: render combat feedback ticker"
```

Expected: commit succeeds.

---

### Task 4: Add Local Feedback For Block, Memory, Draw, And Death

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Extend `playCombatFx()` to play feedback types**

Keep existing damage and player damage behavior, and add these event branches inside `playCombatFx()`:

```ts
      if (event.type === "BLOCK_GAINED") {
        this.playSfx("audio:blockGain", 0.42);
        const payload = event.payload as { block?: number } | undefined;
        const block = payload?.block ?? 0;
        if (block > 0) {
          floatText(this, anchors.player?.x ?? 130, (anchors.player?.y ?? 190) + 18, `+${block} 格擋`, { color: "#8be9d1", fontSize: 18, dy: 34 });
          flashTarget(this, anchors.player?.target, 0x39d98a, 90);
        }
      }

      if (event.type === "ENEMY_BLOCK_GAINED") {
        const payload = event.payload as { enemy?: string; block?: number } | undefined;
        const anchor = payload?.enemy ? anchors.enemies.get(payload.enemy) : undefined;
        const block = payload?.block ?? 0;
        if (block > 0) {
          floatText(this, anchor?.x ?? 620, (anchor?.y ?? 240) - 52, `+${block} 格擋`, { color: "#8be9d1", fontSize: 18, dy: 34 });
        }
      }

      if (event.type === "MEMORY_PROGRESS_GAINED") {
        const payload = event.payload as { value?: number } | undefined;
        floatText(this, layout.hand.x + 96, layout.hand.y - 10, `記憶 +${payload?.value ? 1 : 1}`, { color: "#c4b5fd", fontSize: 18, dy: 30 });
      }

      if (event.type === "CARDS_DRAWN") {
        const payload = event.payload as { cards?: string[] } | undefined;
        const count = payload?.cards?.length ?? 0;
        if (count > 0) {
          floatText(this, layout.hand.x + layout.hand.w / 2, layout.hand.y - 12, `抽 ${count} 張`, { color: "#ffd166", fontSize: 18, dy: 30 });
        }
      }

      if (event.type === "ENEMY_STATE_CHANGED") {
        const payload = event.payload as { enemy?: string; to?: string } | undefined;
        if (payload?.to === "dead") {
          const anchor = payload.enemy ? anchors.enemies.get(payload.enemy) : undefined;
          floatText(this, anchor?.x ?? 620, (anchor?.y ?? 240) - 126, "擊倒", { color: "#ff6b6b", fontSize: 20, dy: 26, duration: 900 });
        }
      }
```

- [ ] **Step 2: Run build and E2E**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: both pass.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add layered combat feedback fx"
```

Expected: commit succeeds.

---

### Task 5: Expand E2E Coverage For Block, Memory, And Death Feedback

**Files:**
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add block feedback assertion**

Add this helper near the other combat assertion helpers:

```js
async function assertBlockFeedback(page) {
  await page.evaluate(() => {
    const scene = window.mnemonicSpireScene;
    const combat = scene.engine.run.currentCombat;
    const guard = combat.cards.find((card) => card.cardId === "guard");
    if (!guard) throw new Error("Missing guard card for block feedback scenario.");
    combat.phase = "player";
    combat.player.energy = 3;
    combat.hand = [guard.instanceId];
    combat.drawPile = [];
    combat.discardPile = [];
    scene.turnTransition = undefined;
    scene.victoryTransition = undefined;
    scene.render();
  });
  let current = await state(page);
  const guard = current.combat.hand.find((card) => card.cardId === "guard");
  assert.ok(guard, "Block feedback scenario should expose a guard card.");
  current = await dragButtonTo(page, `card:${guard.id}`, 132, 210);
  assert.ok(current.feedback?.active?.some((item) => item.type === "block" && item.anchor === "player"), "Block feedback should be active after Guard.");
  assert.ok(current.feedback?.ticker?.some((item) => item.type === "block"), "Block ticker should be visible after Guard.");
}
```

Call it after entering the first combat and before `assertCombatHpTracksEnemyTurn(page)`:

```js
  await assertBlockFeedback(page);
```

- [ ] **Step 2: Add memory and death feedback checks to the victory transition scenario**

Inside `assertVictoryTransitionDelaysReward(page)`, after final hit assertions, add:

```js
  assert.ok(current.feedback?.active?.some((item) => item.type === "memory"), "Memory feedback should be visible when the killing Strike gains memory.");
  assert.ok(current.feedback?.active?.some((item) => item.type === "death"), "Death feedback should be visible after the final enemy dies.");
  assert.ok(current.feedback?.centerMessage?.type === "death", "Death should produce a center message during the victory presentation.");
```

- [ ] **Step 3: Run E2E**

Run:

```bash
npm run test:e2e
```

Expected: pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add tests/e2e/fullRunSmoke.mjs
git commit -m "test: cover combat feedback e2e"
```

Expected: commit succeeds.

---

### Task 6: Full Verification With Develop Web Game

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Run complete automated verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected:

- `npm test` passes all test files.
- `npm run build` exits 0.
- `npm run test:e2e` exits 0.

- [ ] **Step 2: Run develop-web-game client**

Run:

```bash
node /Users/rexchen/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js \
  --url 'http://127.0.0.1:5173/?e2e=1' \
  --actions-json '{"steps":[{"buttons":["left_mouse_button"],"frames":2,"mouse_x":814,"mouse_y":534},{"buttons":[],"frames":18}]}' \
  --iterations 2 \
  --pause-ms 250 \
  --screenshot-dir output/web-game-combat-feedback-readability
```

Expected:

- `output/web-game-combat-feedback-readability/shot-*.png` exists.
- `output/web-game-combat-feedback-readability/state-*.json` exists.
- No `errors-*.json` files exist in that directory.

- [ ] **Step 3: Run manual Playwright scenario for combat feedback**

Run this from the feature worktree:

```bash
rm -rf output/manual-combat-feedback-readability
node --input-type=module <<'EOF'
import fs from 'node:fs';
import { chromium } from 'playwright';

const outDir = 'output/manual-combat-feedback-readability';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push({ type: 'console.error', text: msg.text() }); });
page.on('pageerror', (err) => errors.push({ type: 'pageerror', text: String(err) }));
await page.goto('http://127.0.0.1:5173/?e2e=1', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);

async function gameState() {
  return JSON.parse(await page.evaluate(() => window.render_game_to_text()));
}

async function clickButton(id) {
  const current = await gameState();
  const button = current.buttons.find((item) => item.id === id);
  if (!button) throw new Error(`Missing button ${id}`);
  if (!button.enabled) throw new Error(`Disabled button ${id}`);
  await page.mouse.click(button.x, button.y);
  await page.waitForTimeout(180);
}

async function dragButtonTo(id, x, y) {
  const current = await gameState();
  const button = current.buttons.find((item) => item.id === id);
  if (!button) throw new Error(`Missing button ${id}`);
  if (!button.enabled) throw new Error(`Disabled button ${id}`);
  await page.mouse.move(button.x, button.y);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.move(x, y, { steps: 8 });
  await page.waitForTimeout(70);
  await page.mouse.up();
  await page.waitForTimeout(180);
}

await clickButton('start');
let current = await gameState();
const firstMap = current.buttons.find((button) => button.id.startsWith('map:') && button.enabled);
if (!firstMap) throw new Error('No enabled map node.');
await clickButton(firstMap.id);

await page.evaluate(() => {
  const scene = window.mnemonicSpireScene;
  const combat = scene.engine.run.currentCombat;
  const enemy = combat.enemies[0];
  const strike = combat.cards.find((card) => card.cardId === 'strike');
  const guard = combat.cards.find((card) => card.cardId === 'guard');
  if (!strike || !guard) throw new Error('Missing strike or guard.');
  combat.enemies = [{ ...enemy, instanceId: 'feedback-target', state: 'alive', hp: 8, maxHp: 8, block: 0, statuses: {}, intent: { id: 'attack', type: 'attack', amount: 6, weight: 1 } }];
  combat.phase = 'player';
  combat.player.energy = 3;
  combat.hand = [guard.instanceId, strike.instanceId];
  combat.drawPile = [];
  combat.discardPile = [];
  scene.turnTransition = undefined;
  scene.victoryTransition = undefined;
  scene.render();
});

current = await gameState();
const guard = current.combat.hand.find((card) => card.cardId === 'guard');
await dragButtonTo(`card:${guard.id}`, 132, 210);
current = await gameState();
fs.writeFileSync(`${outDir}/state-block.json`, JSON.stringify(current, null, 2));
await page.screenshot({ path: `${outDir}/block.png`, fullPage: false });
if (!current.feedback.active.some((item) => item.type === 'block')) throw new Error('Missing block feedback.');

const strike = current.combat.hand.find((card) => card.cardId === 'strike');
const target = current.buttons.find((button) => button.id === 'enemy:feedback-target');
await dragButtonTo(`card:${strike.id}`, target.x, target.y - 120);
current = await gameState();
fs.writeFileSync(`${outDir}/state-damage.json`, JSON.stringify(current, null, 2));
await page.screenshot({ path: `${outDir}/damage.png`, fullPage: false });
if (!current.feedback.active.some((item) => item.type === 'damage')) throw new Error('Missing damage feedback.');
if (!current.feedback.ticker.some((item) => item.type === 'damage')) throw new Error('Missing damage ticker.');

if (errors.length) fs.writeFileSync(`${outDir}/errors.json`, JSON.stringify(errors, null, 2));
await browser.close();
if (errors.length) throw new Error(`Browser errors found: ${JSON.stringify(errors)}`);
EOF
```

Expected:

- `output/manual-combat-feedback-readability/block.png` shows block feedback.
- `output/manual-combat-feedback-readability/damage.png` shows damage feedback and ticker.
- No `output/manual-combat-feedback-readability/errors.json` exists.

- [ ] **Step 4: Update progress**

Append this section to `progress.md`:

```md
## 2026-05-06 Combat Feedback Readability

- Implemented mixed-layer combat feedback:
  - Local floating feedback for damage, block, memory, draw, and death.
  - Right-side ticker for recent high-value combat events.
  - Center message for high-importance events such as enemy death.
- Exposed feedback state through `window.render_game_to_text()`.
- Verification:
  - `npm test` passed.
  - `npm run build` passed.
  - `npm run test:e2e` passed.
  - develop-web-game artifacts written to `output/web-game-combat-feedback-readability/` with no error files.
  - Manual Playwright artifacts written to `output/manual-combat-feedback-readability/` with no error files.
```

- [ ] **Step 5: Commit verification progress**

Run:

```bash
git add progress.md
git commit -m "docs: record combat feedback verification"
```

Expected: commit succeeds.

---

### Task 7: Finish Backlog

**Files:**
- Move: `backlogs/in-progress/03-combat-feedback-readability-backlog.md` -> `backlogs/done/03-combat-feedback-readability-backlog.md`

- [ ] **Step 1: Move backlog to done**

Run:

```bash
git mv backlogs/in-progress/03-combat-feedback-readability-backlog.md backlogs/done/03-combat-feedback-readability-backlog.md
```

Expected: `git status --short` shows the backlog move.

- [ ] **Step 2: Final verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all pass.

- [ ] **Step 3: Commit backlog completion**

Run:

```bash
git add backlogs/done/03-combat-feedback-readability-backlog.md
git commit -m "docs: complete combat feedback readability backlog"
```

Expected: commit succeeds.

- [ ] **Step 4: Push branch**

Run:

```bash
git push -u origin feature/combat-feedback-readability
```

Expected: branch is pushed.

---

## Self-Review

- Spec coverage:
  - Local jump text: Task 1 maps feedback; Task 4 renders damage, block, memory, draw, and death.
  - Right-side ticker: Task 1 creates ticker items; Task 3 renders ticker.
  - Center message: Task 1 marks center events; Task 3 renders center message.
  - Snapshot hooks: Task 2 exposes `feedback` in `render_game_to_text()`.
  - E2E: Tasks 2 and 5 cover damage, block, memory, and death feedback.
  - develop-web-game validation: Task 6 includes required browser client and screenshot checks.
- Placeholder scan: no `TBD`, `TODO`, or vague implementation-only steps remain.
- Type consistency:
  - `CombatFeedbackItem`, `activeFeedbackItems`, `tickerItems`, and `mapCombatEventsToFeedback` are introduced in Task 1 and used with the same names in later tasks.
  - Snapshot fields use `feedback.active`, `feedback.ticker`, and `feedback.centerMessage` consistently across plan and tests.
