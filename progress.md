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

## 2026-05-07 Combat Player Status Region

- Continuing in `.worktrees/feature-combat-player-status-region` on branch `feature/combat-player-status-region`.
- Current target: implement `docs/superpowers/plans/2026-05-06-combat-player-status-region-plan.md`.
- Per project rules, implementation uses `superpowers:executing-plans` together with `develop-web-game`.
- Accepted visual asset: `public/assets/ui/combat/player-status-base.png`, a 420x240 transparent style-teradadara-like redraw with HP aperture transparent and block/energy plates opaque.
- Starting Task 1: register the player status UI assets through `src/data/assets.json` and the typed asset registry.
- Task 1 red/green complete:
  - Red: `npm test -- tests/core/assetRegistry.test.ts` failed before `combatPlayerStatusBase` and related keys were registered.
  - Green: added player status UI asset keys to `src/data/assets.json` and `src/core/assets/assetRegistry.ts`.
  - Verification: `npm test -- tests/core/assetRegistry.test.ts` passed.
- Task 2 red/green complete:
  - Red: `npm test -- tests/phaser/combatPlayerStatusUi.test.ts` failed before `src/phaser/ui/combatPlayerStatusUi.ts` existed.
  - Green: added `createCombatPlayerStatusUiState()` with HP ratio/state, block/energy, and pile counts.
  - Verification: `npm test -- tests/phaser/combatPlayerStatusUi.test.ts` passed.
- Task 3 complete:
  - `renderCombatPlayerPanel()` now renders `player-status-base.png`, draws HP fill under the transparent aperture, and overlays Phaser text for HP, energy, block, and low-priority pile counts.
  - `GameScene.drawCombat()` now passes `createCombatPlayerStatusUiState(combat)` into the renderer.
  - Verification: `npm run build` passed.

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
- Task 1 complete: added pure combat feedback mapping with coverage for damage, block, memory, draw, death, active expiration, and ticker limit.
- Task 2-5 complete locally:
  - `GameScene` now maps new combat events into `feedbackItems`.
  - `window.render_game_to_text()` exposes `feedback.active`, `feedback.ticker`, and `feedback.center`.
  - The right combat panel now renders a six-row ticker instead of a long raw log.
  - Enemy death shows a center feedback banner during the victory transition.
  - Combat FX now includes block, memory, draw, and death local feedback in addition to damage.
  - E2E asserts enemy damage feedback, player damage feedback, and death feedback.
- Verification so far:
  - Red: `npm test -- tests/phaser/combatFeedback.test.ts` failed before `src/phaser/fx/combatFeedback.ts` existed.
  - Green: `npm test -- tests/phaser/combatFeedback.test.ts` passed.
  - `npm run build` passed.
  - `npm run test:e2e` passed.
- develop-web-game verification:
  - Started Vite from this worktree on `http://127.0.0.1:5176/?e2e=1`.
  - Ran `$WEB_GAME_CLIENT`; screenshot/state written to `output/web-game-combat-feedback-readability/` with no error files.
  - Manual Playwright scenarios wrote screenshots/state to `output/manual-combat-feedback-readability/`.
  - Confirmed screenshot coverage for draw-on-combat-start, enemy damage, player block, memory, and enemy death center feedback.
  - Manual state checks confirmed `feedback.active`, `feedback.ticker`, `feedback.center`, `victoryTransition`, and no console/page errors.
  - Adjusted player block float position after screenshot review so it no longer overlaps the energy/block badges.
- Final verification passed:
  - `npm test`: 11 files / 52 tests passed.
  - `npm run build` passed.
  - `npm run test:e2e` passed.
- Task complete: moved `03-combat-feedback-readability-backlog.md` from `backlogs/in-progress/` to `backlogs/done/`.

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

## 2026-05-06 Combat Region Backlog Split

- Opened independent backlog items for the temporary black translucent combat regions:
  - `19-combat-player-status-region-backlog.md`
  - `20-combat-progress-status-region-backlog.md`
  - `21-combat-ticker-region-backlog.md`
  - `22-combat-turn-action-region-backlog.md`
  - `23-combat-hand-region-backlog.md`
