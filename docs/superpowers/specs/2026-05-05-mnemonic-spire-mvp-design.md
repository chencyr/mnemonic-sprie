# Mnemonic Spire MVP Design

## Summary

Mnemonic Spire is a single-player Phaser 3 + TypeScript + Vite roguelike deckbuilder. The player controls the Seeker of Memories, climbs a 12-floor branching tower, builds a deck during the run, and mutates cards based on how individual cards are used.

The MVP prioritizes a complete roguelike loop over deep content volume. A player must be able to finish or lose a run in under 20 minutes while seeing the core loop: map choice, multi-enemy card combat, rewards, shop decisions, event contracts, rest-site mutation, and a Boss that reacts to the player's habits.

The game is built for desktop web browsers first. It must be structured so a future Godot 4 version can reuse the rules, data design, balancing knowledge, and tests conceptually, even though the Phaser presentation layer itself will not port directly.

## MVP Scope

The MVP contains:

- 1 playable character: Seeker of Memories.
- 15 cards.
- 5 normal enemies.
- 1 elite enemy.
- 1 Boss.
- 5 relics.
- 4 events.
- 1 generated 12-floor branching map.
- Normal combat, elite combat, events, rest sites, shop, Boss node, combat rewards, contracts, and card mutation.
- Basic sound effects plus one looping background music track.
- Replaceable image slots for every major visual asset.
- Core rule unit tests and Playwright smoke tests.

The MVP does not include:

- Save or resume support.
- Meta progression.
- Multiple characters.
- Final production art requirements.
- Full balance polish.
- Mobile layout support.

## Success Criteria

The MVP is successful if:

- A player can complete a full run from floor 1 to floor 12.
- A run can be completed or lost within 20 minutes.
- The player experiences at least one card memory mutation.
- The player can make at least one contract decision with an immediate benefit and delayed cost.
- The player can make at least one shop decision.
- The Boss explicitly reveals a countermeasure based on the player's recent habits.
- The game remains understandable with placeholder assets, while every asset slot can be replaced by user-provided images.

## Architecture

The project uses a framework-neutral core and a Phaser presentation layer.

### Core Rules

`src/core/` contains pure TypeScript and must not import Phaser. It owns:

- Run state.
- Map progression.
- Combat state machine.
- Draw pile, hand, discard pile, exhaust pile.
- Energy, HP, block, status effects.
- Card effect resolution.
- Enemy intent and enemy turn resolution.
- Rewards.
- Relics.
- Events.
- Contracts.
- Card memory and mutation.
- Boss habit countermeasures.

The core exposes state snapshots and accepts commands. Example commands include:

- `startRun`.
- `selectMapNode`.
- `playCard`.
- `selectTarget`.
- `endTurn`.
- `chooseReward`.
- `buyShopItem`.
- `restHeal`.
- `restMutateCard`.
- `chooseEventOption`.

The core returns updated state plus domain events such as:

- `CARD_PLAYED`.
- `DAMAGE_DEALT`.
- `BLOCK_GAINED`.
- `CARD_DISCARDED`.
- `MEMORY_GAINED`.
- `CARD_MUTATED`.
- `CONTRACT_CREATED`.
- `CONTRACT_TRIGGERED`.
- `ENEMY_INTENT_REVEALED`.
- `BOSS_COUNTERMEASURE_APPLIED`.
- `RUN_WON`.
- `RUN_LOST`.

### Data

`src/data/` contains JSON data tables. Data files define ids, display names, numbers, asset slots, and effect ids. Runtime behavior lives in TypeScript registries.

Initial data files:

- `cards.json`.
- `enemies.json`.
- `relics.json`.
- `events.json`.
- `contracts.json`.
- `mapRules.json`.
- `assets.json` for global placeholder paths, UI icons, audio paths, and shared asset defaults.

Card effects use `effectId` and are resolved by a TypeScript effect registry. This keeps card metadata portable while allowing the MVP to implement effects quickly.

