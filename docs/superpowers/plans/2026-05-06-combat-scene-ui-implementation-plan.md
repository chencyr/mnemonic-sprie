# Combat Scene UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Per `AGENTS.md`, executing this plan must also use `develop-web-game` for web game browser verification.

**Goal:** Implement the confirmed readable combat UI direction: proposal-1 style combat background, Phaser-rendered black translucent regions for the five main UI zones, and preserved combat interactions/test observability.

**Current Direction:** Do not render generated UI surface images for player status, progress status, combat ticker, turn action area, or hand area. Only the combat background, enemy platform, target ring, existing cards/enemies/intents/stickers should use image assets.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, Playwright E2E, Codex in-app browser / MCP Playwright, develop-web-game client.

---

## File Structure

- `docs/superpowers/specs/2026-05-06-combat-scene-ui-implementation-design.md`: source design direction.
- `docs/assets/image-generation-prompts.jsonl`: source of truth for image generation prompts.
- `docs/assets/combat-ui-asset-audit.md`: record combat asset decisions.
- `public/assets/ui/combat/battle-bg.png`: runtime combat background.
- `src/phaser/ui/CombatSceneView.ts`: combat layout constants and Phaser-rendered UI regions.
- `src/phaser/ui/EnemyView.ts`: enemy platform / target ring rendering.
- `src/scenes/GameScene.ts`: combat composition and button placement.
- `tests/e2e/fullRunSmoke.mjs`: visible asset and interaction coverage.
- `progress.md`: progress and verification notes.

---

## Task 1: Align Asset Prompt And Background

**Files:**
- Modify: `docs/assets/image-generation-prompts.jsonl`
- Modify: `docs/assets/combat-ui-asset-audit.md`
- Modify/Create: `public/assets/ui/combat/battle-bg.png`

- [ ] **Step 1: Read project asset generation rules**

Run:

```bash
sed -n '1,180p' AGENTS.md
```

Expected: rules require every image generation to follow `docs/assets/image-generation-prompts.jsonl`.

- [ ] **Step 2: Read the battle background prompt**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
for line in Path("docs/assets/image-generation-prompts.jsonl").read_text().splitlines():
    if not line.strip():
        continue
    row = json.loads(line)
    if row.get("output") == "public/assets/ui/combat/battle-bg.png":
        print(json.dumps(row, ensure_ascii=False, indent=2))
        break
PY
```

Expected:

- output is `public/assets/ui/combat/battle-bg.png`
- size is `1920x1080`
- background is `opaque`
- reference is `externals/battle-design-proposal-1.png`
- prompt asks for the background plate only, with UI/cards/enemies/text removed

- [ ] **Step 3: Generate the battle background with imagegen**

Use the `imagegen` skill and the prompt from `docs/assets/image-generation-prompts.jsonl`.

Input image role:

- `externals/battle-design-proposal-1.png`: primary visual reference

Output requirement:

- Save final runtime asset to `public/assets/ui/combat/battle-bg.png`
- Keep or resize to exactly `1920x1080`
- Opaque PNG

- [ ] **Step 4: Verify image dimensions**

Run:

```bash
sips -g pixelWidth -g pixelHeight public/assets/ui/combat/battle-bg.png
```

Expected:

```text
pixelWidth: 1920
pixelHeight: 1080
```

- [ ] **Step 5: Update audit if the prompt changed**

If the prompt/reference/direction changes, update `docs/assets/image-generation-prompts.jsonl` first, then update `docs/assets/combat-ui-asset-audit.md`.

---

## Task 2: Render Five Main Combat UI Regions Without Image Assets

**Files:**
- Modify: `src/phaser/ui/CombatSceneView.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Ensure only background uses a combat UI surface image**

In `src/phaser/ui/CombatSceneView.ts`, `renderCombatBackground(...)` may use:

```ts
assets.getCombatUiAsset("battleBg")
```

The following helpers must not accept `assets` or `context` for rendering panel image surfaces:

- `renderCombatPlayerPanel`
- `renderCombatTopResource`
- `renderCombatTickerSurface`
- `renderCombatTurnDevice`
- `renderCombatHandTray`

- [ ] **Step 2: Add black translucent Phaser region helper**

Add:

```ts
function translucentRegion(scene: Phaser.Scene, w: number, h: number) {
  return scene.add.rectangle(0, 0, w, h, 0x000000, 0.58).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.14);
}
```

- [ ] **Step 3: Use translucent regions in the five helpers**

Each helper should add `translucentRegion(...)` as its first child, then render dynamic Phaser labels/bars/buttons on top.

The helpers must not push visible asset roles for:

- `combat-ui:player-panel`
- `combat-ui:top-resource`
- `combat-ui:ticker-panel`
- `combat-ui:turn-device`
- `combat-ui:hand-tray`

- [ ] **Step 4: Update GameScene call sites**

In `src/scenes/GameScene.ts`, update call signatures so the five helpers are called without `assets`/`uiContext()` when they no longer need image assets.

