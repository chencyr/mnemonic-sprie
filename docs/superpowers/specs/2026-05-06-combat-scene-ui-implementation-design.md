# Combat Scene UI Implementation Design

## Background

`18-combat-scene-ui-implementation-backlog.md` is an implementation backlog. Its goal is not to merely document the battle mockups, but to make the Phaser combat scene visibly match the selected combat UI design direction.

The current combat scene is playable and already supports click play, drag play, auto targeting, enemy lifecycle state, delayed victory presentation, layered combat feedback, and `window.render_game_to_text()`. The remaining problem is visual structure: the combat screen still reads as an engineering panel layout instead of the intended modern Japanese street-graffiti card battle scene.

This backlog should establish the combat scene surface that later battle-focused backlogs can build on:

- `04-turn-flow-pacing`
- `05-enemy-intent-status-clarity`
- `06-memory-visibility-mutation`
- `12-audio-gamefeel`
- `13-onboarding-tutorial`

## Confirmed Direction

Use `externals/battle-design-proposal-3.png` as the primary design reference.

Use `externals/battle-design-proposal-4.png` only as a secondary reference for diagonal motion, street energy, speed-line composition, and stronger graffiti background treatment.

The implementation target is medium-high fidelity: the combat screen should clearly feel like the proposal has entered the game, but the work should not attempt pixel-perfect reproduction.

## Alternatives Considered

### Proposal 1 As Primary

This is closest to the current structure: left player panel, central enemies, bottom hand, right combat log. It would be the easiest to implement, but it is less visually distinct and risks preserving the engineering-panel feel.

Decision: not primary.

### Proposal 2 As Primary

This has a strong circular tactical board and targeting-line fantasy. It is visually interesting, but it would require larger targeting and battlefield layout changes. That makes it a better candidate for a later targeting-focused redesign, not this backlog.

Decision: not primary.

### Proposal 3 As Primary

This has the best balance of style and implementability. It has a clear player status area, top resource strip, central enemy stage, bottom hand, right-side battle drawer, and prominent end-turn device. These map well to the current game systems while changing the screen enough to stop feeling like a webpage.

Decision: primary.

### Proposal 4 As Primary

This has the strongest movement and diagonal street-poster energy, but the enemy/card layout is looser and more difficult to keep readable. It is useful as a visual accent source.

Decision: secondary reference.

## Design Goals

- Make the combat scene visibly correspond to `battle-design-proposal-3.png`.
- Use real image assets for the large UI surfaces and decorative shapes instead of relying only on Phaser rectangles.
- Keep Phaser responsible for dynamic state: text, numbers, card instances, enemy instances, HP, block, energy, intent, feedback, drag/drop, target state, and animations.
- Preserve all current combat behavior and test observability.
- Establish a reusable combat UI asset structure that later battle backlogs can extend.

## Non-Goals

- Do not redesign map, reward, rest, shop, event, title, victory, or defeat screens.
- Do not change combat rules or balance.
- Do not fully implement turn pacing sequence from `04`.
- Do not fully implement intent/status icon UX from `05`.
- Do not fully implement memory mutation UX from `06`.
- Do not replace all UI with one flattened full-screen background image.
- Do not create new cards, enemies, relics, contracts, or node types.

## Asset Strategy

Use approach B: real UI assets plus dynamic Phaser composition.

The implementation plan must start with asset work before Phaser UI implementation:

1. Audit existing assets under `public/assets/` and `externals/`.
2. Decide which existing assets can be reused as-is.
3. Decide which slots need redraw or generation.
4. Update `docs/assets/asset-spec.md` with combat UI slots.
5. Update `docs/assets/image-generation-prompts.jsonl` for missing/generated combat UI assets.
6. Add final assets under `public/assets/ui/combat/`.
7. Register new assets in `src/data/assets.json`.
8. Add typed asset lookup support, such as `getCombatUiAsset(...)`, instead of hardcoding paths in Phaser scene code.

Existing sprites and card art should be reused where they work:

- Player character: `public/assets/characters/seeker.png`
- Enemy sprites: `public/assets/enemies/*`
- Card art: `public/assets/cards/*`
- Intent icons: `public/assets/ui/intents/*`
- Memory stickers: `public/assets/stickers/*`
- Relic icon: `public/assets/relics/broken_notes.png`

Likely new combat UI slots:

| Asset | Suggested Size | Transparency | Purpose |
| --- | ---: | --- | --- |
| `public/assets/ui/combat/battle-bg.png` | 1672x941 or 1920x1080 | No | Street-graffiti battle background inspired by proposal 3, with no embedded gameplay text. |
| `public/assets/ui/combat/player-panel.png` | 420x280 | Yes | Left player status panel frame. |
| `public/assets/ui/combat/top-resource-frame.png` | 760x72 | Yes | Top resource strip frame for floor, gold, relic, contract. |
| `public/assets/ui/combat/turn-device.png` | 360x260 | Yes | Right-bottom end-turn device surface. |
| `public/assets/ui/combat/combat-ticker-panel.png` | 330x430 | Yes | Right battle ticker drawer/panel. |
| `public/assets/ui/combat/enemy-platform.png` | 320x120 | Yes | Enemy ground platform / sticker base. |
| `public/assets/ui/combat/target-ring.png` | 320x320 | Yes | Selected/hover target ring. |
| `public/assets/ui/combat/hand-tray.png` | 940x230 | Yes | Bottom hand tray or card rail. |
| `public/assets/ui/combat/drop-zone.png` | 280x210 | Yes | Battlefield/hand/player drop hint decoration. |
| `public/assets/ui/combat/side-tab-left.png` | 120x360 | Yes | Left vertical Seeker tab, if it remains visible. |
| `public/assets/ui/combat/side-tab-right.png` | 120x360 | Yes | Right vertical battle log tab/drawer accent. |

