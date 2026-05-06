# Mnemonic Spire Asset Specification

## Global Rules

All image assets live under `public/assets/` and are referenced by relative paths in JSON data. Runtime code must read data paths through the asset registry instead of hardcoding filenames.

Primary image style: modern Japanese pop street-graffiti chibi sticker style, cute but uneasy. Use bold marker-like linework, flat fills, clashing colors, playful symbolic shapes, and strong sticker silhouettes. Do not reference or imitate a living artist by name in prompts or metadata.

Image format:

- Format: PNG.
- Color: sRGB.
- Transparency: required for character, enemy, relic, sticker, and icon assets.
- Text: avoid embedded text unless the slot explicitly requires a symbol. Game text should be rendered by UI.
- Safe area: keep the subject inside 88% of the canvas bounds.
- Background: transparent for sprites/icons; simple flat sticker backing is allowed only inside the silhouette.
- Avoid: painterly rendering, realistic anatomy, soft blending, thin sketch lines, heavy texture, watermark, signature, illegible text.

Audio format:

- Format: OGG Vorbis.
- Sample rate: 44.1 kHz.
- Channels: stereo for BGM, mono or stereo for SFX.
- Loudness target: approximately -16 LUFS integrated for BGM, -14 to -10 LUFS for short SFX.
- Peak: below -1 dBTP.
- Looping BGM: seamless loop preferred, 60-120 seconds.
- SFX length: 0.08-1.2 seconds depending on cue.
- Filenames: lowercase kebab-case.

## Image Size Specs

| Slot | Size | Transparency | Notes |
| --- | ---: | --- | --- |
| Player character | 1024x1024 | Yes | Chibi sticker sprite, full body, centered. |
| Enemy sprite | 1024x1024 | Yes | Chibi/mascot enemy, centered, readable at 160px. |
| Boss sprite | 1536x1024 | Yes | Wider silhouette allowed, still centered. |
| Card art | 1024x1536 | Optional | Vertical illustration. Keep important subject in top 70%; UI overlays card name/effects. |
| Relic icon | 512x512 | Yes | Simple object icon, readable at 48px. |
| Event image | 1536x1024 | No | Scene/key art, no embedded text. |
| Memory sticker | 512x512 | Yes | Sticker/badge symbol, readable at 32px. |
| Map node icon | 256x256 | Yes | Strong silhouette, readable at 32px. |
| Intent icon | 256x256 | Yes | Attack/block/debuff icon, readable at 24px. |
| Contract icon | 512x512 | Yes | Ominous sticker badge, readable at 48px. |
| Placeholder image | Same as slot | Yes where possible | Neutral fallback using the same visual language. |

## Required Image Assets

### Character

| File | Slot | Prompt Subject |
| --- | --- | --- |
| `public/assets/characters/seeker.png` | player character | The Seeker of Memories, a cute uneasy chibi deckbuilder hero holding a broken notebook and marker pen. |

### Card Art

