# Audio Sources

## Placeholder BGM

- Local file: `public/assets/audio/bgm/main-loop.ogg`
- Track: Rin's Theme (Loopable chiptune, adventure/battle BGM)
- Author: request
- Source: https://opengameart.org/content/rins-theme-loopable-chiptune-adventurebattle-bgm
- Source file: https://opengameart.org/sites/default/files/rins-theme_loop.ogg
- License: CC0
- Source notes: OpenGameArt lists the track as Music with tags `chiptune`, `adventure`, `Battle`, `loopable`, `bgm`, and License(s) `CC0`.
- Local technical check: Ogg Vorbis, stereo, 44100 Hz, duration 129.6 seconds, bitrate about 138 kbps.

This is a placeholder asset for MVP development. Replace it before final release if a stronger original soundtrack becomes available.

## Placeholder Combat BGM

- Local file: `public/assets/audio/bgm/combat-loop.ogg`
- Source file: `public/assets/externals/Corrupted Buffer.wav`
- Source metadata: `made with suno; created=2026-05-03T09:12:24Z; id=0d6fc412-33d9-4bc8-83b7-c818d6a453a5`
- Intended use: combat atmosphere loop.
- License status: use only if the source was generated while the project owner had Suno Pro/Premier rights for that output. If the source was generated on Suno Basic/free, keep it as local non-commercial development audio and replace before public release.
- Conversion command:
  - `ffmpeg -y -i 'public/assets/externals/Corrupted Buffer.wav' -vn -ar 44100 -ac 2 -c:a vorbis -strict -2 -q:a 5 'public/assets/audio/bgm/combat-loop.ogg'`
- Local technical check: Ogg Vorbis, stereo, 44100 Hz, duration 103.752562 seconds, bitrate about 213 kbps.

## Placeholder SFX

All placeholder SFX below are from Kenney asset packs licensed as Creative Commons Zero (CC0). The downloaded packs include `License.txt` stating the content is free for personal, educational, and commercial projects, and that credit is not mandatory.

### Source Packs

- Interface Sounds
  - Source page: https://kenney.nl/assets/interface-sounds
  - Mirror used for download: https://opengameart.org/content/interface-sounds
  - Download used: https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip
  - License: CC0
- Impact Sounds
  - Source page: https://kenney.nl/assets/impact-sounds
  - Download used: https://www.kenney.nl/media/pages/assets/impact-sounds/8aa7b545c9-1677589768/kenney_impact-sounds.zip
  - License: CC0
- Music Jingles
  - Source page: https://kenney.nl/assets/music-jingles
  - Download used: https://www.kenney.nl/media/pages/assets/music-jingles/4f5dd770b7-1677590399/kenney_music-jingles.zip
  - License: CC0

### File Mapping

| Local file | Source pack | Source file | Technical check |
| --- | --- | --- | --- |
| `public/assets/audio/sfx/card-played.ogg` | Kenney Interface Sounds | `Audio/drop_004.ogg` | Ogg Vorbis, 44.1kHz, stereo, 0.286689s |
| `public/assets/audio/sfx/damage.ogg` | Kenney Impact Sounds | `Audio/impactPunch_heavy_000.ogg` | Ogg Vorbis, 44.1kHz, stereo, 0.649025s |
| `public/assets/audio/sfx/memory-gained.ogg` | Kenney Interface Sounds | `Audio/confirmation_003.ogg` | Ogg Vorbis, 44.1kHz, mono, 0.322018s |
| `public/assets/audio/sfx/mutation.ogg` | Kenney Interface Sounds | `Audio/scratch_004.ogg` | Ogg Vorbis, 44.1kHz, mono, 0.325079s |
| `public/assets/audio/sfx/victory.ogg` | Kenney Music Jingles | `Audio/8-Bit jingles/jingles_NES00.ogg` | Ogg Vorbis, 44.1kHz, stereo, 1.757846s |
| `public/assets/audio/sfx/failure.ogg` | Kenney Interface Sounds | `Audio/error_006.ogg` | Ogg Vorbis, 44.1kHz, mono, 0.500045s |

These SFX are placeholders selected for functional feedback, not final sound direction.
