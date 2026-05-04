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

## TODO

- Decide the actual core game loop and memory mechanic for Mnemonic Spire.
- Add focused gameplay tests once the first real feature is implemented.
- Add asset pipeline conventions when art/audio direction is chosen.
