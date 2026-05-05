# Combat Scene UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Phaser combat scene so it uses real combat UI assets and visually follows `externals/battle-design-proposal-3.png`, while preserving all current combat interactions and test observability.

**Architecture:** Keep core combat logic unchanged. Add combat-specific UI asset slots to the data/asset registry layer, generate or reuse true image assets under `public/assets/ui/combat/`, then compose those assets dynamically in Phaser with existing cards, enemies, text, feedback, drag/drop, and state hooks. Prefer focused combat UI helper modules over growing `GameScene.drawCombat()` further.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, Playwright E2E, develop-web-game Playwright client, project image generation workflow.

---

## File Structure

- `backlogs/18-combat-scene-ui-implementation-backlog.md`: move to `backlogs/in-progress/` at start and `backlogs/done/` after final verification.
- `progress.md`: append progress and verification notes after each meaningful chunk.
- `docs/assets/asset-spec.md`: add combat UI asset slot specifications.
- `docs/assets/image-generation-prompts.jsonl`: add exact prompts for missing combat UI assets.
- `docs/assets/combat-ui-asset-audit.md`: create audit mapping selected design needs to existing/reused/generated assets.
- `public/assets/ui/combat/*.png`: final combat UI assets used at runtime.
- `src/core/types.ts`: keep `AssetDefaults.ui` as `Record<string, string>`; no schema change required.
- `src/core/assets/assetRegistry.ts`: add `CombatUiAssetKey` union and `getCombatUiAsset(key)` lookup.
- `tests/core/assetRegistry.test.ts`: cover new combat UI asset lookup and preload entries.
- `src/data/assets.json`: add combat UI asset keys.
- `src/phaser/ui/CombatSceneView.ts`: create combat layout constants and render helper functions for background, top strip, player status, enemy stage, hand tray, turn device, ticker shell, and drop hints.
- `src/phaser/ui/HudView.ts`: leave non-combat HUD unchanged; only reuse exports if needed.
- `src/phaser/ui/EnemyView.ts`: accept optional combat UI assets for platform/ring styling and keep dead/alive behavior.
- `src/phaser/ui/CardView.ts`: support optional rotation/depth-friendly placement without distorting art.
- `src/scenes/GameScene.ts`: integrate combat layout helpers; preserve interaction methods and snapshot fields.
- `tests/e2e/fullRunSmoke.mjs`: assert combat UI assets are visible and interactions still work after layout change.

---

### Task 0: Start Worktree And Move Backlog

**Files:**
- Move: `backlogs/18-combat-scene-ui-implementation-backlog.md` -> `backlogs/in-progress/18-combat-scene-ui-implementation-backlog.md`
- Modify: `progress.md`

- [ ] **Step 1: Create the feature worktree from main**

Run from `/Users/rexchen/Game/mnemonic-spire`:

```bash
git fetch origin
git worktree add .worktrees/combat-scene-ui-implementation -b feature/combat-scene-ui-implementation main
cd .worktrees/combat-scene-ui-implementation
```

Expected: worktree is created and `git branch --show-current` prints `feature/combat-scene-ui-implementation`.

- [ ] **Step 2: Read project rules and progress**

Run:

```bash
sed -n '1,260p' AGENTS.md
sed -n '1,260p' progress.md
```

Expected: rules confirm `superpowers:executing-plans` must be paired with `develop-web-game`, and `progress.md` already has an `Original prompt:` line.

- [ ] **Step 3: Move the backlog into in-progress**

Run:

```bash
git mv backlogs/18-combat-scene-ui-implementation-backlog.md backlogs/in-progress/18-combat-scene-ui-implementation-backlog.md
```

Expected: `git status --short` shows the backlog rename.

- [ ] **Step 4: Append progress note**

Append this exact section to `progress.md`:

```md

## 2026-05-06 Combat Scene UI Implementation

- Continuing in `.worktrees/combat-scene-ui-implementation` on branch `feature/combat-scene-ui-implementation`.
- Goal: implement `docs/superpowers/specs/2026-05-06-combat-scene-ui-implementation-design.md`.
- Primary visual reference: `externals/battle-design-proposal-3.png`.
- Secondary visual reference: `externals/battle-design-proposal-4.png`.
- Required strategy: first audit/update combat UI assets and `docs/assets`, then implement Phaser combat UI.
```

- [ ] **Step 5: Commit the backlog state transition**

Run:

```bash
git add progress.md backlogs/in-progress/18-combat-scene-ui-implementation-backlog.md
git commit -m "docs: start combat scene ui implementation backlog"
```

Expected: commit succeeds.

---

### Task 1: Asset Audit And Docs/Assets Specs

**Files:**
- Create: `docs/assets/combat-ui-asset-audit.md`
- Modify: `docs/assets/asset-spec.md`
- Modify: `docs/assets/image-generation-prompts.jsonl`

- [ ] **Step 1: Create the combat UI asset audit**

Create `docs/assets/combat-ui-asset-audit.md` with this content:

```md
# Combat UI Asset Audit

## Goal

Implement `backlogs/in-progress/18-combat-scene-ui-implementation-backlog.md` using real combat UI assets inspired by `externals/battle-design-proposal-3.png`, with diagonal street energy from `externals/battle-design-proposal-4.png`.

## Reused Existing Assets

| Runtime Use | Existing Asset | Decision |
| --- | --- | --- |
| Player portrait / character flavor | `public/assets/characters/seeker.png` | Reuse. |
| Enemy sprites | `public/assets/enemies/*.png` | Reuse. |
| Card art | `public/assets/cards/*.png` | Reuse; keep aspect-ratio safe card rendering. |
| Intent icons | `public/assets/ui/intents/*.png` | Reuse for now; detailed intent UX belongs to backlog 05. |
| Memory stickers | `public/assets/stickers/*.png` | Reuse. |
| Starter relic icon | `public/assets/relics/broken_notes.png` | Reuse in top resource strip. |

## New Combat UI Assets

| Asset Key | File | Source Plan | Reason |
| --- | --- | --- | --- |
| `combatBattleBg` | `public/assets/ui/combat/battle-bg.png` | Generate | Existing assets do not provide a full combat stage background matching proposal 3. |
| `combatPlayerPanel` | `public/assets/ui/combat/player-panel.png` | Generate | Need a true street-graffiti status panel frame. |
| `combatTopResourceFrame` | `public/assets/ui/combat/top-resource-frame.png` | Generate | Top resource tabs should stop looking like the old full-width HUD. |
| `combatTurnDevice` | `public/assets/ui/combat/turn-device.png` | Generate | Right-bottom end-turn device is a signature part of proposal 3. |
| `combatTickerPanel` | `public/assets/ui/combat/combat-ticker-panel.png` | Generate | Right battle drawer should use a designed surface. |
| `combatEnemyPlatform` | `public/assets/ui/combat/enemy-platform.png` | Generate | Enemy sprites need grounded sticker platforms. |
| `combatTargetRing` | `public/assets/ui/combat/target-ring.png` | Generate | Target/hover state should be a neon ring instead of a plain rectangle. |
| `combatHandTray` | `public/assets/ui/combat/hand-tray.png` | Generate | Bottom card area needs a designed rail/tray. |
| `combatDropZone` | `public/assets/ui/combat/drop-zone.png` | Generate | Drag/drop hints need a designed dashed sticker surface. |

## Deferred Assets

| Candidate | Decision |
| --- | --- |
| `side-tab-left.png` | Defer unless implementation needs it; player panel covers the left identity role. |
| `side-tab-right.png` | Defer unless ticker panel needs drawer accent; `combatTickerPanel` covers the right battle log role. |

## Review Rules

- Generated assets must not include readable gameplay text.
- Dynamic labels such as HP, energy, block, turn, and end turn must remain Phaser text.
- Assets must fit the existing modern Japanese street-graffiti chibi sticker direction.
```

- [ ] **Step 2: Update asset specification**

Append this exact section to `docs/assets/asset-spec.md` after the `UI Icons` section and before `Placeholders`:

```md

### Combat UI Surfaces

These assets support the combat scene UI implementation based on `externals/battle-design-proposal-3.png`, with diagonal street energy from `externals/battle-design-proposal-4.png`.

Rules:

- Store final runtime files under `public/assets/ui/combat/`.
- Do not embed gameplay text in the image. HP, energy, block, turn labels, card names, damage, and combat ticker text are Phaser-rendered.
- Use strong sticker silhouettes, thick marker-like linework, grunge street texture, cyan/magenta/yellow accents, and dark readable negative space.
- Transparent panel assets should include only the designed frame/surface and decorative marks.
- The full background must leave enough visual quiet space for enemies, cards, and feedback text.

| File | Key | Size | Transparency | Purpose |
| --- | --- | ---: | --- | --- |
| `public/assets/ui/combat/battle-bg.png` | `combatBattleBg` | 1920x1080 | No | Full combat stage background, street-graffiti wall/floor, no embedded text. |
| `public/assets/ui/combat/player-panel.png` | `combatPlayerPanel` | 420x280 | Yes | Upper-left player HP/energy/block frame. |
| `public/assets/ui/combat/top-resource-frame.png` | `combatTopResourceFrame` | 760x72 | Yes | Top floor/gold/relic/contract tab strip frame. |
| `public/assets/ui/combat/turn-device.png` | `combatTurnDevice` | 360x260 | Yes | Right-bottom end-turn device. |
| `public/assets/ui/combat/combat-ticker-panel.png` | `combatTickerPanel` | 330x430 | Yes | Right combat ticker drawer/panel. |
| `public/assets/ui/combat/enemy-platform.png` | `combatEnemyPlatform` | 320x120 | Yes | Enemy ground platform / sticker base. |
| `public/assets/ui/combat/target-ring.png` | `combatTargetRing` | 320x320 | Yes | Neon selected/hover target ring. |
| `public/assets/ui/combat/hand-tray.png` | `combatHandTray` | 940x230 | Yes | Bottom card tray/rail. |
| `public/assets/ui/combat/drop-zone.png` | `combatDropZone` | 280x210 | Yes | Drag/drop hint surface. |
```

- [ ] **Step 3: Append image-generation prompts**

Append these exact JSONL lines to `docs/assets/image-generation-prompts.jsonl`:

```jsonl
{"output":"public/assets/ui/combat/battle-bg.png","size":"1920x1080","background":"opaque","prompt":"Combat scene background inspired by a modern Japanese street-graffiti card battle arena: dark alley wall and floor, sticker posters, neon cyan/magenta/yellow diagonal energy lines, grungy urban texture, stage-like central space for enemies, readable darker negative space in the lower center for cards, no characters, no UI labels, no readable text, no watermark. Bold digital marker shapes, flat graphic treatment, high contrast, not realistic photography."}
{"output":"public/assets/ui/combat/player-panel.png","size":"420x280","background":"transparent","prompt":"Transparent combat UI player status panel frame, upper-left graffiti sticker surface, asymmetrical black charcoal backing, cyan and magenta marker border, small decorative bolts and shield motifs, no readable text, no numbers, empty interior space for Phaser HP energy block labels, bold street sticker style, crisp edges, no watermark."}
{"output":"public/assets/ui/combat/top-resource-frame.png","size":"760x72","background":"transparent","prompt":"Transparent top resource strip frame made of four connected street-graffiti sticker tabs, black backing with cyan magenta yellow accents, empty centers for Phaser floor gold relic contract labels, no readable text, no icons except abstract decorative sticker marks, bold marker linework, crisp edges."}
{"output":"public/assets/ui/combat/turn-device.png","size":"360x260","background":"transparent","prompt":"Transparent right-bottom end turn device for a card battle game, chunky graffiti arcade-machine panel, cyan main button surface, yellow and magenta sticker burst frame, empty center for Phaser end-turn text, small empty slots for turn and energy pips, no readable text, no numbers, bold marker linework, flat graphic color, crisp silhouette."}
{"output":"public/assets/ui/combat/combat-ticker-panel.png","size":"330x430","background":"transparent","prompt":"Transparent right-side combat ticker drawer panel, tall yellow-and-black graffiti sticker slab with cyan/magenta scuffs, empty dark interior for Phaser combat messages, no readable text, no numbers, bold marker border, street poster texture, crisp silhouette."}
{"output":"public/assets/ui/combat/enemy-platform.png","size":"320x120","background":"transparent","prompt":"Transparent enemy ground platform sticker, oval neon magenta and cyan rings with rough graffiti scuffs, dark shadow center, designed to sit under chibi enemy sprites, no text, no characters, crisp bold marker edges, flat graphic colors."}
{"output":"public/assets/ui/combat/target-ring.png","size":"320x320","background":"transparent","prompt":"Transparent selected target ring, neon cyan and magenta circular graffiti reticle with small sticker arrows and marker ticks, empty center, no text, no numbers, high contrast, crisp edges, designed as Phaser overlay around enemy sprite."}
{"output":"public/assets/ui/combat/hand-tray.png","size":"940x230","background":"transparent","prompt":"Transparent bottom hand card tray, wide grungy street-graffiti rail with cyan/magenta/yellow sticker edges, dark backing behind cards, diagonal speed-line accents, no readable text, no card art, no characters, crisp bold marker linework."}
{"output":"public/assets/ui/combat/drop-zone.png","size":"280x210","background":"transparent","prompt":"Transparent drag and drop zone hint, dashed sticker rectangle with cyan and magenta rough marker border, subtle dark translucent center, plus-like abstract target mark, no readable text, no numbers, crisp graphic edges."}
```

- [ ] **Step 4: Verify docs contain all combat slots**

Run:

```bash
for key in combatBattleBg combatPlayerPanel combatTopResourceFrame combatTurnDevice combatTickerPanel combatEnemyPlatform combatTargetRing combatHandTray combatDropZone; do
  rg "$key" docs/assets/asset-spec.md docs/assets/image-generation-prompts.jsonl docs/assets/combat-ui-asset-audit.md >/dev/null || exit 1
done
```

Expected: command exits 0.

- [ ] **Step 5: Commit asset docs**

Run:

```bash
git add docs/assets/asset-spec.md docs/assets/image-generation-prompts.jsonl docs/assets/combat-ui-asset-audit.md
git commit -m "docs: specify combat ui asset pipeline"
```

Expected: commit succeeds.

---

### Task 2: Generate Or Place Combat UI Assets

**Files:**
- Create directory: `public/assets/ui/combat/`
- Create: `public/assets/ui/combat/battle-bg.png`
- Create: `public/assets/ui/combat/player-panel.png`
- Create: `public/assets/ui/combat/top-resource-frame.png`
- Create: `public/assets/ui/combat/turn-device.png`
- Create: `public/assets/ui/combat/combat-ticker-panel.png`
- Create: `public/assets/ui/combat/enemy-platform.png`
- Create: `public/assets/ui/combat/target-ring.png`
- Create: `public/assets/ui/combat/hand-tray.png`
- Create: `public/assets/ui/combat/drop-zone.png`

- [ ] **Step 1: Create asset directory**

Run:

```bash
mkdir -p public/assets/ui/combat
```

Expected: directory exists.

- [ ] **Step 2: Generate or redraw the nine combat UI assets**

Use the project image generation workflow from `docs/assets/image-generation-prompts.jsonl` and generate these exact outputs:

```text
public/assets/ui/combat/battle-bg.png
public/assets/ui/combat/player-panel.png
public/assets/ui/combat/top-resource-frame.png
public/assets/ui/combat/turn-device.png
public/assets/ui/combat/combat-ticker-panel.png
public/assets/ui/combat/enemy-platform.png
public/assets/ui/combat/target-ring.png
public/assets/ui/combat/hand-tray.png
public/assets/ui/combat/drop-zone.png
```

Use the matching JSONL prompt lines added in Task 1. If an asset is hand-redrawn or adapted from `externals/`, it must still satisfy the size/background/no-text constraints in `docs/assets/asset-spec.md`.

Expected: all nine PNG files exist at the exact paths.

- [ ] **Step 3: Verify image dimensions and alpha expectations**

Run:

```bash
sips -g pixelWidth -g pixelHeight public/assets/ui/combat/*.png
```

Expected dimensions:

```text
battle-bg.png: 1920x1080
player-panel.png: 420x280
top-resource-frame.png: 760x72
turn-device.png: 360x260
combat-ticker-panel.png: 330x430
enemy-platform.png: 320x120
target-ring.png: 320x320
hand-tray.png: 940x230
drop-zone.png: 280x210
```

- [ ] **Step 4: Create contact sheet for review**

Run:

```bash
magick montage public/assets/ui/combat/*.png -background '#10141c' -geometry 320x220+18+18 -tile 3x3 output/combat-ui-assets-contact-sheet.png
```

Expected: `output/combat-ui-assets-contact-sheet.png` exists. Open it and visually confirm there is no embedded gameplay text.

- [ ] **Step 5: Commit generated combat UI assets**

Run:

```bash
git add public/assets/ui/combat
git commit -m "assets: add combat scene ui surfaces"
```

Expected: commit succeeds.

---

### Task 3: Register Combat UI Assets In Registry

**Files:**
- Modify: `src/data/assets.json`
- Modify: `src/core/assets/assetRegistry.ts`
- Modify: `tests/core/assetRegistry.test.ts`

- [ ] **Step 1: Write failing registry tests**

Append this test to `tests/core/assetRegistry.test.ts`:

```ts
  it("resolves combat UI assets through typed lookup", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getCombatUiAsset("battleBg")).toEqual({
      key: "ui:combatBattleBg",
      path: "/assets/ui/combat/battle-bg.png"
    });
    expect(registry.getCombatUiAsset("turnDevice")).toEqual({
      key: "ui:combatTurnDevice",
      path: "/assets/ui/combat/turn-device.png"
    });
  });

  it("preloads combat UI assets from asset data", () => {
    const registry = createAssetRegistry(loadGameData());
    const entries = registry.listPreloadEntries();

    expect(entries).toContainEqual({
      key: "ui:combatBattleBg",
      path: "/assets/ui/combat/battle-bg.png"
    });
    expect(entries).toContainEqual({
      key: "ui:combatHandTray",
      path: "/assets/ui/combat/hand-tray.png"
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/core/assetRegistry.test.ts
```

Expected: fail because `getCombatUiAsset` is not defined.

- [ ] **Step 3: Add combat UI asset data**

In `src/data/assets.json`, add these entries inside the existing `"ui"` object after `"intentDebuff"`:

```json
    "combatBattleBg": "ui/combat/battle-bg.png",
    "combatPlayerPanel": "ui/combat/player-panel.png",
    "combatTopResourceFrame": "ui/combat/top-resource-frame.png",
    "combatTurnDevice": "ui/combat/turn-device.png",
    "combatTickerPanel": "ui/combat/combat-ticker-panel.png",
    "combatEnemyPlatform": "ui/combat/enemy-platform.png",
    "combatTargetRing": "ui/combat/target-ring.png",
    "combatHandTray": "ui/combat/hand-tray.png",
    "combatDropZone": "ui/combat/drop-zone.png"
```

Keep valid JSON commas.

- [ ] **Step 4: Add typed combat UI lookup**

In `src/core/assets/assetRegistry.ts`, add this type near `IntentIconType`:

```ts
export type CombatUiAssetKey =
  | "battleBg"
  | "playerPanel"
  | "topResourceFrame"
  | "turnDevice"
  | "tickerPanel"
  | "enemyPlatform"
  | "targetRing"
  | "handTray"
  | "dropZone";
```

Add this method to `AssetRegistry`:

```ts
  getCombatUiAsset(assetKey: CombatUiAssetKey): AssetEntry;
```

Add this mapping near `intentIconKeys`:

```ts
const combatUiAssetKeys: Record<CombatUiAssetKey, keyof GameData["assets"]["ui"]> = {
  battleBg: "combatBattleBg",
  playerPanel: "combatPlayerPanel",
  topResourceFrame: "combatTopResourceFrame",
  turnDevice: "combatTurnDevice",
  tickerPanel: "combatTickerPanel",
  enemyPlatform: "combatEnemyPlatform",
  targetRing: "combatTargetRing",
  handTray: "combatHandTray",
  dropZone: "combatDropZone"
};
```

Add this method inside the returned registry object after `getIntentIcon`:

```ts
    getCombatUiAsset(assetKey) {
      return uiEntry(combatUiAssetKeys[assetKey]);
    },
```

- [ ] **Step 5: Run registry tests**

Run:

```bash
npm test -- tests/core/assetRegistry.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit registry changes**

Run:

```bash
git add src/data/assets.json src/core/assets/assetRegistry.ts tests/core/assetRegistry.test.ts
git commit -m "feat: register combat ui assets"
```

Expected: commit succeeds.

---

### Task 4: Add Combat Layout Helpers

**Files:**
- Create: `src/phaser/ui/CombatSceneView.ts`
- Test: `tests/phaser/combatSceneLayout.test.ts`

- [ ] **Step 1: Write layout tests**

Create `tests/phaser/combatSceneLayout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { combatLayout, handCardPose } from "../../src/phaser/ui/CombatSceneView";

describe("combat scene layout", () => {
  it("keeps primary combat regions inside the 1280x720 viewport", () => {
    const regions = [
      combatLayout.playerPanel,
      combatLayout.topResource,
      combatLayout.battlefield,
      combatLayout.ticker,
      combatLayout.handTray,
      combatLayout.turnDevice
    ];

    for (const region of regions) {
      expect(region.x).toBeGreaterThanOrEqual(0);
      expect(region.y).toBeGreaterThanOrEqual(0);
      expect(region.x + region.w).toBeLessThanOrEqual(1280);
      expect(region.y + region.h).toBeLessThanOrEqual(720);
    }
  });

  it("places five hand cards in a proposal-3 style arc without leaving the hand tray", () => {
    const poses = Array.from({ length: 5 }, (_, index) => handCardPose(index, 5));

    expect(poses.map((pose) => Math.round(pose.rotation * 100) / 100)).toEqual([-0.1, -0.05, 0, 0.05, 0.1]);
    for (const pose of poses) {
      expect(pose.x).toBeGreaterThanOrEqual(combatLayout.handTray.x);
      expect(pose.x + pose.w).toBeLessThanOrEqual(combatLayout.handTray.x + combatLayout.handTray.w);
      expect(pose.y).toBeGreaterThanOrEqual(combatLayout.handTray.y - 20);
      expect(pose.y + pose.h).toBeLessThanOrEqual(720);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/phaser/combatSceneLayout.test.ts
```

Expected: fail because `CombatSceneView.ts` does not exist.

- [ ] **Step 3: Create layout helper module**

Create `src/phaser/ui/CombatSceneView.ts` with:

```ts
import Phaser from "phaser";
import type { AssetRegistry, RunState } from "../../core";
import { bar, image, label } from "./uiPrimitives";
import { colors, HUD_FONT } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export interface RectSpec {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CardPose extends RectSpec {
  rotation: number;
}

export const combatLayout = {
  playerPanel: { x: 24, y: 18, w: 318, h: 178 },
  topResource: { x: 650, y: 18, w: 468, h: 54 },
  battlefield: { x: 250, y: 86, w: 846, h: 422 },
  ticker: { x: 1112, y: 86, w: 148, h: 430 },
  handTray: { x: 252, y: 502, w: 760, h: 206 },
  turnDevice: { x: 1032, y: 532, w: 220, h: 168 },
  deckCounter: { x: 24, y: 612, w: 92, h: 92 },
  discardCounter: { x: 124, y: 624, w: 78, h: 78 }
} satisfies Record<string, RectSpec>;

export function handCardPose(index: number, total: number): CardPose {
  const w = 132;
  const h = 184;
  const clampedTotal = Math.max(1, total);
  const spacing = Math.min(144, combatLayout.handTray.w / clampedTotal);
  const totalWidth = spacing * (clampedTotal - 1) + w;
  const startX = combatLayout.handTray.x + Math.max(0, (combatLayout.handTray.w - totalWidth) / 2);
  const offsetFromCenter = index - (clampedTotal - 1) / 2;
  return {
    x: startX + index * spacing,
    y: combatLayout.handTray.y + 24 + Math.abs(offsetFromCenter) * 4,
    w,
    h,
    rotation: offsetFromCenter * 0.05
  };
}

export function renderCombatBackground(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry) {
  const root = scene.add.container(0, 0);
  const bg = image(scene, context, 640, 360, assets.getCombatUiAsset("battleBg").key, 1280, 720, "combat-ui:background");
  if (bg) root.add(bg);
  root.add(scene.add.rectangle(0, 0, 1280, 720, 0x05070b, 0.22).setOrigin(0));
  return root;
}

export function renderCombatPlayerPanel(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry, run: RunState, vitals: { hp: number; maxHp: number; energy: number; block: number }) {
  const root = scene.add.container(combatLayout.playerPanel.x, combatLayout.playerPanel.y);
  const surface = image(scene, context, 0, 0, assets.getCombatUiAsset("playerPanel").key, combatLayout.playerPanel.w, combatLayout.playerPanel.h, "combat-ui:player-panel");
  if (surface) {
    surface.setOrigin(0);
    root.add(surface);
  }
  root.add(label(scene, 82, 18, "HP", 16, "#ff4f8b"));
  root.add(label(scene, 82, 42, `${vitals.hp}/${vitals.maxHp}`, 22, colors.ink));
  root.add(bar(scene, 82, 74, 210, 12, vitals.hp / vitals.maxHp, colors.red, 0x111827));
  root.add(label(scene, 82, 100, `能量 ${vitals.energy}/3`, 17, colors.cyanText));
  root.add(label(scene, 82, 130, `格擋 ${vitals.block}`, 17, "#9cff72"));
  root.add(label(scene, 250, 130, `牌組 ${run.deck.length}`, 13, colors.muted));
  return root;
}

export function renderCombatTopResource(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry, run: RunState) {
  const root = scene.add.container(combatLayout.topResource.x, combatLayout.topResource.y);
  const surface = image(scene, context, 0, 0, assets.getCombatUiAsset("topResourceFrame").key, combatLayout.topResource.w, combatLayout.topResource.h, "combat-ui:top-resource");
  if (surface) {
    surface.setOrigin(0);
    root.add(surface);
  }
  root.add(label(scene, 22, 15, `F${run.floor || 0}/12`, 18, colors.ink));
  root.add(label(scene, 132, 15, `金幣 ${run.gold}`, 17, colors.gold));
  root.add(label(scene, 292, 15, `遺物 ${run.relics.length}`, 15, colors.purpleText));
  root.add(label(scene, 398, 15, `契約 ${run.activeContracts.length ? run.activeContracts.length : "無"}`, 15, colors.ink));
  return root;
}

export function renderCombatTurnDevice(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry, turn: number, energy: number) {
  const root = scene.add.container(combatLayout.turnDevice.x, combatLayout.turnDevice.y);
  const surface = image(scene, context, 0, 0, assets.getCombatUiAsset("turnDevice").key, combatLayout.turnDevice.w, combatLayout.turnDevice.h, "combat-ui:turn-device");
  if (surface) {
    surface.setOrigin(0);
    root.add(surface);
  }
  root.add(label(scene, 42, 22, `回合 ${turn}`, 17, colors.ink));
  root.add(label(scene, 42, 50, `能量 ${energy}/3`, 16, colors.cyanText));
  return root;
}

export function renderCombatTickerSurface(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry) {
  const root = scene.add.container(combatLayout.ticker.x, combatLayout.ticker.y);
  const surface = image(scene, context, 0, 0, assets.getCombatUiAsset("tickerPanel").key, combatLayout.ticker.w, combatLayout.ticker.h, "combat-ui:ticker-panel");
  if (surface) {
    surface.setOrigin(0);
    root.add(surface);
  }
  root.add(label(scene, 20, 24, "戰況", 18, colors.ink));
  return root;
}

export function renderCombatHandTray(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry) {
  const root = scene.add.container(combatLayout.handTray.x, combatLayout.handTray.y);
  const surface = image(scene, context, 0, 0, assets.getCombatUiAsset("handTray").key, combatLayout.handTray.w, combatLayout.handTray.h, "combat-ui:hand-tray");
  if (surface) {
    surface.setOrigin(0);
    root.add(surface);
  }
  root.add(label(scene, 12, 12, "手牌", 18, colors.ink));
  return root;
}

export function combatText(scene: Phaser.Scene, x: number, y: number, text: string, size: number, color = colors.ink) {
  return scene.add.text(x, y, text, {
    color,
    fontFamily: HUD_FONT,
    fontSize: `${size}px`,
    fontStyle: size >= 18 ? "800" : "650"
  });
}
```

- [ ] **Step 4: Run layout tests**

Run:

```bash
npm test -- tests/phaser/combatSceneLayout.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit layout helper**

Run:

```bash
git add src/phaser/ui/CombatSceneView.ts tests/phaser/combatSceneLayout.test.ts
git commit -m "feat: add combat scene layout helpers"
```

Expected: commit succeeds.

---

### Task 5: Integrate Combat Background, HUD, Ticker Surface, And Turn Device

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add E2E expectation for combat UI assets**

In `tests/e2e/fullRunSmoke.mjs`, after the existing combat visible asset assertions:

```js
  assertVisibleAssetRole(current, "combat-ui:background", "combat");
  assertVisibleAssetRole(current, "combat-ui:player-panel", "combat");
  assertVisibleAssetRole(current, "combat-ui:turn-device", "combat");
  assertVisibleAssetRole(current, "combat-ui:ticker-panel", "combat");
  assertVisibleAssetRole(current, "combat-ui:hand-tray", "combat");
```

- [ ] **Step 2: Run E2E to verify it fails**

Run:

```bash
npm run test:e2e
```

Expected: fail because combat UI assets are not rendered yet.

- [ ] **Step 3: Import combat UI helpers**

In `src/scenes/GameScene.ts`, add this import near other UI imports:

```ts
import {
  combatLayout,
  handCardPose,
  renderCombatBackground,
  renderCombatHandTray,
  renderCombatPlayerPanel,
  renderCombatTickerSurface,
  renderCombatTopResource,
  renderCombatTurnDevice
} from "../phaser/ui/CombatSceneView";
```

- [ ] **Step 4: Skip old HUD shell during combat**

In `drawHud()`, replace the body with:

```ts
  private drawHud() {
    if (this.engine.run.mode === "combat") return;
    this.root?.add(renderHudShell(this, this.uiContext(), this.dataModel, this.assets, this.engine.run, this.muted, () => this.toggleMute()));
  }
```

- [ ] **Step 5: Render combat background and top surfaces**

At the start of `drawCombat()` after `const combat = ...`, add:

```ts
    this.root?.add(renderCombatBackground(this, this.uiContext(), this.assets));
    this.root?.add(renderCombatTopResource(this, this.uiContext(), this.assets, this.engine.run));
```

Replace the existing `renderPlayerPanel(...)` block with:

```ts
    const playerPanel = renderCombatPlayerPanel(this, this.uiContext(), this.assets, this.engine.run, {
      hp: combat.player.hp,
      maxHp: combat.player.maxHp,
      energy: combat.player.energy,
      block: combat.player.block
    });
    this.root?.add(playerPanel);
    anchors.player = {
      x: combatLayout.playerPanel.x + combatLayout.playerPanel.w / 2,
      y: combatLayout.playerPanel.y + 110,
      target: playerPanel as FxTarget
    };
```

- [ ] **Step 6: Replace old battlefield/hand/right panel surfaces**

Replace the old battlefield `panel(...)` add with no panel. Set drop zones using `combatLayout`:

```ts
    this.battlefieldDropZone = { x: combatLayout.battlefield.x, y: combatLayout.battlefield.y, w: combatLayout.battlefield.w, h: combatLayout.battlefield.h };
    this.playerDropZone = { x: combatLayout.playerPanel.x, y: combatLayout.playerPanel.y, w: combatLayout.playerPanel.w, h: combatLayout.playerPanel.h };
    this.handDropZone = { x: combatLayout.handTray.x, y: combatLayout.handTray.y, w: combatLayout.handTray.w, h: combatLayout.handTray.h };
```

Replace ticker panel creation:

```ts
    const logPanel = renderCombatTickerSurface(this, this.uiContext(), this.assets);
    this.renderCombatTicker(logPanel);
    this.root?.add(logPanel);
```

Replace hand panel creation:

```ts
    const handPanel = renderCombatHandTray(this, this.uiContext(), this.assets);
    this.root?.add(handPanel);
```

Replace end-turn button coordinates:

```ts
    const turnDevice = renderCombatTurnDevice(this, this.uiContext(), this.assets, combat.turn, combat.player.energy);
    this.root?.add(turnDevice);
    this.button("end-turn", "結束回合", combatLayout.turnDevice.x + 48, combatLayout.turnDevice.y + 92, 142, 54, () => {
      this.beginTurnTransition("manual");
    }, !this.turnTransition && !this.victoryTransition);
```

Move quick `auto-win` to:

```ts
      this.button("auto-win", "測試勝利", combatLayout.turnDevice.x + 64, combatLayout.turnDevice.y + 24, 110, 34, () => {
        autoWinCombat(this.engine);
        this.render();
      }, !this.victoryTransition, 0x39d98a);
```

- [ ] **Step 7: Run build and E2E**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: both pass, and E2E sees `combat-ui:*` visible assets.

- [ ] **Step 8: Commit combat surface integration**

Run:

```bash
git add src/scenes/GameScene.ts tests/e2e/fullRunSmoke.mjs
git commit -m "feat: render combat scene ui surfaces"
```

Expected: commit succeeds.

---

### Task 6: Reposition Enemies, Hand Cards, Drop Zones, And Ticker Rows

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/phaser/ui/EnemyView.ts`
- Modify: `src/phaser/ui/CardView.ts`
- Modify: `src/phaser/ui/CombatSceneView.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add visible asset assertions for enemy platform and target ring**

In `assertDragAttackAutoTargets(page)` in `tests/e2e/fullRunSmoke.mjs`, after dragging the attack card and asserting HP changes, add:

```js
  assert.ok(current.visibleAssets?.some((asset) => asset.role === "combat-ui:enemy-platform"), "combat should render enemy platform assets.");
  assert.ok(current.visibleAssets?.some((asset) => asset.role === "combat-ui:target-ring"), "combat should render target ring assets when targeting or hovering.");
```

- [ ] **Step 2: Run E2E to verify the new target ring/platform assertion fails**

Run:

```bash
npm run test:e2e
```

Expected: fail because enemy platform/target ring assets are not rendered yet.

- [ ] **Step 3: Add enemy slot helper**

Append this helper to `src/phaser/ui/CombatSceneView.ts`:

```ts
export function enemyPose(index: number, total: number) {
  const poses = [
    { x: 462, y: 246 },
    { x: 742, y: 196 },
    { x: 940, y: 330 },
    { x: 560, y: 366 }
  ];
  return poses[index] || {
    x: combatLayout.battlefield.x + 160 + (index % Math.max(1, total)) * 180,
    y: combatLayout.battlefield.y + 180
  };
}
```

- [ ] **Step 4: Update EnemyView to render platform and target ring**

In `src/phaser/ui/EnemyView.ts`, extend `EnemyViewOptions`:

```ts
  platformKey?: string;
  targetRingKey?: string;
```

At the start of `renderEnemyView`, after `const root = scene.add.container(0, 0);`, add:

```ts
  if (options.platformKey && scene.textures.exists(options.platformKey)) {
    const platform = scene.add.image(x, y + 94, options.platformKey).setDisplaySize(220, 82).setAlpha(alive ? 0.92 : 0.36);
    context.visibleAssets.push({ key: options.platformKey, role: "combat-ui:enemy-platform" });
    root.add(platform);
  } else {
    root.add(scene.add.ellipse(x, y + 72, 176, 34, 0x000000, alive ? 0.34 : 0.12));
  }
```

Remove the old unconditional ellipse line:

```ts
  root.add(scene.add.ellipse(x, y + 72, 176, 34, 0x000000, alive ? 0.34 : 0.12));
```

Replace the selected-target rectangle block with:

```ts
  if (selectedTargetEnabled && alive) {
    if (options.targetRingKey && scene.textures.exists(options.targetRingKey)) {
      const ring = scene.add.image(x, y, options.targetRingKey).setDisplaySize(236, 236).setAlpha(0.9);
      context.visibleAssets.push({ key: options.targetRingKey, role: "combat-ui:target-ring" });
      root.addAt(ring, 0);
    } else {
      root.add(scene.add.rectangle(x - 92, y - 92, 184, 244, 0xf4e04d, 0).setOrigin(0).setStrokeStyle(3, 0xf4e04d, 0.85));
    }
  }
```

- [ ] **Step 5: Use proposal-style enemy poses and combat assets in GameScene**

In `GameScene.ts`, add `enemyPose` to the `CombatSceneView` import.

Replace enemy position calculation:

```ts
      const pose = enemyPose(index, combat.enemies.length);
      const x = pose.x;
      const y = pose.y;
```

Pass platform/ring keys to `renderEnemyView`:

```ts
        platformKey: this.assets.getCombatUiAsset("enemyPlatform").key,
        targetRingKey: this.assets.getCombatUiAsset("targetRing").key,
```

Update enemy drop zones:

```ts
      if (isEnemyAlive(enemy)) this.enemyDropZones.set(enemy.instanceId, { id: enemy.instanceId, x: x - 110, y: y - 122, w: 220, h: 260 });
```

- [ ] **Step 6: Apply hand card poses**

Replace current hand card coordinate logic with:

```ts
    hand.forEach((card, index) => {
      const cardDef = this.dataModel.cards.find((item) => item.id === card.cardId)!;
      const pose = handCardPose(index, hand.length);
      const selected = this.selected?.cardInstanceId === card.instanceId;
      const cardView = renderCardView({
        scene: this,
        context: this.uiContext(),
        data: this.dataModel,
        assets: this.assets,
        x: pose.x,
        y: pose.y,
        card: cardDef,
        instance: card,
        selected,
        playable: effectiveCardCost(this.dataModel, card) <= combat.player.energy && !this.victoryTransition,
        mode: "hand"
      });
      cardView.setRotation(pose.rotation);
      this.root?.add(cardView);
      this.registerCardInput(cardView, card.instanceId, pose.x, pose.y, effectiveCardCost(this.dataModel, card) <= combat.player.energy && !this.turnTransition && !this.victoryTransition);
    });
```

Keep hit rectangles unrotated for stability in this backlog. They must remain large enough to click the visible card.

- [ ] **Step 7: Adjust ticker row coordinates for narrow combat ticker panel**

In `renderCombatTicker(logPanel)`, replace row layout with:

```ts
    visibleRows.forEach((row, index) => {
      const y = 62 + index * 42;
      const dot = this.add.circle(22, y + 7, 4, Phaser.Display.Color.HexStringToColor(row.color).color, 0.95);
      const text = label(this, 34, y, row.text, 12, row.color, combatLayout.ticker.w - 48);
      logPanel.add([dot, text]);
    });
```

Also update empty text:

```ts
      logPanel.add(label(this, 20, 64, "等待行動", 13, "#d1d5db", combatLayout.ticker.w - 36));
```

- [ ] **Step 8: Run verification**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: both pass.

- [ ] **Step 9: Commit battlefield and hand layout**

Run:

```bash
git add src/scenes/GameScene.ts src/phaser/ui/EnemyView.ts src/phaser/ui/CardView.ts src/phaser/ui/CombatSceneView.ts tests/e2e/fullRunSmoke.mjs
git commit -m "feat: align combat battlefield and hand layout"
```

Expected: commit succeeds.

---

### Task 7: Visual Polish And Snapshot Support

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add combat UI summary to text snapshot**

In `TextSnapshot`, add:

```ts
  combatUi?: {
    reference: "battle-design-proposal-3";
    assetRoles: string[];
  };
```

In `snapshot()`, add this property after `feedback`:

```ts
      combatUi:
        run.mode === "combat"
          ? {
              reference: "battle-design-proposal-3",
              assetRoles: this.visibleAssets.filter((asset) => asset.role.startsWith("combat-ui:")).map((asset) => asset.role)
            }
          : undefined,
```

- [ ] **Step 2: Add E2E snapshot assertions**

In `tests/e2e/fullRunSmoke.mjs`, after combat UI visible asset assertions, add:

```js
  assert.equal(current.combatUi?.reference, "battle-design-proposal-3");
  for (const role of ["combat-ui:background", "combat-ui:player-panel", "combat-ui:ticker-panel", "combat-ui:hand-tray", "combat-ui:turn-device"]) {
    assert.ok(current.combatUi.assetRoles.includes(role), `combat UI snapshot should include ${role}`);
  }
```

- [ ] **Step 3: Run E2E**

Run:

```bash
npm run test:e2e
```

Expected: pass.

- [ ] **Step 4: Commit snapshot support**

Run:

```bash
git add src/scenes/GameScene.ts tests/e2e/fullRunSmoke.mjs
git commit -m "test: expose combat ui snapshot state"
```

Expected: commit succeeds.

---

### Task 8: Full Automated Verification

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected:

- `npm test`: all tests pass.
- `npm run build`: TypeScript and Vite build pass.
- `npm run test:e2e`: full run smoke passes.

- [ ] **Step 2: Append verification progress**

Append to `progress.md`:

```md
- Combat scene UI automated verification passed:
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
```

- [ ] **Step 3: Commit verification note**

Run:

```bash
git add progress.md
git commit -m "docs: record combat scene ui verification"
```

Expected: commit succeeds.

---

### Task 9: Develop-Web-Game Browser Verification

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Start local dev server**

Run from the worktree:

```bash
npm run dev -- --port 5178
```

Expected: Vite starts at `http://127.0.0.1:5178/`. Keep this terminal/session running until browser verification finishes.

- [ ] **Step 2: Run develop-web-game client**

In another terminal/session, run:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export WEB_GAME_CLIENT="$CODEX_HOME/skills/develop-web-game/scripts/web_game_playwright_client.js"
node "$WEB_GAME_CLIENT" --url "http://127.0.0.1:5178/?e2e=1" --actions-json '{"steps":[{"buttons":["left_mouse_button"],"frames":2,"mouse_x":814,"mouse_y":534},{"buttons":[],"frames":8},{"buttons":["left_mouse_button"],"frames":2,"mouse_x":108,"mouse_y":340},{"buttons":[],"frames":16}]}' --iterations 1 --pause-ms 250 --screenshot-dir output/web-game-combat-scene-ui
```

Expected:

- `output/web-game-combat-scene-ui/shot-0.png` exists.
- `output/web-game-combat-scene-ui/state-0.json` exists.
- No `output/web-game-combat-scene-ui/errors-*.json` files exist.

- [ ] **Step 3: Inspect screenshot and text state**

Open `output/web-game-combat-scene-ui/shot-0.png` visually.

Run:

```bash
cat output/web-game-combat-scene-ui/state-0.json | jq '.mode, .combatUi, .visibleAssets[] | select(.role | startswith("combat-ui:"))'
```

Expected:

- mode is `"combat"`.
- `combatUi.reference` is `"battle-design-proposal-3"`.
- visible assets include background, player panel, ticker panel, hand tray, and turn device.

- [ ] **Step 4: Run manual Playwright interaction script**

Run:

```bash
mkdir -p output/manual-combat-scene-ui
node --input-type=module <<'EOF'
import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const outDir = "output/manual-combat-scene-ui";
const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() }); });
page.on("pageerror", (err) => errors.push({ type: "pageerror", text: String(err) }));

await page.goto("http://127.0.0.1:5178/?e2e=1", { waitUntil: "networkidle" });
await page.waitForFunction(() => typeof window.render_game_to_text === "function");

async function state(name) {
  const parsed = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  if (name) fs.writeFileSync(`${outDir}/${name}.json`, JSON.stringify(parsed, null, 2));
  return parsed;
}

async function shot(name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
}

async function clickButton(id) {
  const current = await state();
  const button = current.buttons.find((item) => item.id === id);
  assert.ok(button, `missing button ${id}`);
  assert.ok(button.enabled, `disabled button ${id}`);
  await page.mouse.click(button.x, button.y);
  await page.waitForTimeout(100);
  return state();
}

async function dragButton(id, x, y) {
  const current = await state();
  const button = current.buttons.find((item) => item.id === id);
  assert.ok(button, `missing button ${id}`);
  assert.ok(button.enabled, `disabled button ${id}`);
  await page.mouse.move(button.x, button.y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.move(x, y, { steps: 10 });
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.waitForTimeout(160);
  return state();
}

let current = await state();
assert.equal(current.mode, "title");
await clickButton("start");
current = await state();
await clickButton(current.buttons.find((button) => button.id.startsWith("map:") && button.enabled).id);
current = await state("combat-start");
assert.equal(current.mode, "combat");
assert.equal(current.combatUi?.reference, "battle-design-proposal-3");
for (const role of ["combat-ui:background", "combat-ui:player-panel", "combat-ui:ticker-panel", "combat-ui:hand-tray", "combat-ui:turn-device"]) {
  assert.ok(current.visibleAssets.some((asset) => asset.role === role), `missing ${role}`);
}
await shot("combat-start");

const attack = current.combat.hand.find((card) => card.type === "attack" && card.cost <= current.combat.energy);
if (attack) {
  const enemyBefore = current.combat.enemies.find((enemy) => enemy.state === "alive");
  current = await dragButton(`card:${attack.id}`, 620, 260);
  const enemyAfter = current.combat.enemies.find((enemy) => enemy.id === enemyBefore.id);
  assert.ok(enemyAfter.hp < enemyBefore.hp, "attack drag should damage an enemy");
  assert.ok(current.feedback.active.some((item) => item.type === "damage"), "attack drag should produce damage feedback");
  await shot("drag-attack");
}

await page.evaluate(() => {
  const scene = window.mnemonicSpireScene;
  const combat = scene.engine.run.currentCombat;
  const strike = combat.cards.find((card) => card.cardId === "strike");
  const enemy = combat.enemies[0];
  combat.enemies = [{ ...enemy, instanceId: "ui-death-target", state: "alive", hp: 4, maxHp: 8, block: 0, statuses: {}, intent: { id: "attack", type: "attack", amount: 6, weight: 1 } }];
  combat.hand = [strike.instanceId];
  combat.player.energy = 3;
  combat.phase = "player";
  scene.turnTransition = undefined;
  scene.victoryTransition = undefined;
  scene.render();
});
current = await state();
const strike = current.combat.hand.find((card) => card.cardId === "strike");
current = await dragButton(`card:${strike.id}`, 620, 260);
assert.equal(current.mode, "combat");
assert.equal(current.combat.phase, "victory");
assert.ok(current.victoryTransition, "death should wait before reward");
assert.ok(current.feedback.center.some((item) => item.type === "death"));
await shot("death-transition");

fs.writeFileSync(`${outDir}/errors.json`, JSON.stringify(errors, null, 2));
assert.deepEqual(errors, []);
await browser.close();
EOF
```

Expected:

- `output/manual-combat-scene-ui/combat-start.png` exists.
- `output/manual-combat-scene-ui/drag-attack.png` exists if an attack card was in hand.
- `output/manual-combat-scene-ui/death-transition.png` exists.
- `output/manual-combat-scene-ui/errors.json` contains `[]`.

- [ ] **Step 5: Append browser verification progress**

Append to `progress.md`:

```md
- develop-web-game verification passed for combat scene UI:
  - `$WEB_GAME_CLIENT` wrote screenshot/state to `output/web-game-combat-scene-ui/`.
  - Manual Playwright wrote screenshots/state to `output/manual-combat-scene-ui/`.
  - Visual review confirmed proposal-3 combat layout, combat UI assets, readable text, intact drag attack, and intact death transition.
  - Console/page errors were empty.
```

- [ ] **Step 6: Stop the dev server**

Stop the `npm run dev -- --port 5178` session.

If it is detached, run:

```bash
lsof -ti tcp:5178 | xargs -r kill
```

- [ ] **Step 7: Commit browser verification note**

Run:

```bash
git add progress.md
git commit -m "docs: record combat scene ui browser verification"
```

Expected: commit succeeds.

---

### Task 10: Complete Backlog And Push Branch

**Files:**
- Move: `backlogs/in-progress/18-combat-scene-ui-implementation-backlog.md` -> `backlogs/done/18-combat-scene-ui-implementation-backlog.md`
- Modify: `progress.md`

- [ ] **Step 1: Move backlog to done**

Run:

```bash
git mv backlogs/in-progress/18-combat-scene-ui-implementation-backlog.md backlogs/done/18-combat-scene-ui-implementation-backlog.md
```

Expected: backlog moves to done.

- [ ] **Step 2: Append completion note**

Append to `progress.md`:

```md
- Completed `18-combat-scene-ui-implementation-backlog.md`.
- Backlog moved to `backlogs/done/18-combat-scene-ui-implementation-backlog.md`.
- Branch is ready for merge after user visual review.
```

- [ ] **Step 3: Final status and commit**

Run:

```bash
git add progress.md backlogs/done/18-combat-scene-ui-implementation-backlog.md
git commit -m "docs: complete combat scene ui implementation backlog"
git status --short
```

Expected: commit succeeds and `git status --short` is empty.

- [ ] **Step 4: Push feature branch**

Run:

```bash
git push -u origin feature/combat-scene-ui-implementation
```

Expected: branch is pushed to GitHub.

---

## Self-Review Checklist

- Spec coverage: Tasks cover asset audit, `docs/assets` updates, generated combat assets, registry lookup, Phaser composition, visible asset state, automated tests, develop-web-game verification, and backlog completion.
- Placeholder scan: no placeholder markers, deferred implementation notes, or unspecified test steps remain.
- Type consistency: plan consistently uses `CombatUiAssetKey`, `getCombatUiAsset(...)`, `combatLayout`, `handCardPose(...)`, `enemyPose(...)`, and `combatUi.reference`.
- Scope check: plan changes only combat UI, asset docs/assets, registry support, and tests; no combat rule changes are included.
