# Combat Scene UI Implementation Design

## Background

`18-combat-scene-ui-implementation-backlog.md` is the backlog for making the Phaser combat scene feel like an actual card battle screen instead of an engineering/debug panel layout.

The scene already supports the core combat interactions:

- click play
- drag play
- auto targeting
- enemy lifecycle state
- delayed victory presentation
- combat feedback ticker/center feedback
- `window.render_game_to_text()` test observability

The remaining issue is visual hierarchy. Earlier implementation attempts used generated UI surface images for multiple panels, but that made the screen noisy and visually inconsistent. The confirmed correction is to reduce UI surface noise and let the background, cards, enemies, and dynamic text carry the scene.

## Confirmed Direction

Use `externals/battle-design-proposal-1.png` as the primary visual reference for the combat background only.

The runtime background should be a clean background plate:

- dark street corridor
- central road perspective
- distant urban depth
- low-contrast asphalt texture
- side-wall graffiti and edge neon accents
- dark lower readability zone for cards
- no embedded gameplay UI
- no enemies
- no cards
- no readable text, numbers, labels, or icons

The status/progress/ticker/action/hand UI regions should not use generated UI surface images. They should be Phaser-rendered black translucent rectangles with dynamic text and bars on top.

## Alternatives Considered

### Proposal 3 With Generated UI Surface Assets

This was originally selected because it included recognizable combat UI zones: player status, top resources, right ticker, bottom hand, and a prominent turn device. In implementation, however, generated surface assets for these zones added too much visual noise and competed with cards, enemies, and the background.

Decision: rejected for the current MVP UI pass.

### Full Style-Teradadara-Like UI Surfaces

This direction fits character and card art better than utility UI. Applying character-sticker energy to player status, ticker, turn device, and hand tray made the whole screen too busy.

Decision: do not use this style for structural UI surfaces.

### Proposal 1 Background Plus Minimal Phaser Panels

This keeps the proposal-1 dark street mood while preserving readability. It reduces generated UI dependency to the background and a small number of gameplay overlays such as the enemy platform.

Decision: confirmed.

## Design Goals

- Make the combat screen readable first.
- Use `battle-design-proposal-1.png` as the visual direction for the background.
- Keep gameplay UI text, numbers, bars, buttons, combat log, and status values fully dynamic in Phaser.
- Avoid generated panel/surface assets for:
  - player status
  - progress status
  - combat ticker
  - turn action area
  - hand area
- Preserve current combat behavior, drag/drop behavior, feedback, audio hooks, and test observability.
- Keep the implementation small and reversible by concentrating layout helpers in `src/phaser/ui/CombatSceneView.ts`.

## Non-Goals

- Do not redesign map, reward, rest, shop, event, title, victory, or defeat screens.
- Do not change combat rules or balance.
- Do not make the combat background a full screenshot with embedded UI.
- Do not embed gameplay labels, card names, enemy names, HP values, or button text inside images.
- Do not use generated panel art for the five main combat UI regions listed above.
- Do not remove card art, enemy sprites, intent icons, memory stickers, or enemy platform assets.
- Do not render hand tray surface blocks or target selection frames; keep their interaction zones invisible.

## Asset Strategy

All image generation must follow `docs/assets/image-generation-prompts.jsonl`.

### Runtime Image Assets

| Runtime Use | Asset | Decision |
| --- | --- | --- |
| Combat background | `public/assets/ui/combat/battle-bg.png` | Use imagegen, based on `externals/battle-design-proposal-1.png`; runtime background only. |
| Enemy platform | `public/assets/ui/combat/enemy-platform.png` | Keep as optional enemy grounding visual. |
| Target ring | `public/assets/ui/combat/target-ring.png` | Keep file available, but do not render at runtime; targeting uses invisible interaction zones. |
| Player status panel | `public/assets/ui/combat/player-panel.png` | Do not use at runtime. |
| Top resource frame | `public/assets/ui/combat/top-resource-frame.png` | Do not use at runtime. |
| Turn device | `public/assets/ui/combat/turn-device.png` | Do not use at runtime. |
| Combat ticker panel | `public/assets/ui/combat/combat-ticker-panel.png` | Do not use at runtime. |
| Hand tray | `public/assets/ui/combat/hand-tray.png` | Do not use at runtime. |

