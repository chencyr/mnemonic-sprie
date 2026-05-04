# Phaser Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current rune demo with a playable Phaser UI for the core card game.

**Architecture:** Phaser scenes render snapshots from `src/core` and dispatch core commands. Phaser code stays in `src/scenes/` and `src/phaser/`; game rules remain in `src/core/`.

**Tech Stack:** Phaser 3 Canvas renderer, TypeScript, public assets, existing core modules.

---

## Files

- Replace: `src/main.ts`
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/GameScene.ts`
- Create: `src/phaser/assets/preloadAssets.ts`
- Create: `src/phaser/ui/CardView.ts`
- Create: `src/phaser/ui/EnemyView.ts`
- Create: `src/phaser/ui/HudView.ts`
- Create: `src/phaser/ui/MapView.ts`
- Create: `src/phaser/ui/RewardView.ts`
- Create: `src/phaser/ui/ShopView.ts`
- Create: `src/phaser/ui/EventView.ts`
- Modify: `src/style.css`
- Create: `tests/e2e/basicFlow.test.ts`

## Tasks

### Task 1: Boot And Asset Preload

- [ ] Load `loadGameData()` and `createAssetRegistry()`.
- [ ] Preload all registry entries.
- [ ] Show a start screen using player and card assets.
- [ ] Commit: `feat: add Phaser boot scene`.

### Task 2: Combat UI

- [ ] Render player, enemies, hand, energy, HP, block, draw/discard counts, intents.
- [ ] Click card, then click target or confirm.
- [ ] Play card commands update core state and visual state.
- [ ] Commit: `feat: add Phaser combat UI`.

### Task 3: Map, Reward, Shop, Rest, Event UI

- [ ] Render map nodes and reachable links.
- [ ] Render combat reward choices.
- [ ] Render shop buy/remove actions.
- [ ] Render rest heal/mutate actions.
- [ ] Render event options and contracts.
- [ ] Commit: `feat: add run loop UI screens`.

### Task 4: Audio And Test Hooks

- [ ] Play SFX for card played, damage, memory gained, mutation, victory, failure.
- [ ] Start/stop BGM with mute control.
- [ ] Implement `window.render_game_to_text()` from current core snapshot.
- [ ] Implement `window.advanceTime(ms)` for deterministic Phaser stepping.
- [ ] Commit: `feat: wire audio and browser test hooks`.

### Task 5: Verification

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start dev server and inspect in browser.
