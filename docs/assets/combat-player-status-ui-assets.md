# Combat Player Status UI Assets

## Purpose

These assets define the left-top combat player status UI component set for `19-combat-player-status-region`.

The selected direction is **B1: functional device component set**. The runtime UI is composed from small transparent PNG components while Phaser renders all dynamic values, labels, bar fills, pips, and interaction state.

## Visual Reference

Primary reference:

- `externals/battle-design-proposal-1.png`
- `public/assets/ui/combat/battle-bg.png`

Visual language:

- Dark street arcade device.
- Black glass / smoky translucent hardware.
- Restrained cyan, magenta, and yellow edge accents.
- Low visual noise.
- Thick marker-like contour only at key edges.
- Subtle scuffs and sticker scratches.
- Functional empty slots for Phaser-rendered content.

## Global Rules

- Output format: PNG.
- Background: transparent.
- Store files under `public/assets/ui/combat/`.
- No readable text.
- No numbers.
- No letters.
- No embedded `HP`, `能量`, `格擋`, `抽牌`, `棄牌`, or `手牌` labels.
- No characters, faces, eyes, mascots, cards, enemies, or watermark.
- Keep all dynamic gameplay information Phaser-rendered.
- Keep the center of each slot clean enough for text, bars, or pips.
- Avoid cute sticker-heavy surface art. This UI must feel like a readable combat device, not a decorative character panel.

## Asset Slots

| Asset | Size | Runtime Role |
| --- | ---: | --- |
| `player-status-panel-shell.png` | 420x240 | Left-top shell with empty lanes for HP, block, energy, and small counters. |
| `player-hp-bar-frame.png` | 260x48 | HP bar frame. Phaser draws the fill and text. |
| `player-block-badge.png` | 120x64 | Block badge base. Phaser draws the number and label. |
| `player-energy-pip-strip.png` | 180x54 | Three empty energy sockets. Phaser draws lit pips and text. |
| `player-deck-counter-plate.png` | 120x64 | Small reusable counter plate for draw/discard/hand counts. Phaser draws the label and number. |

## Runtime Composition Rules

- The shell should sit within the existing `combatLayout.playerPanel` area, with modest growth allowed up to about 340x190 runtime display size.
- The shell asset may be larger than runtime size to preserve source detail.
- HP has the highest visual priority.
- Block and energy share second priority.
- Deck counters are low priority and should not compete with HP.
- Phaser must be able to hide, tint, or replace individual components without regenerating the entire panel.

## Prompt Source

All generation prompts are registered in:

- `docs/assets/image-generation-prompts.jsonl`

Do not generate these assets from ad hoc chat prompts. Update this spec and the JSONL prompt file first if style, size, output path, or exclusions change.