The unused UI surface files may remain in the repository for now, but runtime code must not render them for the five main UI regions.

### Reused Existing Assets

- Player character: `public/assets/characters/seeker.png`
- Enemy sprites: `public/assets/enemies/*`
- Card art: `public/assets/cards/*`
- Intent icons: `public/assets/ui/intents/*`
- Memory stickers: `public/assets/stickers/*`
- Relic icon: `public/assets/relics/broken_notes.png`

## Combat Layout

### Background

The background is a single 1920x1080 opaque PNG rendered behind the combat scene through the asset registry. It should be scaled to the 1280x720 Phaser viewport.

The background must remain visually quiet in the central battlefield and lower card area.

### Player Status

The player status area sits in the upper-left. It uses a black translucent Phaser rectangle, not a generated UI image.

Dynamic Phaser content:

- HP label and value
- HP bar
- energy value
- block value
- deck count if space allows

### Progress Status

The progress/top resource status sits in the upper-right. It uses a black translucent Phaser rectangle, not a generated UI image.

Dynamic Phaser content:

- floor
- gold
- relic count
- active contract count / none

### Battlefield And Enemies

Enemies remain Phaser-composed sprites. Enemy sprites may use:

- enemy platform asset
- target ring asset when selecting/targeting
- dynamic HP, block, intent, and dead-state text

Dead enemies remain visually dead and cannot be targeted or act.

### Combat Ticker

The right-side battle ticker uses a black translucent Phaser rectangle.

It renders dynamic feedback rows from the existing feedback model:

- damage
- block
- memory
- draw
- turn/system messages
- death messages

### Hand Area

The bottom hand area uses a black translucent Phaser rectangle.

Cards remain Phaser-composed card views with their own card art. Card art must not distort. Click and drag hit areas must remain reliable even with card offsets/rotation.

### Turn Action Area

The right-bottom turn action area uses a black translucent Phaser rectangle.

Dynamic Phaser content:

- turn number
- energy state
- end turn button

The `測試勝利` quick test button remains available only in `?e2e=1`, but it is moved to the lower-left so it does not visually compete with the normal turn action area.

## Data And Code Boundaries

Core combat logic should not change.

Expected runtime architecture:

- `src/data/assets.json` may keep combat UI asset paths for background/platform/ring and compatibility.
- `src/core/assets/assetRegistry.ts` exposes typed combat UI lookup.
- `src/phaser/ui/CombatSceneView.ts` owns combat layout constants and Phaser-rendered translucent UI regions.
- `src/scenes/GameScene.ts` composes combat UI helpers with enemies, cards, feedback, input, and transitions.
- `src/phaser/ui/EnemyView.ts` may use enemy platform and target ring assets.
- `src/phaser/ui/CardView.ts` keeps aspect-ratio safe card art.

The five main UI regions must not call `assets.getCombatUiAsset(...)` for their panel backgrounds.

## Testing And Verification

Required automated verification:

- `npm test`
- `npm run build`
- `npm run test:e2e`

Required browser verification:

- Use Codex app in-app browser / MCP Playwright target for local browser checks.
- Do not use macOS `open` or external user-installed browsers.
- Inspect `window.render_game_to_text()`.
- Inspect console/page errors.

Required screenshot review:

- Background matches the proposal-1 dark street direction.
- Player status, progress status, ticker, turn action, and hand area are black translucent Phaser regions.
- No generated UI surface images are visible for those five regions.
- Cards remain readable.
- Text remains readable.
- `測試勝利` is in the lower-left and does not overlap normal turn controls.
- Drag attack, invalid drag cancel, enemy turn HP update, and death transition still work.

## Risks

- Keeping unused UI surface files in `public/assets/ui/combat/` can confuse future implementation. Runtime tests should assert they are not rendered for the five simplified regions.
- Generated backgrounds can still include accidental UI or readable text. The prompt must explicitly remove UI, labels, icons, cards, and enemies.
- Phaser rectangles can feel too plain if overused. This is acceptable for the current correction because readability is the priority.
