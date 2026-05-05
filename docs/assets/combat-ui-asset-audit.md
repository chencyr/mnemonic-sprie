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
