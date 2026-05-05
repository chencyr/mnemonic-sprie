# Overall Game UI Redesign Design

## Context

目前 MVP 已能跑完整流程，但 UI 不符合遊戲期待。問題不是單純缺少 Phaser 動效，而是整體 UI 沒有使用既有素材系統，也沒有呈現 roguelike deckbuilder 的主要資訊架構。

目前主要使用的素材只有角色、卡圖、敵人、事件圖。以下素材幾乎沒有進入核心 UI：

- `public/assets/ui/nodes/*`
- `public/assets/ui/intents/*`
- `public/assets/ui/contracts/*`
- `public/assets/relics/*`
- `public/assets/stickers/*`

因此玩家看到的是文字按鈕與少量縮圖，而不是完整卡牌遊戲介面。

## Confirmed Direction

採用 **B：爬塔戰鬥介面 UI**。

這個方向保留玩家熟悉的 deckbuilder 版面：上方敵人、下方手牌、左右資訊欄、地圖節點路線、獎勵/商店/事件面板。視覺上則強制使用現有素材，讓每個系統都有圖像承載。

## Alternatives Considered

### A. 貼紙桌面式 UI

優點是最貼近 sticker/graffiti 素材語言，整體更有個性。缺點是容易犧牲 deckbuilder 的清楚資訊層級，且要重新定義大量互動區。

### B. 爬塔戰鬥介面 UI

優點是資訊清楚、玩家熟悉、與目前核心流程最匹配，也能自然放入節點 icon、意圖 icon、卡牌、遺物、契約與記憶 sticker。缺點是若執行不夠積極，可能又退回泛用 deckbuilder UI。

### C. 街頭看板/手機介面 UI

優點是品牌感強。缺點是複雜度高，容易讓爬塔與戰鬥資訊變成裝飾化介面，不適合目前 MVP 先修正核心可讀性。

## Design Goals

- 讓 UI 一眼看起來是卡牌爬塔遊戲，而不是網頁面板。
- 讓既有素材成為主要 UI 語言，不只是點綴。
- 保留核心規則與 E2E 測試穩定性。
- 先以 1280x720 desktop layout 為主。
- 為後續 game feel、drag/drop、memory UX backlog 留出 component 邊界。

## Non Goals

- 不改核心戰鬥規則。
- 不調整卡牌數值、敵人數值、地圖生成邏輯。
- 不新增正式素材。
- 不做拖曳出牌。
- 不做手機 responsive。
- 不做完整動畫 pass。

## UI Architecture

### Component Boundary

Phaser presentation layer 應拆成可重用 UI components，避免 `GameScene.ts` 繼續成為大型 layout 方法集合。

目標 components：

- `HudView`: 全域狀態列、遺物列、契約列、音訊切換。
- `CardView`: 手牌、獎勵卡、商店卡商品共用。
- `EnemyView`: 敵人 sprite、HP、block、status、intent。
- `MapView`: 爬塔節點、連線、可到達狀態、已走路線。
- `RewardView`: 三選一、跳過、遺物獎勵。
- `ShopView`: 商品卡、價格、sold/disabled 狀態。
- `EventView`: 事件圖、選項、契約收益/代價。
- `RelicView`: relic icon 與 tooltip/短描述。
- `ContractView`: contract icon、剩餘次數、觸發條件。
- `StatusView`: HP bar、block、status badges、intent badge。

### Asset Access

Runtime 不應硬編素材路徑。`AssetRegistry` 需要補齊：

- `getNodeIcon(nodeType)`
- `getIntentIcon(intentType)`
- `getContractIcon(contractId)`
- `getMemorySticker(memoryType)`
- `getAudio(key)` 若後續需要一致 audio access

## Screen Designs

### Title

Layout：

- 中央偏左顯示 Seeker 大圖。
- 右側或下方顯示開始一局、目前版本/模式。
- 背景可使用深色爬塔輪廓與卡牌圖形，但不新增素材。

素材：

- `characters/seeker.png`
- 少量 `relics/broken_notes.png`
- `stickers/memory-empty.png`

驗收：

- 不像 marketing landing page。
- 開始按鈕清楚。
- 角色圖是第一視覺。

### Map

Layout：

