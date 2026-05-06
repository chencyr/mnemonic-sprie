# AGENTS.md

## 溝通語言

- 僅使用中文作為溝通語言。

## 專案定位

- 本專案是 `Mnemonic Spire / 記憶牌塔`。
- 技術架構是 Phaser 3 + TypeScript + Vite。
- 核心規則應維持 framework-neutral，放在 `src/core/`；Phaser 只負責呈現、互動、動畫、音訊與測試 hook。

## 已確認 UI 方向

- 整體遊戲 UI 重設計方向已確認為 **B：爬塔戰鬥介面 UI**。
- 目標是保留 deckbuilder 玩家熟悉的清楚版面，同時大量使用現有素材，而不是只用文字按鈕。
- 後續 UI redesign 應優先使用：
  - `public/assets/cards/*`
  - `public/assets/enemies/*`
  - `public/assets/events/*`
  - `public/assets/relics/*`
  - `public/assets/stickers/*`
  - `public/assets/ui/nodes/*`
  - `public/assets/ui/intents/*`
  - `public/assets/ui/contracts/*`

## 文件與流程規則

## Backlog 開始前 Brainstorm Gate

- 開始進行任何 backlog 前，必須先進行 brainstorm。
- brainstorm 的結果必須落成設計文件，放在 `docs/superpowers/specs/`。
- spec 檔名應能對應 backlog，例如：
  - backlog：`backlogs/17-overall-game-ui-redesign-backlog.md`
  - spec：`docs/superpowers/specs/2026-05-05-overall-game-ui-redesign-design.md`
- spec 至少應包含：
  - 背景與目前問題。
  - 已確認方向。
  - 曾考慮的替代方案與取捨。
  - 設計目標與非目標。
  - 主要畫面或系統設計。
  - 測試與驗收策略。
  - 風險。
- 未完成 brainstorm/design spec 前，不得：
  - 把 backlog 移到 `backlogs/in-progress/`。
  - 撰寫 implementation plan。
  - 開始修改功能程式碼。

### `docs/superpowers/`

- `docs/superpowers/` 是所有設計與實作計畫的主要位置。
- 設計文件，也就是 spec design，應放在 `docs/superpowers/specs/`。
- 實作計畫，也就是 implementation plan，應放在 `docs/superpowers/plans/`。
- 不要把正式設計決策只留在對話中；可追蹤的設計與計畫必須落到這裡。

### `docs/assets/`

- `docs/assets/` 是素材生成規格與生成方式的主要位置。
- 這裡的內容用於重新生成、修正錯誤素材、檢查素材槽規格。
- 給 image generation / image2 使用的 prompt、規格、風格限制、檔名與尺寸要求都應寫在這裡。
- 畫任何素材圖時，必須先讀取並遵守 `docs/assets/image-generation-prompts.jsonl` 中對應素材槽的定義；不得只依照對話中的臨時描述、個人判斷或未記錄 prompt 直接生成。
- 若要變更素材風格、尺寸、透明度、參考圖、排除項或輸出路徑，必須先更新 `docs/assets/image-generation-prompts.jsonl` 與必要的 `docs/assets/*` 規格文件，再重新生成素材。
- 程式碼引用素材時，應優先透過資料表與 asset registry，不要硬編素材路徑。

### `backlogs/`

- `backlogs/*` 記載所有尚未開始開發的進程與提案。
- 每一個 backlog 應切成適合單獨開 worktree 的大小。
- 每份 backlog 應至少包含：
  - Backlog ID
  - Worktree Size
  - Player Problem
  - Scope
  - Out Of Scope
  - Acceptance Criteria
  - Tests
  - Likely Files

### `backlogs/in-progress/`

- `backlogs/in-progress/*` 記載目前進行中的開發進程。
- 開始實作某個 backlog 前，應先把對應檔案從 `backlogs/` 移動到 `backlogs/in-progress/`。
- 每一份 backlog 進入實作前，都必須先完成 brainstorm/design spec，並放在 `docs/superpowers/specs/`。
- brainstorm/design spec 應記錄已確認方向、替代方案、取捨、畫面/系統設計、驗收方式。
- 沒有對應 spec 的 backlog 不得直接撰寫 implementation plan 或開始改程式。
- 實作時應開獨立 worktree 與 feature branch，不直接在 `main` 上開發功能。

### `backlogs/done/`

- `backlogs/done/*` 記載已完成的開發進程。
- backlog 完成、驗證通過、合回 `main` 後，應把對應檔案從 `backlogs/in-progress/` 移動到 `backlogs/done/`。
- 移動到 done 前，應確認該 backlog 的 Acceptance Criteria 與 Tests 已完成或明確記錄例外。

## Backlog 狀態轉換

1. 尚未開始：`backlogs/<name>-backlog.md`
2. Brainstorm：為該 backlog 產出 `docs/superpowers/specs/<date>-<name>-design.md`
3. 開始開發：確認 spec 已存在後，移動到 `backlogs/in-progress/<name>-backlog.md`
4. 實作計畫：撰寫 `docs/superpowers/plans/<date>-<name>-plan.md`
5. 完成並合回 main：移動到 `backlogs/done/<name>-backlog.md`

## 技能使用規則

- 使用 `superpowers:executing-plans` 執行任何 implementation plan 時，必須同時使用 `develop-web-game` 工作流。
- 對本專案而言，`superpowers:executing-plans` 負責照計畫逐項實作與驗證；`develop-web-game` 負責每個有意義的 web game 變更後進行實機瀏覽器檢查。
- 執行期間必須：
  - 讀取並更新 `progress.md`。
  - 使用 `$WEB_GAME_CLIENT` 或等效 develop-web-game Playwright client 驅動本機遊戲。
  - 檢查最新 screenshot。
  - 檢查 `window.render_game_to_text()` 回傳狀態。
  - 檢查 console/page errors。
- 若改動 UI、互動、遊戲流程、音訊、動畫或 Phaser scene，不得只用 `npm test`、`npm run build`、`npm run test:e2e` 作為完成依據；必須補上 develop-web-game 的瀏覽器驗證。

## 實作驗證規則

- 完成功能前至少執行：
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
- 若修改 UI，必須用 Codex app 的 in-app browser 或專案自動化 Playwright 截圖檢查相關畫面。
- 所有互動式、人工視覺檢查、local URL 導頁與 browser smoke test，都必須使用 Codex app browser / browser-use / MCP Playwright 的 in-app browser target。
- 不得使用 macOS `open`、Chrome、Safari、Firefox 或其他使用者自行安裝的外部瀏覽器來替代 Codex app browser 測試。
- 若需要自動化瀏覽器測試，只能使用專案測試指令、`$WEB_GAME_CLIENT` 或等效的工具化/headless Playwright 流程；不得開啟 app 外部的使用者瀏覽器。
- 若修改遊戲流程，必須更新 `window.render_game_to_text()` 或 E2E，讓測試能觀察新增狀態。