| File | Card | Prompt Subject |
| --- | --- | --- |
| `public/assets/cards/strike.png` | Strike / 斬擊 | A chibi sticker slash mark mascot swinging a bright marker-blade. |
| `public/assets/cards/pierce.png` | Pierce / 穿刺 | A sharp sticker spear piercing through layered paper tags. |
| `public/assets/cards/sweep.png` | Sweep / 掃擊 | A wide graffiti brush stroke sweeping across three tiny shadow stickers. |
| `public/assets/cards/countercut.png` | Countercut / 反擊 | A cute fighter sticker blocking with one arm and cutting back with the other. |
| `public/assets/cards/memory_blade.png` | Memory Blade / 記憶刃 | A broken notebook page folded into a glowing street-marker blade. |
| `public/assets/cards/terminus.png` | Terminus / 終止符 | A chaotic final punctuation symbol turned into a chibi execution sticker. |
| `public/assets/cards/guard.png` | Guard / 格擋 | A tiny chibi shield made of layered stickers and notebook paper. |
| `public/assets/cards/dodge.png` | Dodge / 閃避 | A chibi figure slipping sideways past a jagged attack arrow. |
| `public/assets/cards/stacked_defense.png` | Stacked Defense / 堆疊防線 | A pile of colorful sticker shields stacked into a wobbly wall. |
| `public/assets/cards/reflect_shield.png` | Reflect Shield / 反射盾 | A shiny sticker shield reflecting hostile graffiti marks. |
| `public/assets/cards/preserve.png` | Preserve / 保存 | A hand pinning a card under clear tape and memory stickers. |
| `public/assets/cards/recall.png` | Recall / 回想 | A chibi memory sprite pulling a card out of a spiral notebook. |
| `public/assets/cards/organize_hand.png` | Organize Hand / 整理手牌 | Several chaotic cards being sorted by colored clips and stickers. |
| `public/assets/cards/burning_notes.png` | Burning Notes / 燃燒筆記 | A notebook page burning with flat neon sticker flames. |
| `public/assets/cards/rewrite.png` | Rewrite / 複寫 | A marker pen overwriting a card with glitchy sticker symbols. |

### Enemy Sprites

| File | Enemy | Prompt Subject |
| --- | --- | --- |
| `public/assets/enemies/sticker_punk.png` | Sticker Punk / 貼紙龐克 | A mischievous chibi street punk made of torn stickers. |
| `public/assets/enemies/neon_mite.png` | Neon Mite / 霓虹蟎 | A tiny bug mascot with neon legs and symbolic eyes. |
| `public/assets/enemies/paper_doll.png` | Paper Doll / 紙偶 | A folded paper doll enemy with unsettling cute eyes. |
| `public/assets/enemies/static_busker.png` | Static Busker / 靜電街演者 | A chibi street musician made of static, stickers, and wires. |
| `public/assets/enemies/tagged_hound.png` | Tagged Hound / 塗標獵犬 | A chibi hound covered in graffiti tags and warning stickers. |
| `public/assets/enemies/archive_brute.png` | Archive Brute / 檔案暴徒 | A bulky chibi archive brawler with paper folders as armor. |
| `public/assets/enemies/tower_heart.png` | Tower Heart / 牌塔心臟 | A wide Boss sticker: a cute but unsettling tower-heart made of cards, eyes, and graffiti veins. |

### Relic Icons

| File | Relic | Prompt Subject |
| --- | --- | --- |
| `public/assets/relics/broken_notes.png` | Broken Notes | A cracked notebook icon with memory stickers. |
| `public/assets/relics/neon_nail.png` | Neon Nail | A glowing bent nail icon with clashing colors. |
| `public/assets/relics/sticker_charm.png` | Sticker Charm | A dangling charm made of layered stickers. |
| `public/assets/relics/old_ticket_stub.png` | Old Ticket Stub | A torn ticket stub with uneasy marker symbols. |
| `public/assets/relics/broken_recorder.png` | Broken Recorder | A broken cassette recorder icon with symbolic eyes. |

### Event Images

| File | Event | Prompt Subject |
| --- | --- | --- |
| `public/assets/events/neon_alley.png` | Neon Alley | A narrow neon sticker alley filled with watching wall stickers. |
| `public/assets/events/ink_market.png` | Ink Market | A surreal street market stall selling ink, cards, and memory stickers. |
| `public/assets/events/blank_billboard.png` | Blank Billboard | A large blank billboard surrounded by chaotic graffiti symbols. |
| `public/assets/events/lost_station.png` | Lost Station | A lost-and-found station with boxes of cards and uneasy sticker faces. |

### Memory Stickers