- Opened additional backlog items for:
  - `24-combat-enemy-arena-region-backlog.md`
  - `25-game-settings-audio-entry-backlog.md`
- Updated `backlogs/00-index-backlog.md` so these region-focused UI backlogs are scheduled after `18-combat-scene-ui-implementation-backlog.md` and before the next gameplay-flow backlogs.

## 2026-05-06 Combat Scene UI Implementation

- Continuing in `.worktrees/combat-scene-ui-implementation` on branch `feature/combat-scene-ui-implementation`.
- Goal: implement `docs/superpowers/specs/2026-05-06-combat-scene-ui-implementation-design.md`.
- Primary visual reference: `externals/battle-design-proposal-3.png`.
- Secondary visual reference: `externals/battle-design-proposal-4.png`.
- Required strategy: first audit/update combat UI assets and `docs/assets`, then implement Phaser combat UI.
- User explicitly limited this pass to plan Task 1-2 only: asset audit/docs and combat UI asset image creation.
- Use `imagegen` according to the written asset specifications for generated UI assets.
- Task 0 complete: moved backlog 18 into `backlogs/in-progress/` and committed the state transition.
- Task 1 complete: added `docs/assets/combat-ui-asset-audit.md`, combat UI surface specs, and nine image-generation prompt entries.
- Task 2 complete: created nine runtime combat UI PNGs under `public/assets/ui/combat/`.
- Generation note: local `magick` was unavailable, so the contact sheet was generated with Pillow at `output/combat-ui-assets-contact-sheet.png`.
- Verification:
  - `sips -g pixelWidth -g pixelHeight public/assets/ui/combat/*.png` confirmed the expected image sizes.
  - Pillow alpha validation confirmed `battle-bg.png` is opaque and the eight panel/overlay assets have transparent corners and non-empty alpha.
  - Contact sheet visual review confirmed the assets contain no embedded gameplay text.
- Stopping here by user request; Task 3 asset registry and Phaser UI implementation are intentionally not started.
- User approved regenerating the nine combat UI PNGs with the `style-teradadara-like` direction.
- Regeneration constraints:
  - Use `externals/battle-design-proposal-3.png` and `externals/battle-design-proposal-4.png` as references only, not as source images to copy.
  - Preserve exact runtime filenames, dimensions, and transparency requirements.
  - Keep all gameplay text dynamic in Phaser; generated images must not include readable gameplay labels.
- After regeneration, continue executing the plan from Task 3 through completion with `superpowers:executing-plans` plus `develop-web-game`.
- Task 3 complete: registered combat UI assets in `src/data/assets.json` and `createAssetRegistry().getCombatUiAsset(...)`.
- Task 4 complete: added combat scene layout helpers and layout tests.
- Task 5 complete: rendered combat background, player panel, top resource frame, ticker surface, hand tray, and turn device.
- Task 6 complete: added enemy platform, target ring, proposal-style enemy poses, hand card arc placement, and narrow ticker rows.
- Task 7 complete: `window.render_game_to_text()` now exposes `combatUi.reference` and combat UI asset roles.
- Combat scene UI automated verification passed:
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
- develop-web-game verification passed for combat scene UI:
  - `$WEB_GAME_CLIENT` wrote screenshot/state to `output/web-game-combat-scene-ui/`.
  - Manual Playwright wrote screenshots/state to `output/manual-combat-scene-ui/`.
  - Visual review confirmed proposal-3 combat layout direction, regenerated combat UI assets, readable dynamic text, intact drag attack, and intact death transition.
  - Console/page errors were empty.
- Completed `18-combat-scene-ui-implementation-backlog.md`.
- Backlog moved to `backlogs/done/18-combat-scene-ui-implementation-backlog.md`.
- Branch is ready for merge after user visual review.
- User rejected the regenerated combat background as too visually noisy.
- Replaced only `public/assets/ui/combat/battle-bg.png` with a proposal-1-inspired dark street corridor background:
  - Cleaner central combat stage.
  - Subdued side graffiti.
  - Dark lower card readability zone.
  - No crowded mascot sticker collage in the playable field.
