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
- Task 3 complete locally: added Phaser combat FX helpers for flash, shake, floating text, camera shake, and death fade.
- Verification: `npm run build` passed.
- Task 4 complete locally: `GameScene` now consumes new combat events once per combat id, tracks player/enemy render anchors, and plays damage/player feedback FX after combat render.
- Verification: `npm run build` and `npm run test:e2e` passed.
- Task 5 complete locally: added `screenFx` and staggered reward card entry animation while preserving immediate reward button descriptors.
- Verification: `npm run build` and `npm run test:e2e` passed.
- Task 6 verification so far:
  - `npm test`, `npm run build`, and `npm run test:e2e` passed.
  - Started worktree dev server on `http://127.0.0.1:5175/`.
  - Ran develop-web-game Playwright client against `http://127.0.0.1:5175/?e2e=1`; screenshots and text state were written to `output/web-game-game-feel/` with no error files.
  - Manual Playwright screenshots written to `output/manual-review-game-feel/`.
  - Visual review confirmed enemy damage float text, player HP panel changing to 66/72 after enemy damage, `-6 HP` float text, and reward card stagger entry.

## 2026-05-06 Block Fix

- User reported block was ineffective during combat.
- Root cause: `endPlayerTurn()` cleared `combat.player.block` before `resolveEnemyTurn()`, so enemy attacks never saw player block.
- Added core regression test: playing `guard` against a fixed 6-damage enemy intent should leave player HP at 71 from 72.
- Fix: keep block during enemy turn, then clear block after enemy turn before `startPlayerTurn()`.
- Verification:
  - `npm test -- tests/core/combatEngine.test.ts` passed.
  - `npm test` passed: 8 files / 30 tests.
  - `npm run build` passed.
  - `npm run test:e2e` passed.
  - develop-web-game client run wrote screenshots/state to `output/web-game-block-fix/`.
  - Manual Playwright block scenario confirmed 5 block reduces 6 incoming damage to 1; screenshot/report in `output/manual-review-block-fix/`.

## 2026-05-06 Combat Atmosphere Music

- User confirmed `public/assets/externals/Corrupted Buffer.wav` is intended as combat atmosphere music.
- Converted it to `public/assets/audio/bgm/combat-loop.ogg` using Ogg Vorbis, stereo, 44.1kHz.
- Added `combatBgm` to `src/data/assets.json` so it is preloaded through the asset registry.
- Updated `docs/assets/audio-sources.md` with source metadata, conversion command, technical check, and Suno rights caveat.
- Added music state to `window.render_game_to_text()` and switched runtime music by mode:
  - combat uses `audio:combatBgm`
  - non-combat uses `audio:bgm`
- TDD checks:
  - Red: `tests/core/assetRegistry.test.ts` failed before `combatBgm` was added.
  - Red: `npm run test:e2e` failed before snapshot/runtime music exposed `audio:combatBgm`.
  - Green: targeted asset registry test and E2E passed after implementation.

## 2026-05-06 Drag Drop Card Play

- Implemented drag/drop card play for combat while preserving click fallback.
- Added auto enemy targeting for attack cards dropped on battlefield.
- Added no-playable-card auto end-turn transition messaging.
- Added distinct combat interaction audio cue keys.
- Verified with npm tests, build, E2E, and develop-web-game screenshot/state inspection.
- develop-web-game client wrote artifacts to `output/web-game-drag-drop-card-play/`; no `errors-*.json` files were produced.

## 2026-05-06 Enemy Lifecycle State

- User reported defeated enemies could visually return from semi-transparent dead presentation to a solid alive-looking sprite after the next turn.
- Root cause: enemy life/death was inferred from `hp > 0` in multiple places, while death visuals were only a transient Phaser tween on the current render object.
- Added enemy lifecycle state (`alive` / `dead`) and helper functions for state-based targeting, enemy action, death transition, and victory checks.
- Updated Phaser enemy rendering so dead enemies persist as semi-transparent, show `已擊倒`, hide intent, and do not register active enemy drop zones.
- Updated `window.render_game_to_text()` enemy payloads to include `state`.
- Added deferred victory presentation:
  - `playRunCard` / `endRunTurn` can now leave a victorious combat open with `completeVictory: false`.
  - Phaser starts a 1000ms `victoryTransition` after the final enemy death.
  - `completeCurrentCombat()` is called only after the death presentation finishes.
  - Death fade duration is now 1000ms.
  - Hand cards, end turn, enemy targeting, and quick `auto-win` shortcut are disabled during the victory presentation.
- Verification:
  - Red tests confirmed missing death state, dead enemies acting when HP was stale, and auto-targeting dead-state enemies.
  - Red test confirmed victory card play completed combat immediately before deferred completion support.
  - Green tests passed after implementation.
  - `npm test`, `npm run build`, and `npm run test:e2e` passed.
  - develop-web-game client wrote screenshots/state to `output/web-game-enemy-state-start/` with no error files.
  - Manual Playwright enemy lifecycle scenario wrote artifacts to `output/manual-enemy-state/`; it confirmed one dead enemy stays dead/transparent across turn advance while the living enemy still acts.
  - develop-web-game client wrote screenshots/state to `output/web-game-victory-transition/` with no error files.
  - Manual Playwright victory transition scenario wrote artifacts to `output/manual-victory-transition/`; it confirmed immediate and 500ms states remain `combat` with `victoryTransition`, then reach `reward` after the 1000ms presentation.

## 2026-05-06 Card Art Fit

- User reported hand card images were distorted and should follow the card asset specification.
- Root cause: card assets are vertical 1024x1536 images, but `CardView` rendered them with `setDisplaySize()` into a short horizontal art strip.
- Added `coverCrop()` / `coverFrame()` layout helpers and tests to preserve source aspect ratio.
- Updated card rendering to use vertical card art as the card background with cropped cover placement and translucent text panels, instead of stretching the image.
- Verification:
  - Red test failed before `imageLayout` existed.
  - `npm test -- tests/phaser/imageLayout.test.ts` passed after implementation.
  - `npm test`, `npm run build`, and `npm run test:e2e` passed.
  - develop-web-game client wrote screenshots/state to `output/web-game-card-art-fit/` with no error files.
  - Manual Playwright combat screenshot in `output/manual-card-art-fit/combat.png` confirmed hand cards use upright card art assets without horizontal distortion.

## 2026-05-06 Combat Feedback Readability

- Continuing in `.worktrees/combat-feedback-readability` on branch `feature/combat-feedback-readability`.
- User chose Inline Execution for `docs/superpowers/plans/2026-05-06-combat-feedback-readability-plan.md`.
- Per project rules, implementation uses `superpowers:executing-plans` together with `develop-web-game`.
- Task 0 complete: moved `03-combat-feedback-readability-backlog.md` into `backlogs/in-progress/` and committed the backlog state transition.

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
