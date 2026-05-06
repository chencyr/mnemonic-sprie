# Combat Player Status UI Assets

## Purpose

These assets define the left-top combat player status UI component set for `19-combat-player-status-region`.

The selected direction is **style-teradadara-like redraw of the complete left-top player status component**. The runtime UI uses one complete base asset that preserves the proposal-1 structure, plus only the minimal local slots needed for Phaser-rendered dynamic values.

These assets must be redrawn while looking at `externals/battle-design-proposal-1.png`. Do not crop, mask, trace pixels, or process the source image into runtime assets. The goal is to faithfully redraw the proposal-1 far top-left player status UI as one coherent component, while omitting dynamic labels, numbers, and HP fill for Phaser runtime rendering.

Final accepted base direction:

- Use `style-teradadara-like` on top of the original `player-status-base` prompt.
- The complete base asset is `public/assets/ui/combat/player-status-base.png`.
- Use the accepted original generated trial as-is. Do not post-process the base asset for HP cutouts, extra mask work, or opacity changes unless this spec is changed first.

## Visual Reference

Primary reference:

- `externals/battle-design-proposal-1.png`
- `public/assets/ui/combat/battle-bg.png`

Visual language:

- Dark street arcade device.
- Black glass / smoky translucent hardware.
- Far top-left proposal-1 topology: a protruding left avatar/emblem socket, a right-extending angled HP lane, and two lower connected cyan/green plates.
- Restrained cyan, magenta, and yellow edge accents.
- Low visual noise.
- Thick marker-like contour only at key edges.
- Subtle scuffs and sticker scratches.
- Functional empty slots for Phaser-rendered content.

## Global Rules

- Output format: PNG.
- Background: transparent.
- Store files under `public/assets/ui/combat/`.
- Source method: faithful redraw from visual reference, not crop or pixel extraction.
- Preserve proposal-1 shape language, rough outlines, colors, scratches, proportions, and top-left UI topology.
- Redraw the static skull/crown emblem when it is part of the shell; do not introduce a different mascot or new character.
- No readable text.
- No numbers.
- No letters.
- No embedded `HP`, `能量`, `格擋`, `抽牌`, `棄牌`, or `手牌` labels.
- No characters, faces, eyes, mascots, cards, enemies, or watermark. The shell may include an empty jagged avatar/emblem socket, but not an actual face drawing.
- Keep all dynamic gameplay information Phaser-rendered.
- Keep the center of each slot clean enough for text and bars.
- Avoid cute sticker-heavy surface art. This UI must feel like a readable combat device, not a decorative character panel.

## Asset Slots

| Asset | Size | Runtime Role |
| --- | ---: | --- |
| `player-status-base.png` | 420x240 | Accepted original style-teradadara-like left-top player status base: skull/crown emblem, HP lane, cyan energy plate, green block plate. No dynamic text or numbers. |
| `player-status-hp-fill-slot.png` | 260x48 | Local HP fill slot aligned to the base HP lane. Phaser draws the red fill and HP text. |
| `player-status-energy-value-slot.png` | 180x54 | Local clean cyan value area aligned to the base energy plate. Phaser draws energy text/number. |
| `player-status-block-value-slot.png` | 180x54 | Local clean green value area aligned to the base block plate. Phaser draws block text/number. |

## Runtime Composition Rules

- The base should sit within the existing `combatLayout.playerPanel` area, with modest growth allowed up to about 340x190 runtime display size.
- The base asset may be larger than runtime size to preserve source detail.
- HP has the highest visual priority, then energy and block.
- Do not add deck resource graphics to this asset set. The proposal-1 left-top player status component does not contain them.
- Phaser must be able to hide, tint, or replace individual components without regenerating the entire panel.
- Do not invent sub-structures that are absent from the reference, such as energy sockets. This asset set does not define energy pips.

## Prompt Source

Prompt/history entries are registered in:

- `docs/assets/image-generation-prompts.jsonl`

For this asset set, prefer faithful redraw over source extraction. Do not generate unrelated variants or redesign from ad hoc chat prompts. Update this spec and the JSONL prompt file first if source method, style, size, output path, or exclusions change.
