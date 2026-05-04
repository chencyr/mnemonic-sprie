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