- 中央為 12 層垂直/斜向爬塔節點圖。
- 每個節點使用 `ui/nodes/*` icon。
- 已走、可走、不可走三種狀態清楚。
- 右側小 panel 顯示目前路線提示與 active contracts。

素材：

- `ui/nodes/normal-combat.png`
- `ui/nodes/elite-combat.png`
- `ui/nodes/event.png`
- `ui/nodes/rest.png`
- `ui/nodes/shop.png`
- `ui/nodes/boss.png`

驗收：

- 節點 icon 是主要辨識方式，不再以 `戰 / 店 / 事 / 王` 為主。
- 可點節點明顯。

### Combat

Layout：

- 上方戰場：敵人與 Boss。
- 左側玩家 panel：HP、block、energy、draw/discard/exhaust。
- 右側 run panel：relics、contracts、combat log。
- 下方手牌：使用完整 card frame。
- End turn 固定在右下或玩家 panel 旁。

素材：

- `enemies/*`
- `cards/*`
- `ui/intents/*`
- `relics/*`
- `ui/contracts/*`
- `stickers/*`

驗收：

- 敵人 intent icon 可見。
- 卡牌顯示費用、名稱、類型、描述、記憶 sticker。
- 遺物和契約不再只是文字數量。
- 選中攻擊牌時，合法敵人目標有 highlight。

### Reward

Layout：

- 三張 reward cards 使用 `CardView`。
- Elite relic reward 使用 `RelicView`。
- Skip reward 低視覺權重但清楚。

驗收：

- Reward cards 與 hand cards 視覺一致。
- 描述不重疊。

### Shop

Layout：

- 商品分為 card item、relic item、remove service。
- 每個商品像可購買卡片/票券。
- 價格、買不起、已售出狀態清楚。

素材：

- card art
- relic icon
- placeholder/ui icon

驗收：

- 玩家能快速分辨商品類型。
- 不只是文字按鈕。

### Rest

Layout：

- 兩個主要選項：回血、變異。
- 顯示 rest node icon。
- 若可變異，顯示候選卡 preview 與記憶 sticker。

驗收：

- 變異是視覺焦點之一，不是一般按鈕。

### Event

Layout：

- 左側/背景使用 event image。
- 右側為 event body 與 option cards。
- 若 option 產生 contract，顯示 contract icon、benefit、cost、trigger。

驗收：

- 契約風險可視，不只是文字敘述。

### Victory / Defeat

Layout：

- Victory 使用 Boss 或 Seeker 素材搭配 run summary。
- Defeat 使用 Seeker 或 failure 風格面板。
- 提供 restart。

驗收：

- 不只是文字畫面。

## Data Flow

- Core state 不改。
- `GameScene` 從 `RunEngine` snapshot 讀資料，轉成 UI component props。
- UI component 只 dispatch command callback，不直接修改 core。
- `render_game_to_text()` 維持 buttons、mode、combat/map/reward/event state。

## Testing Strategy

### Automated

- `npm test`
- `npm run build`
- `npm run test:e2e`
- 更新 asset registry tests，覆蓋 node/intent/contract/sticker helper。
- E2E 必須仍能完成 quick-run。

### Visual

用 in-app browser 或 Playwright 截圖檢查：

- title
- map
- combat
- reward
- rest
- shop
- event
- victory 或 defeat

每張截圖檢查：

- 主要素材是否可見。
- 文字是否重疊。
- 按鈕是否可辨識。
- 介面是否不再像文字網頁。

## Implementation Order

1. 補 AssetRegistry helper 與測試。
2. 建立基礎 UI constants 與 component helpers。
3. 重做 HUD。
4. 重做 CardView。
5. 重做 EnemyView 與 Combat screen。
6. 重做 Map screen。
7. 重做 Reward / Shop / Rest / Event。
8. 重做 Victory / Defeat。
9. 更新 E2E 與截圖檢查。

## Risks

- `GameScene.ts` 目前太集中，若直接大改容易變得更難維護。必須先拆 component。
- Canvas text 在中文下可能溢出。需要固定寬度與截圖檢查。
- E2E buttons 座標若跟動畫或 component 封裝耦合，可能變 flaky。按鈕 text state 要維持穩定。
- UI redesign 範圍大，若時間失控，應優先完成 Combat、Map、Reward 三個核心畫面。