### Phaser Layer

`src/scenes/` owns Phaser scene orchestration. `src/phaser/` owns Phaser-specific UI helpers, asset loading helpers, animation helpers, and reusable view components. Together they own:

- Phaser scenes.
- Layout.
- Pointer input.
- Highlighting legal targets.
- Animation.
- Texture loading.
- Audio playback.
- Rendering core state snapshots.

Phaser must not contain combat rules. It dispatches commands to the core and reacts to returned events.

### Tests

`tests/core/` covers rule behavior. `tests/e2e/` covers smoke flows through the browser. The existing `window.render_game_to_text()` and `window.advanceTime(ms)` hooks remain available for deterministic browser testing.

## Game Flow

A run starts by creating the Seeker of Memories:

- Starting deck: Strike x5, Guard x5, Recall x1.
- Starting relic: Broken Notes.
- Starting HP: 72/72.
- Starting gold: 99.
- Starting map position: before floor 1, with only floor 1 nodes selectable.

The player climbs a 12-floor branching map. The player can only choose connected nodes on the next floor.

Node types:

- Normal combat.
- Elite combat.
- Event.
- Rest site.
- Shop.
- Boss.

Map generation rules:

- Floor 1 is always normal combat.
- Floor 12 is always Boss.
- Each middle floor has 2-4 nodes.
- Floors 6-9 include at least one rest site.
- Floor 10 or 11 includes at least one elite or shop.
- The map generator must reject any route with three consecutive non-combat floors.
- Each non-Boss floor must expose at least two selectable future routes unless the player is already on floor 11.

Combat rewards:

- Normal combat gives a three-card reward choice or a skip option for small gold.
- Elite combat gives card reward, relic, and more gold.
- Boss victory ends the run and shows a win screen.

## Combat

Combat is turn-based and supports 1-3 enemies.

Player turn baseline:

- 3 energy per turn.
- Draw 5 cards per turn.
- Cards can be attack, defense, or skill.
- Card target types include single enemy, all enemies, self, and no target.
- Input uses click card, then click target or confirm.

Combat zones:

- Draw pile.
- Hand.
- Discard pile.
- Exhaust pile.
- Player HP, block, energy, and status effects.
- Enemy HP, block, intent, and status effects.
- Current relic and contract indicators.
- End turn button.

Turn flow:

1. Player turn begins. Energy resets to 3, draw occurs, start-of-turn effects resolve.
2. Player plays cards. Core validates cost and target, resolves effects, and records card usage.
3. Player ends turn. Non-retained cards move to discard.
4. Enemies act in intent order.
5. Next player turn begins unless combat has ended.

MVP status effects:

- `vulnerable`: increases attack damage received.
- `weak`: reduces attack damage dealt.
- `frail`: reduces block gained.
- `bleed`: loses HP at turn start.
- `spike`: deals retaliation damage when attacked.

Baseline combat numbers:

- Player block clears at the start of the player's turn.
- Enemy block clears at the start of each enemy's action.
- `vulnerable`, `weak`, and `frail` reduce by 1 at the end of the affected side's turn.
- `bleed` deals its stack value as HP loss at turn start, then reduces by 1.
- `spike` deals its stack value as HP loss to the attacker when hit by an attack card.

Death rules:

- An enemy at 0 HP is removed immediately.
- If a played card caused the kill, that card records kill-related memory progress.
- Player HP at 0 triggers immediate run loss.

## Cards

Cards are defined in JSON with fields such as:

- `id`.
- `name`.
- `cost`.
- `type`.
- `rarity`.
- `target`.
- `description`.
- `effectId`.
- `tags`.
- `mutationKeys`.
- `assets`.

MVP card pool:

Attack cards:

- Strike: cost 1, deal 6 single-target damage.
- Pierce: cost 1, deal 5 damage and apply 1 vulnerable.
- Sweep: cost 1, deal 4 damage to all enemies.
- Countercut: cost 1, deal 5 damage, or 9 if the player has block.
- Memory Blade: cost 2, deal 10 damage and gain 1 Witness progress when used on elite or Boss enemies.
- Terminus: cost 2, deal 12 damage, or 18 if the target is below 40% HP.

Defense cards:

- Guard: cost 1, gain 5 block.
- Dodge: cost 1, gain 4 block and apply 1 weak to one enemy.
- Stacked Defense: cost 1, gain 6 block, or 10 if another defense card was played this turn.
- Reflect Shield: cost 2, gain 8 block and 2 spike this turn.
- Preserve: cost 1, select one hand card to retain at end of turn.

Skill cards:

- Recall: cost 0, draw 1 card and give one selected hand card 1 generic memory progress.
- Organize Hand: cost 1, discard up to 2 selected hand cards, then draw the same amount.
- Burning Notes: cost 1, exhaust one selected hand card to deal 8 damage to a selected enemy.
- Rewrite: cost 1, reduce one selected hand card's cost by 1 for this combat, minimum 0.

Starting deck:

- Strike x5.
- Guard x5.
- Recall x1.

## Card Memory And Mutation

Each physical card instance tracks memory progress during a run. The system is about cards remembering what happened to them, not only the deck containing abstract card ids.

Memory types:

- Bloodthirst: this card kills enemies. Threshold: 2 kills.
- Desperation: this card is used while player HP is below 50%. Threshold: 2 uses.
- Grudge: this card is discarded or discarded by an effect. Threshold: 3 discards.
- Obsession: this card is retained into the next turn. Threshold: 2 retains.
- Witness: this card is used against an elite or Boss. Threshold: 1 use.

Mutation model:

- Hybrid model.
- Core cards receive hand-authored variants.
- Other cards use modular memory affixes.
- Each card can receive at most one major mutation in the MVP.
- Mutation mainly happens at rest sites.
- Some events and at most one relic can trigger extra mutation opportunities.
- A mutated card keeps its identity link but receives a variant id for tracking and testing.
- If a card has multiple eligible memories, the mutation UI shows all eligible options and the player chooses one.

Example hand-authored variants:

- Strike + Bloodthirst becomes Bloodthirst Strike: increased damage, draw 1 if it kills.
- Strike + Desperation becomes Desperate Strike: higher damage below 50% HP.
- Guard + Obsession becomes Obsessive Guard: retained cards improve block.
- Recall + Witness becomes Witness Recall: stronger when preparing for elite or Boss fights.

Example modular affixes:

- Bloodthirst: on kill, draw 1.
- Desperation: below 50% HP, increase effect value.
- Grudge: if discarded earlier this combat, reduce cost.
- Obsession: if retained, improve next play.
- Witness: bonus against elite or Boss.

Rest site options:

- Heal.
- Mutate one card that has enough memory progress.

## Events And Contracts

The MVP has 4 events. At least 2 include contract choices.

Contracts are event options, not a separate large progression system. Each contract has:

- Immediate benefit.
- Delayed cost.
- Visible remaining trigger count or condition.

MVP contracts:

- Blood Contract: gain a rare card now. For the next 3 combats, lose 5 HP at combat start.
- Debt Contract: gain 100 gold now. The next shop has prices increased by 50%.
- Ink Contract: immediately mutate one eligible card. Add 1 curse card to the deck.
- Blank Contract: remove one card now. Boss starts with an extra enhancement.

Contracts must feel like chosen risk, not random punishment.

## Relics

MVP relics:

- Broken Notes: starting relic. After each combat, the most-played card gains memory progress.
- Neon Nail: the first attack each combat deals +2 damage.
- Sticker Charm: the first time a card gains memory in combat, gain 3 block.
- Old Ticket Stub: the first shop item each shop is discounted.
- Broken Recorder: once per run, a rest site can mutate one additional card.

Relic effects are resolved by the core rule engine. Phaser only renders icons and triggered feedback.

## Boss Habit Countermeasure

