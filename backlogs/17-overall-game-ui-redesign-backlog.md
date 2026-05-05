# Overall Game UI Redesign Backlog

## Backlog ID

`gameplay-overall-ui-redesign`

## Worktree Size

大型但仍適合一個 worktree。範圍集中在 Phaser presentation layer、UI component 拆分、素材使用與 E2E 截圖驗收；不改核心規則與資料表數值。

## Player Problem

目前 MVP 雖然使用 Phaser Canvas，但整體 UI 像文字按鈕組成的網頁。大量已生成素材沒有進入主要介面，包括地圖節點 icon、意圖 icon、記憶 sticker、遺物 icon、契約 icon。玩家無法感受到這是一套完整的爬塔卡牌遊戲，也看不出主視覺素材對遊戲系統的支撐。

## Confirmed Direction

採用 **B：爬塔戰鬥介面 UI**。

目標不是做抽象貼紙桌面，也不是手機 App 介面，而是建立玩家熟悉的 roguelike deckbuilder 版面：

- 上方或中央是敵人與戰鬥場域。
- 下方是手牌。
- 左側集中玩家 HP、能量、格擋、牌堆資訊。
- 右側集中遺物、契約、戰鬥紀錄與目前狀態。
- 地圖使用爬塔節點路線。
- 所有節點、意圖、契約、遺物、記憶都盡量使用現有圖像素材。

## Scope

### Global UI Shell

- 重設 1280x720 主版面。
- 建立共用 HUD shell，包含：
  - 玩家 HP / Max HP。
  - 能量。
  - 金幣。
  - 牌組、抽牌堆、棄牌堆數量。
  - 目前樓層。
  - 遺物列。
  - 契約列。
  - 音訊切換。
- HUD 必須使用 relic icon 與 contract icon，不只顯示數字。

### Title Screen

- 使用 `characters/seeker.png` 作為主角主要視覺。
- 顯示遊戲名稱與開始按鈕，但避免像 landing page。
- 顯示目前核心循環的短訊息：爬塔、記憶、變異。
- 不新增額外素材。

### Map Screen

- 使用 `public/assets/ui/nodes/*` 作為節點 icon。
- 地圖改成明確的爬塔節點路線視覺。
- 可到達節點、高亮路線、已走路線要有不同視覺狀態。
- 不再用單字文字 `戰 / 店 / 事 / 王` 當主要節點視覺。
- 節點仍可用簡短文字輔助，但 icon 必須是主要辨識方式。

### Combat Screen

- 建立 deckbuilder 戰鬥版面：
  - 敵人 sprite 放大，放在上方戰場。
  - 敵人 HP bar、block、status、intent icon 可見。
  - 意圖使用 `public/assets/ui/intents/*`。
  - 玩家狀態與能量在固定區域，而不是塞在標題文字。
  - 手牌使用完整卡牌框，卡圖是主要區塊。
  - 卡牌顯示費用、名稱、類型、簡短效果、記憶 sticker。
  - 選中卡牌時可攻擊目標有明確高亮。
- 保留目前點卡再點目標的互動；拖曳出牌留給 `02-drag-drop-card-play-backlog.md`。

### Card UI

- 卡牌不再只是透明按鈕疊圖。
- 建立 reusable `CardView`，至少支援：
  - 卡圖。
  - 費用 badge。
  - 名稱。
  - 類型色條。
  - 描述。
  - 記憶 sticker row。
  - selected / playable / disabled 狀態。
- 記憶 sticker 使用：
  - `stickers/bloodthirst.png`
  - `stickers/desperation.png`
  - `stickers/grudge.png`
  - `stickers/obsession.png`
  - `stickers/witness.png`
  - `stickers/memory-empty.png`

### Enemy UI

- 建立 reusable `EnemyView`。
- 每個敵人顯示：
  - enemy sprite。
  - HP bar。
  - block。
  - status badges。
  - intent icon + intent amount。
  - selected target highlight。

### Reward Screen

- 獎勵卡使用同一套 `CardView`，不是另一套簡化 layout。
- 若有 relic reward，顯示 relic icon、名稱、描述。
- 跳過獎勵按鈕仍保留，但不要比卡牌更搶視覺。

### Shop Screen

- 商店商品使用卡牌、遺物、移除牌三種 item card。
- card item 使用 card art。
- relic item 使用 relic icon。
- remove item 使用 placeholder/ui icon。
- 顯示價格、買不起 disabled、sold 狀態。