| File | Meaning | Prompt Subject |
| --- | --- | --- |
| `public/assets/stickers/memory-empty.png` | empty memory slot | An empty sticker badge shaped like a torn notebook label. |
| `public/assets/stickers/bloodthirst.png` | Bloodthirst | A cute dangerous fang/drop symbol sticker. |
| `public/assets/stickers/desperation.png` | Desperation | A cracked heart and warning bolt sticker. |
| `public/assets/stickers/grudge.png` | Grudge | A scribbled angry eye sticker. |
| `public/assets/stickers/obsession.png` | Obsession | A spiral pin and tape sticker. |
| `public/assets/stickers/witness.png` | Witness | A staring eye inside a card-frame sticker. |

### UI Icons

| File | Meaning | Prompt Subject |
| --- | --- | --- |
| `public/assets/ui/nodes/normal-combat.png` | normal combat node | Crossed marker blades node icon. |
| `public/assets/ui/nodes/elite-combat.png` | elite combat node | Crowned crossed marker blades node icon. |
| `public/assets/ui/nodes/event.png` | event node | Question-mark sticker node icon without text dependency. |
| `public/assets/ui/nodes/rest.png` | rest node | Bandage and notebook node icon. |
| `public/assets/ui/nodes/shop.png` | shop node | Ticket and coin node icon. |
| `public/assets/ui/nodes/boss.png` | boss node | Tower-heart warning node icon. |
| `public/assets/ui/intents/attack.png` | attack intent | Jagged impact arrow icon. |
| `public/assets/ui/intents/block.png` | block intent | Sticker shield icon. |
| `public/assets/ui/intents/debuff.png` | debuff intent | Uneasy spiral warning icon. |
| `public/assets/ui/contracts/blood_contract.png` | blood contract | Fang/drop contract seal. |
| `public/assets/ui/contracts/debt_contract.png` | debt contract | Coin and chain contract seal. |
| `public/assets/ui/contracts/ink_contract.png` | ink contract | Ink blot and marker contract seal. |
| `public/assets/ui/contracts/blank_contract.png` | blank contract | Empty label and eye contract seal. |

### Combat UI Surfaces

These assets support the combat scene UI implementation based on `externals/battle-design-proposal-3.png`, with diagonal street energy from `externals/battle-design-proposal-4.png`.

Rules:

- Store final runtime files under `public/assets/ui/combat/`.
- Do not embed gameplay text in the image. HP, energy, block, turn labels, card names, damage, and combat ticker text are Phaser-rendered.
- Use strong sticker silhouettes, thick marker-like linework, grunge street texture, cyan/magenta/yellow accents, and dark readable negative space.
- Transparent panel assets should include only the designed frame/surface and decorative marks.
- The full background must leave enough visual quiet space for enemies, cards, and feedback text.

| File | Key | Size | Transparency | Purpose |
| --- | --- | ---: | --- | --- |
| `public/assets/ui/combat/battle-bg.png` | `combatBattleBg` | 1920x1080 | No | Full combat stage background, street-graffiti wall/floor, no embedded text. |
| `public/assets/ui/combat/player-panel.png` | `combatPlayerPanel` | 420x280 | Yes | Upper-left player HP/energy/block frame. |
| `public/assets/ui/combat/top-resource-frame.png` | `combatTopResourceFrame` | 760x72 | Yes | Top floor/gold/relic/contract tab strip frame. |
| `public/assets/ui/combat/turn-device.png` | `combatTurnDevice` | 360x260 | Yes | Right-bottom end-turn device. |
| `public/assets/ui/combat/combat-ticker-panel.png` | `combatTickerPanel` | 330x430 | Yes | Right combat ticker drawer/panel. |
| `public/assets/ui/combat/enemy-platform.png` | `combatEnemyPlatform` | 320x120 | Yes | Enemy ground platform / sticker base. |
| `public/assets/ui/combat/target-ring.png` | `combatTargetRing` | 320x320 | Yes | Neon selected/hover target ring. |
| `public/assets/ui/combat/hand-tray.png` | `combatHandTray` | 940x230 | Yes | Bottom card tray/rail. |
| `public/assets/ui/combat/drop-zone.png` | `combatDropZone` | 280x210 | Yes | Drag/drop hint surface. |

