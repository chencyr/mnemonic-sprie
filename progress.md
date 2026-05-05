Original prompt: 初始化這個專案 git 準備一個遊戲開發

## 2026-05-05

- Initialized a Vite + TypeScript canvas game scaffold.
- Added deterministic test hooks expected by the web game workflow:
  - `window.render_game_to_text()`
  - `window.advanceTime(ms)`
- Added basic keyboard movement, collectible rune nodes, score state, and fullscreen toggle.
- Fixed initial strict TypeScript issues found by `npm run build`.
- Verified build and canvas gameplay with the web game Playwright client.
- Confirmed movement updates text state and collecting rune 2 increments score to 1.
- Replaced the handwritten Canvas loop with a Phaser 3 + TypeScript + Vite setup after user clarified the preferred architecture.
- Added `vite.config.ts` with Phaser chunk handling.
- Pinned `phaser` to the Phaser 3 line (`^3.90.0`) after initially catching that the unqualified package install resolved to Phaser 4.
- Forced Phaser to use the Canvas renderer so headless screenshot verification captures the scene reliably.
- Verified Phaser 3 build and Playwright screenshot/state capture; collecting rune 2 increments score to 1.

## TODO

- Decide the actual core game loop and memory mechanic for Mnemonic Spire.
- Add focused gameplay tests once the first real feature is implemented.
- Add asset pipeline conventions when art/audio direction is chosen.

## 2026-05-06 Phaser Game Feel

- Continuing in `.worktrees/phaser-game-feel` on branch `feature/phaser-game-feel`.
- User chose Inline Execution and explicitly requested `develop-web-game` + `superpowers:executing-plans`.
- Current goal: implement `docs/superpowers/plans/2026-05-06-phaser-game-feel-plan.md`.
- Priority behavior: combat feedback first, including fixing combat-time player HP display from `combat.player.hp`.
- Task 1 complete locally: added `consumeNewCombatEvents` pure helper and Vitest coverage for new combat reset, appended events, and truncated event recovery.
- Verification: `npm test -- tests/phaser/combatEventDiff.test.ts` passed.
- Task 2 complete locally: E2E now asserts `combat.playerHp/playerMaxHp`; `renderPlayerPanel` uses combat HP during combat and snapshot exposes player HP/block plus structured event payloads.
- Verification: `npm run test:e2e` and `npm test` passed.

## 2026-05-05 MVP Implementation

- Six implementation plans are now committed on main and execution continues in `.worktrees/mvp-e2e` on branch `feature/mvp-e2e`.
- Current target: complete the Phaser 3 + TypeScript + Vite MVP, then run self-designed E2E plus exploratory browser testing and fix issues until the core flow is playable.
- Test strategy: verify deterministic text state through `window.render_game_to_text()`, drive clicks through browser tests, inspect screenshots, and run boundary/exploratory paths around combat, rewards, events, rest, shop, mutation, Boss, win, and failure states.
- Implemented pure TypeScript core systems for combat, run loop, card memory/mutation, contracts, relics, and Boss habit countermeasures.
- Replaced the Phaser rune demo with the playable MVP screens: title, map, combat, reward, rest, shop, event, victory, and defeat.
- Added `npm run test:e2e`, which starts Vite, drives the browser through a full 12-floor quick-run, and asserts the exploratory coverage boundaries: combat card play, mutation, contract/event, shop decision, Boss, and victory.
- E2E found and fixed one asset mapping bug: `placeholder.character` now points to `characters/seeker.png`.
- Visual screenshot review found and fixed title overlap, overly dark card art, hard-to-read disabled map text, and overlapping reward descriptions.
- Latest verification passed: `npm test`, `npm run build`, and `npm run test:e2e`.