The exact final list may be reduced during implementation if an asset is unnecessary, but the plan must explicitly choose and record that decision.

## Combat Layout

The combat scene should move away from rectangular panels toward layered UI surfaces.

### Background

Use a real background image for the combat stage. The background should be dark, urban, graffiti-heavy, and readable behind sprites. It must not contain embedded game text such as HP, card names, damage numbers, or button labels. Text remains dynamic.

Proposal 3 is the primary background mood: wall/floor graffiti, stickers, industrial details, and a stage-like combat lane. Proposal 4 contributes diagonal movement and speed lines.

### Player Status

The player status area sits in the upper-left. It should use a real panel/frame asset, not a plain rectangle. Dynamic Phaser text and bars render on top:

- HP value and HP bar.
- Energy value, preferably with three visual energy pips.
- Block value and shield indicator.
- Deck/discard information if there is room.

The current `renderPlayerPanel` behavior must remain combat-aware and use combat HP/block/energy while in combat.

### Top Resource Strip

Floor, gold, relic, and contract remain visible at the top. The strip should visually match proposal 3: small framed tabs rather than a full-width engineering HUD.

The existing `renderHudShell` may either be adapted for combat mode or bypassed in combat with a combat-specific top strip. Non-combat screens should not be redesigned in this backlog.

### Battlefield And Enemies

Enemies remain Phaser sprites from the asset registry, but they should sit on styled platforms and feel integrated into the background.

Each enemy needs:

- Sprite.
- HP bar and HP text.
- Block display if block > 0.
- Intent area positioned like a sticker/card above or beside the enemy.
- Selected target ring or glow.
- Dead state styling that remains visibly dead and cannot be targeted.

This backlog may reposition intent and status placeholders, but detailed icon/status UX belongs to `05`.

### Hand Area

The bottom hand area should resemble proposal 3: large cards angled or slightly fanned, sitting in a designed tray. Cards should remain readable and keep the current art aspect-ratio fix.

Required behavior:

- Cards remain individually interactive.
- Click play remains supported.
- Drag play remains supported.
- Valid/invalid drop feedback remains visible.
- Playable and unplayable states remain visible.

The implementation may introduce card rotation or y-offsets, but hit areas must still match visible cards closely enough for reliable tests and player interaction.

### Turn Device

The end-turn button should become a large right-bottom device inspired by proposal 3, backed by a real UI asset. Dynamic labels render on top:

- Current turn.
- Energy state or action pips if appropriate.
- End turn command.

The `auto-win` quick test button must remain available in `?e2e=1`, but it should be visually secondary and should not confuse normal gameplay.

### Combat Ticker

The combat ticker stays on the right side and continues to show concise battle feedback. It should use a real battle drawer/panel asset rather than a plain rectangle.

The existing `feedback.active`, `feedback.ticker`, and `feedback.center` state exposed in `window.render_game_to_text()` must remain.

## Data And Code Boundaries

Core combat logic should not change.

Expected architecture:

- `src/data/assets.json` declares combat UI asset paths.
- `src/core/assets/assetRegistry.ts` exposes typed lookup for combat UI assets.
- `src/phaser/assets/preloadAssets.ts` preloads those assets through the existing registry flow.
- Phaser UI rendering code composes those assets with dynamic text and interactive elements.
- `GameScene.drawCombat()` may be decomposed if needed, but the implementation should avoid unrelated full-scene rewrites.

Potential helper boundaries:

- `src/phaser/ui/CombatSceneView.ts` for combat-specific layout composition.
- `src/phaser/ui/CombatHudView.ts` for player/top resource/turn device surfaces.
- Existing `CardView`, `EnemyView`, `HudView`, `uiTheme`, and `uiPrimitives` can be extended where that follows existing patterns.

The implementation plan should choose the smallest decomposition that keeps `GameScene` readable.

## Testing And Verification

Required automated verification:

- `npm test`
- `npm run build`
- `npm run test:e2e`

Required develop-web-game verification:

- Start the local dev server from the implementation worktree.
- Use `$WEB_GAME_CLIENT` or equivalent Playwright client.
- Inspect the latest screenshot.
- Inspect `window.render_game_to_text()`.
- Inspect console/page errors.

Required manual Playwright scenarios:

- Start -> map -> combat screenshot.
- Drag attack card to battlefield and verify enemy damage feedback.
- Drag guard/self card to player or battlefield and verify player block feedback.
- Force enemy death and verify dead styling plus 1 second victory transition.

Screenshot review must explicitly check that:

- Combat layout corresponds to proposal 3.
- Player status, enemies, hand, ticker, and turn device do not overlap.
- Text remains readable.
- Card art does not distort.
- Dead enemy remains visually dead.

## Risks

- Asset work can expand quickly. The plan must keep asset slots limited to the surfaces needed for combat UI.
- Generated UI assets may include embedded text. Prompts and review must require no gameplay text inside images.
- A large `GameScene` edit could make regressions harder to isolate. Prefer small helper functions or focused UI modules if the combat draw path becomes too large.
- Visual fidelity can conflict with input hit accuracy. Tests must verify drag/click still work after card rotation or layout changes.

## Approval Notes

Confirmed decisions:

- Primary design reference: `externals/battle-design-proposal-3.png`.
- Secondary visual influence: `externals/battle-design-proposal-4.png`.
- Fidelity target: approach B, close to design with real UI assets, not pixel-perfect.
- Asset strategy: first audit existing assets; reuse where appropriate; redraw or generate missing true UI assets before Phaser UI implementation.
- Implementation plan must include `docs/assets` updates before UI implementation.