### Combat Player Status UI Component Assets

These assets support the left-top combat player status region. They follow `externals/battle-design-proposal-1.png` and `public/assets/ui/combat/battle-bg.png`, using a low-noise dark street arcade device style.

Rules:

- Store final runtime files under `public/assets/ui/combat/`.
- Redraw these files while looking at `externals/battle-design-proposal-1.png`; do not crop, mask, trace pixels, or process the source image into runtime assets. Do not reinterpret them as a new design.
- Keep every gameplay value Phaser-rendered. Do not embed HP, energy, block, deck counts, Chinese labels, numbers, or letters in the image.
- Use transparent PNGs with clean empty slots for Phaser text, bars, and any necessary low-priority runtime text.
- Preserve proposal-1 dark glass, rough white outline, cyan energy plate, green block plate, magenta/yellow trim, and subtle scuffs.
- The player shell should faithfully redraw the skull/crown emblem because it is part of the confirmed main visual. Do not introduce new characters, mascots, cards, enemies, or watermark.

| File | Size | Transparency | Purpose |
| --- | ---: | --- | --- |
| `public/assets/ui/combat/player-status-base.png` | 420x240 | Yes | Accepted style-teradadara-like complete left-top player status base; HP fill aperture is transparent with inner rim, energy/block areas are opaque. |
| `public/assets/ui/combat/player-status-hp-fill-slot.png` | 260x48 | Yes | Local HP fill slot aligned to the base HP lane. |
| `public/assets/ui/combat/player-status-energy-value-slot.png` | 180x54 | Yes | Local cyan energy value area aligned to the base energy plate. |
| `public/assets/ui/combat/player-status-block-value-slot.png` | 180x54 | Yes | Local green block value area aligned to the base block plate. |

### Placeholders

| File | Slot |
| --- | --- |
| `public/assets/ui/placeholders/card-art.png` | missing card art |
| `public/assets/ui/placeholders/enemy-sprite.png` | missing enemy sprite |
| `public/assets/ui/placeholders/relic-icon.png` | missing relic icon |
| `public/assets/ui/placeholders/event-image.png` | missing event image |
| `public/assets/ui/placeholders/ui-icon.png` | missing UI icon |

## Required Audio Assets

| File | Type | Length | Spec |
| --- | --- | ---: | --- |
| `public/assets/audio/sfx/card-played.ogg` | SFX | 0.10-0.35s | Short marker flick/card slap, crisp transient. |
| `public/assets/audio/sfx/damage.ogg` | SFX | 0.15-0.45s | Punchy sticker tear/impact, not realistic gore. |
| `public/assets/audio/sfx/memory-gained.ogg` | SFX | 0.30-0.80s | Bright glitchy sparkle, slightly uneasy tail. |
| `public/assets/audio/sfx/mutation.ogg` | SFX | 0.60-1.20s | Marker scribble, tape peel, weird transform accent. |
| `public/assets/audio/sfx/victory.ogg` | SFX | 0.80-2.00s | Short upbeat chiptune/sticker burst. |
| `public/assets/audio/sfx/failure.ogg` | SFX | 0.80-2.00s | Short detuned chiptune fall. |
| `public/assets/audio/bgm/main-loop.ogg` | BGM | 60-120s | Loopable chiptune/retro street-pop battle-adventure track, energetic but slightly uneasy. |

## Placeholder Music Source

Selected placeholder BGM:

- Track: Rin's Theme (Loopable chiptune, adventure/battle BGM)
- Author: request
- Source: https://opengameart.org/content/rins-theme-loopable-chiptune-adventurebattle-bgm
- License: CC0
- Chosen file: `rins-theme_loop.ogg`

Rationale: loopable chiptune adventure/battle energy matches the temporary MVP need. It is not final branding music.