### Rest Screen

- 休息點應呈現兩個明確選項：
  - 回血。
  - 變異。
- 若有可變異牌，顯示至少一張可變異牌的 card preview 與記憶 sticker。
- 休息點 icon 可使用 `ui/nodes/rest.png`。

### Event Screen

- 使用 event image 作為主要背景或左側主圖。
- 事件選項面板清楚呈現 benefit / cost。
- 若選項會建立 contract，顯示對應 contract icon。
- 不再只是一張圖加文字按鈕。

### Victory / Defeat Screen

- Victory 顯示 Boss 或 Seeker 相關素材。
- Defeat 顯示 Seeker 或 failure 視覺狀態。
- 勝敗畫面要與整體 UI shell 一致，不只是文字。

### Asset Registry

- 補足目前缺少的 registry helper：
  - map node icon。
  - intent icon。
  - contract icon。
  - memory sticker icon。
- Runtime code 應透過 asset registry 取得素材，不直接硬編 `/assets/...`。

### Test Hooks

- `window.render_game_to_text()` 需維持可用。
- 若新增 UI state，例如 selected card、highlight target、visible icons，應在 text state 中保留可測資訊。
- E2E 按鈕座標仍由 `buttons` 提供。

## Out Of Scope

- 不改核心戰鬥規則。
- 不改卡牌效果、敵人數值、地圖生成邏輯。
- 不做拖曳出牌；拖曳由 `02-drag-drop-card-play-backlog.md` 處理。
- 不做完整 game feel 動畫；動畫可做最小過渡，但主目標是 UI layout 與素材使用。
- 不新增素材，除非現有素材槽缺失且必須補 placeholder。
- 不做手機版 layout；先以 1280x720 desktop 為主。

## Acceptance Criteria

- Title、Map、Combat、Reward、Shop、Rest、Event、Victory/Defeat 皆符合爬塔戰鬥介面 UI 方向。
- Map 節點主要使用 `ui/nodes/*` 圖示。
- Combat 敵人意圖主要使用 `ui/intents/*` 圖示。
- 卡牌 UI 顯示卡圖、費用、名稱、類型、描述與記憶 sticker。
- 遺物列使用 `relics/*` icon。
- 契約列或事件選項使用 `ui/contracts/*` icon。
- Event screen 使用 event image 並呈現更完整的選項面板。
- Reward screen 使用與戰鬥手牌一致的 CardView。
- UI 不應再呈現為大面積文字按鈕加少量縮圖。
- 1280x720 截圖中主要文字不重疊、不被裁切。
- E2E 仍可穩定通過。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- 使用 in-app browser 或 Playwright 截圖檢查：
  - title
  - map
  - combat
  - reward
  - rest
  - shop
  - event
  - victory 或 defeat
- 檢查 console 不得有 asset loading error。
- `render_game_to_text()` 在 title/map/combat/reward 至少仍可回傳 mode、buttons、主要可見狀態。

## Likely Files

- `src/scenes/GameScene.ts`
- `src/core/assets/assetRegistry.ts`
- `src/phaser/ui/CardView.ts`
- `src/phaser/ui/EnemyView.ts`
- `src/phaser/ui/HudView.ts`
- `src/phaser/ui/MapView.ts`
- `src/phaser/ui/RewardView.ts`
- `src/phaser/ui/ShopView.ts`
- `src/phaser/ui/EventView.ts`
- 新增 `src/phaser/ui/RelicView.ts`
- 新增 `src/phaser/ui/ContractView.ts`
- 新增 `src/phaser/ui/StatusView.ts`
- `tests/core/assetRegistry.test.ts`
- `tests/e2e/fullRunSmoke.mjs`

## Suggested Worktree

- Branch: `feature/overall-game-ui-redesign`
- Worktree: `.worktrees/overall-game-ui-redesign`

## Implementation Notes

- 先拆 UI helper，再逐畫面重設，不要在單一巨大方法裡繼續堆 layout。
- 優先完成 Combat 與 Map，因為這兩個畫面最能修正「像網頁」的問題。
- 每完成一個主要畫面就截圖檢查，避免最後一次才發現整體版面失控。
- 若 E2E 因 UI 重排失敗，優先修正 `buttons` text state 與測試 helper，而不是降低 UI 品質。