The game tracks player behavior over the most recent 3 combats:

- Attack card ratio.
- Defense card ratio.
- Skill card ratio.
- Many cards played in one turn.
- 0-cost card usage.
- Retained card usage.

At Boss combat start, the highest tendency is selected and displayed clearly. The Boss receives one countermeasure:

- Attack tendency: Boss gains 3 spike for the whole combat.
- Defense tendency: every third Boss action deals damage and applies 2 frail.
- Skill tendency: after the player plays the third skill card in a turn, the player gains 2 bleed.
- Many-card tendency: the fourth and later player cards each turn cost 1 HP in addition to normal costs.
- 0-cost tendency: the first 0-cost card damage source each player turn deals 50% damage.
- Retain tendency: at the start of every second player turn, Boss adds one temporary Jammed Note status card to the hand. Jammed Note costs 1 and exhausts when played with no effect.

The reveal must be explicit so the player understands the Boss is responding to their play pattern.

## Shop

The MVP shop supports:

- Buying cards.
- Buying relics.
- Removing one card.

Prices can be modified by contracts and relics. The MVP shop has no haggling, rerolling, or advanced economy features.

## Visual Direction

The visual direction is modern Japanese street-pop sticker style with a cute but uneasy mood.

Guidelines:

- High saturation.
- Clashing colors.
- Rule-breaking color combinations.
- Thick digital marker-style lines.
- Flat graphic sticker composition.
- Chibi or mascot-like player and enemies.
- Memory mutation appears as stickers, graffiti marks, overwritten labels, symbols, or card surface edits.
- Contracts and Boss countermeasures introduce unease through broken labels, mismatched symbols, corrupted marks, and unstable typography.

The MVP does not require final art. It can ship with Phaser primitives, text, icons, and placeholders as long as every visual asset slot can be replaced by a user-provided image.

## Asset Manifest And Replacement Rules

All major visual assets must be data-driven and replaceable. Program code must not hardcode asset filenames for content.

Suggested asset folders:

- `public/assets/cards/`.
- `public/assets/characters/`.
- `public/assets/enemies/`.
- `public/assets/relics/`.
- `public/assets/events/`.
- `public/assets/stickers/`.
- `public/assets/ui/`.
- `public/assets/audio/`.

Each content data record can define an `assets` object.

Example card data:

```json
{
  "id": "strike",
  "name": "Strike",
  "cost": 1,
  "type": "attack",
  "target": "singleEnemy",
  "effectId": "deal_damage_6",
  "assets": {
    "cardArt": "cards/strike.png",
    "memoryStickerSlot": "stickers/memory-empty.png"
  }
}
```

Example enemy data:

```json
{
  "id": "graffiti_imp",
  "name": "Graffiti Imp",
  "hp": 32,
  "assets": {
    "sprite": "enemies/graffiti_imp.png",
    "intentAttack": "ui/intents/attack.png"
  }
}
```

Asset registry responsibilities:

- Scan data records for asset slots.
- Generate stable Phaser texture keys.
- Load images during Phaser preload.
- Return placeholder texture keys when assets are missing.
- Keep UI code dependent on texture keys, not file paths.

Example texture key patterns:

- `card:strike:art`.
- `enemy:graffiti_imp:sprite`.
- `relic:neon_nail:icon`.
- `event:ink_market:image`.
- `memory:bloodthirst:sticker`.
- `ui:node:shop`.

Required replacement slots:

- Player character image.
- Every card art image.
- Every enemy, elite, and Boss sprite.
- Every relic icon.
- Every event image.
- Every memory or mutation sticker.
- Map node icons.
- Intent icons.
- Card frame or rarity accents.
- Contract icons.
- Shop and rest site UI icons.

Fallbacks:

- Missing card art uses `placeholder:cardArt`.
- Missing character art uses `placeholder:character`.
- Missing enemy art uses `placeholder:enemySprite`.
- Missing relic icon uses `placeholder:relicIcon`.
- Missing event image uses `placeholder:eventImage`.
- Missing memory sticker uses `placeholder:memorySticker`.
- Missing UI icon uses `placeholder:uiIcon`.