Expected patterns:

```ts
renderCombatTopResource(this, this.engine.run)
renderCombatPlayerPanel(this, this.engine.run, vitals)
renderCombatTickerSurface(this)
renderCombatHandTray(this)
renderCombatTurnDevice(this, combat.turn, combat.player.energy)
```

---

## Task 3: Move Quick Test Win Button

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Move `測試勝利` to lower-left**

In `drawCombat()`, keep the button behind `this.quick`, but render it at lower-left:

```ts
this.button("auto-win", "測試勝利", 24, 656, 132, 40, () => {
  autoWinCombat(this.engine);
  this.render();
}, !this.victoryTransition, 0x39d98a);
```

Expected:

- `測試勝利` remains available in `?e2e=1`
- it no longer competes with the normal right-bottom turn action area

---

## Task 4: Update E2E Assertions

**Files:**
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Keep background visible asset assertion**

E2E should still assert:

```js
assertVisibleAssetRole(current, "combat-ui:background", "combat");
```

- [ ] **Step 2: Remove panel surface visible asset assertions**

Remove assertions expecting:

- `combat-ui:player-panel`
- `combat-ui:top-resource`
- `combat-ui:ticker-panel`
- `combat-ui:hand-tray`
- `combat-ui:turn-device`

- [ ] **Step 3: Add negative assertion helper**

Add:

```js
function assertNoCombatPanelSurfaceAssets(current) {
  const removedRoles = new Set(["combat-ui:player-panel", "combat-ui:top-resource", "combat-ui:ticker-panel", "combat-ui:hand-tray", "combat-ui:turn-device"]);
  const stillRendered = current.visibleAssets?.filter((asset) => removedRoles.has(asset.role)) ?? [];
  assert.deepEqual(stillRendered, [], "combat status/progress/ticker/action/hand regions should use black translucent Phaser regions, not UI image assets.");
}
```

Call it after the combat background assertion.

- [ ] **Step 4: Update combat UI snapshot role expectation**

`current.combatUi.assetRoles` should include `combat-ui:background`.

It should not require the five removed panel roles.

---

## Task 5: Automated Verification

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected:

- all Vitest tests pass
- TypeScript/Vite build passes
- E2E smoke passes

- [ ] **Step 2: Record progress**

Append a concise note to `progress.md` describing:

- five combat UI regions now use black translucent Phaser rectangles
- generated UI surface assets are not rendered for those five regions
- `測試勝利` moved to lower-left
- verification commands passed

---

## Task 6: Codex In-App Browser Verification

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Start or reuse Vite on port 5177**

Run from this worktree:

```bash
npm run dev -- --host 127.0.0.1 --port 5177
```

Expected: local URL is `http://127.0.0.1:5177/?e2e=1`.

- [ ] **Step 2: Navigate using Codex app browser**

Use the Codex in-app browser / MCP Playwright browser target only:

```text
http://127.0.0.1:5177/?e2e=1
```

Do not use macOS `open`, Chrome, Safari, Firefox, or other external user-installed browsers.

- [ ] **Step 3: Inspect combat scene**

Verify visually:

- proposal-1-style background is visible
- player/progress/ticker/turn/hand regions are black translucent
- no generated panel surface images are visible for those five regions
- `測試勝利` is in the lower-left
- cards and text remain readable

- [ ] **Step 4: Inspect text state**

Check `window.render_game_to_text()` through the in-app browser / Playwright context.

Expected:

- mode can reach `"combat"`
- `visibleAssets` includes `combat-ui:background`
- `visibleAssets` does not include the five removed panel surface roles
- console/page errors are empty

- [ ] **Step 5: Record browser verification**

Append the result to `progress.md`.

---

## Task 7: Commit And Push

**Files:**
- All modified files

- [ ] **Step 1: Commit**

Run:

```bash
git status --short
git add docs/superpowers/specs/2026-05-06-combat-scene-ui-implementation-design.md \
  docs/superpowers/plans/2026-05-06-combat-scene-ui-implementation-plan.md \
  src/phaser/ui/CombatSceneView.ts \
  src/scenes/GameScene.ts \
  tests/e2e/fullRunSmoke.mjs \
  progress.md
git commit -m "docs: align combat ui spec and plan with simplified regions"
```

- [ ] **Step 2: Push**

Run:

```bash
git push
```

Expected: feature branch is updated on GitHub.

---

## Acceptance Criteria

- `battle-bg.png` follows the `docs/assets/image-generation-prompts.jsonl` definition and proposal-1 reference direction.
- Player status, progress status, battle ticker, turn actions, and hand area render as black translucent Phaser regions.
- No generated UI surface image assets are rendered for those five regions.
- Enemy platform and target ring may still use image assets.
- `測試勝利` appears in the lower-left in `?e2e=1`.
- `npm test`, `npm run build`, and `npm run test:e2e` pass.
- Codex in-app browser verification is used for manual visual inspection.