- Updated `docs/assets/image-generation-prompts.jsonl` and `docs/assets/combat-ui-asset-audit.md` so future regeneration keeps the quieter proposal-1 background direction.
- User requested the next generation session use proposal-1 as the primary reference and recreate the same background plate. Updated the `battle-bg.png` JSONL prompt to reference `externals/battle-design-proposal-1.png` directly and remove gameplay UI/enemies/cards/text from the generated background.
- Regenerated `public/assets/ui/combat/battle-bg.png` with the built-in `imagegen` workflow using the `docs/assets/image-generation-prompts.jsonl` battle background prompt and `externals/battle-design-proposal-1.png` as the visible reference.
- Verified regenerated background:
  - Resized/saved runtime asset to 1920x1080 opaque PNG.
  - Manual Playwright screenshot written to `output/manual-imagegen-battle-bg/combat.png`.
  - Manual state confirmed `combat-ui:background` is visible and console/page errors were empty.
- User requested simplifying combat panel surfaces:
  - Player status, progress status, battle ticker, turn actions, and hand tray now use black translucent Phaser rectangles instead of UI surface image assets.
  - `測試勝利` quick test button moved to the lower-left corner.
- Rewrote `docs/superpowers/specs/2026-05-06-combat-scene-ui-implementation-design.md` and `docs/superpowers/plans/2026-05-06-combat-scene-ui-implementation-plan.md` to match the simplified combat UI direction:
  - proposal-1 background as the primary background reference.
  - no generated UI surface assets for player status, progress status, battle ticker, turn actions, or hand area.
  - black translucent Phaser regions for those five areas.
  - Codex in-app browser verification requirement.

## 2026-05-06 Combat Enemy Arena Region

- Continuing in `.worktrees/combat-enemy-arena-region` on branch `feature/combat-enemy-arena-region`.
- Goal: implement `docs/superpowers/specs/2026-05-06-combat-enemy-arena-region-design.md`.
- Direction: core enemy gameplay state stays `alive | dead`; Phaser owns presentation state `alive | dying | dead`.
- Victory/reward must wait for all enemy death presentation transitions to complete.
- Task 1 complete:
  - Added pure `src/phaser/combat/enemyPresentationState.ts`.
  - Added Vitest coverage for newly dead enemies entering `dying`, due transitions becoming `dead`, stale dead enemies staying dead, new combat reset, and quick-mode duration.
  - Verified with `npm test -- tests/phaser/enemyPresentationState.test.ts`.
- Task 2-5 complete:
  - `EnemyView` now renders enemies from Phaser presentation state and disables target interaction for non-alive presentation states.
  - `GameScene` now owns `enemyPresentationStates`, reconciles new deaths during combat render, and gates `completeCurrentCombat()` until death presentation transitions finish.
  - `window.render_game_to_text()` exposes `combatEnemyArena` and each enemy's `gameplayState` / `presentationState`.
  - Quick E2E death presentation duration is 250ms so tests can observe the `dying` state without slowing the run.
  - Verified targeted tests, build, and `npm run test:e2e`.
- develop-web-game / Codex in-app browser verification passed for combat enemy arena:
  - `$WEB_GAME_CLIENT` wrote title screenshots/state to `output/web-game-combat-enemy-arena/`.
  - Manual Playwright wrote death-transition screenshots/state to `output/manual-combat-enemy-arena/`.
  - Enemy death enters `dying` presentation state.
  - Dead/dying enemies are not targetable.
  - Reward waits for enemy death presentation completion.
  - `window.render_game_to_text()` exposes `combatEnemyArena`.
  - Console/page errors were empty in the manual death-transition scenario.
- Final verification passed for combat enemy arena:
  - `npm test`: 13 files / 61 tests passed.
  - `npm run build` passed.
  - `npm run test:e2e` passed.
- Completed `24-combat-enemy-arena-region-backlog.md` and moved it to `backlogs/done/`.