Changing a user-provided image must require changing data paths only, not UI code.

## Audio

MVP audio includes:

- Card played sound.
- Damage sound.
- Memory gained sound.
- Mutation sound.
- Victory sound.
- Failure sound.
- One looping background music track.
- Simple mute or volume control.

Audio assets use the same data-driven approach. Placeholder audio may be used until final assets are provided.

## UI Requirements

Primary platform is desktop browser with mouse input.

Combat UI requirements:

- Hand at the bottom.
- Player and enemies in the center.
- Enemy intents visible before enemy turns.
- Draw, discard, and exhaust counts visible.
- Energy and HP visible.
- Relics and active contracts visible.
- Selected card state is obvious.
- Legal targets highlight when a target card is selected.
- Self-target and no-target cards require a clear confirm action.

Map UI requirements:

- Show current floor.
- Show connected next nodes.
- Locked or unreachable nodes are visually distinct.
- Boss is visible at the top.

Reward UI requirements:

- Three card choices.
- Skip for gold on normal combat rewards.
- Relic reward presentation for elite combat.

Rest UI requirements:

- Heal option.
- Mutate eligible card option.
- If no card is eligible, mutation option is disabled with a clear reason.

Shop UI requirements:

- Cards for sale.
- Relics for sale.
- Remove card service.
- Price modifiers from contracts or relics are visible.

## Testing Strategy

Core unit tests must cover:

- Drawing and shuffling.
- Playing cards and spending energy.
- Single-target and all-enemy effects.
- Enemy intent and enemy turn resolution.
- Status effects.
- Card memory triggers.
- Mutation eligibility and mutation results.
- Contract creation and delayed costs.
- Relic triggers.
- Boss habit analysis and countermeasure selection.
- Win and loss states.

Playwright smoke tests must cover:

- Start a run.
- Enter normal combat.
- Play a targeted attack.
- End turn.
- Win a simple combat.
- Choose a reward.
- Move on the map.
- Trigger a rest-site mutation.
- Confirm `render_game_to_text()` returns state consistent with the visible scene.

## Implementation Risks

Key risks:

- Full multi-enemy combat increases UI and testing scope.
- Card memory tied to physical card instances requires careful ids.
- Data-driven assets can become messy if texture keys are not standardized early.
- Boss habit countermeasures can feel unfair unless explicitly revealed.
- Contracts can feel punitive if benefits are not strong enough.

Mitigations:

- Keep card pool at 15 cards.
- Limit each card to one major mutation in the MVP.
- Use stable instance ids for cards.
- Keep contracts visible and count-based.
- Keep Boss countermeasure reveal explicit.
- Use placeholders and asset slots to avoid blocking gameplay on final art.

## Open Decisions Resolved

- Engine: Phaser 3 + TypeScript + Vite.
- Future portability: framework-neutral rules core with Phaser presentation.
- Content size: 15 cards, 5 normal enemies, 1 elite, 1 Boss, 5 relics, 4 events.
- Combat: full multi-enemy support, 1-3 enemies.
- Card operation: click card, then click target or confirm.
- Mutation: hybrid hand-authored plus modular affixes.
- Mutation timing: rest sites primarily, with limited event and relic exceptions.
- Contracts: event options with visible delayed costs.
- Boss countermeasure: revealed at Boss start.
- Visual style: modern Japanese street-pop sticker, cute but uneasy.
- Map: simplified branching 12-floor map.
- Shop: buy cards, buy relics, remove card.
- Card data: JSON metadata plus TypeScript effect registry.
- Saves: no run save in MVP.
- Audio: basic sound effects plus one looping BGM.
- Testing: core unit tests plus Playwright smoke tests.
- Assets: every major visual slot supports user-provided images through data-driven asset paths.
