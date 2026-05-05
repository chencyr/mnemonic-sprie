# Combat Feedback Readability Design

## Context

本設計對應 `backlogs/03-combat-feedback-readability-backlog.md`。

目前戰鬥畫面已具備 Phaser 互動、拖曳出牌、敵人死亡狀態、死亡 1 秒轉場、手牌卡圖比例修正與基礎戰鬥 FX。玩家能看到 HP、能量、手牌、敵人意圖與右側文字 log，但仍需要閱讀很多小字才知道剛剛發生了什麼。

下一階段的重點不是增加規則，而是提升戰鬥事件的即時可讀性：傷害、格擋、記憶、抽牌、擊殺與回合切換都要在畫面上以清楚層級呈現。

## Confirmed Direction

採用方案 **C：混合式分層回饋**。

已確認的回饋層級：

- 關鍵數值事件使用局部跳字，出現在事件發生位置附近。
- 重要系統事件進入右側 ticker，取代目前依賴完整長 log 的閱讀方式。
- 只有高重要性事件才使用中央短摘要，例如死亡、Boss 對策、回合切換、記憶突破。
- 保留現有戰鬥 layout，不在本階段重做整個戰鬥 UI。

## Alternatives Considered

### A. 局部跳字優先

傷害、格擋、記憶都直接在來源附近跳出，右側 log 只保留少量 ticker。優點是直覺、成本低；缺點是一些跨區事件，例如抽牌、狀態、Boss 對策，仍可能缺乏脈絡。

### B. 中央行動摘要

每次出牌都在戰場中央顯示一條「誰做了什麼」。優點是敘事清楚；缺點是 deckbuilder 中事件密度高，中央摘要若每張牌都出現，會遮擋戰場與打斷節奏。

### C. 混合式分層回饋

局部跳字處理即時數值，ticker 處理系統事件，中央摘要只處理少數高重要性事件。這是本次採用方案，因為它能提高可讀性，同時避免畫面過度吵雜。

## Design Goals

- 玩家打出一張牌後，不需要讀長 log，也能理解主要結果。
- 傷害、格擋、記憶進度、抽牌、擊殺都有清楚視覺回饋。
- 右側戰況從完整事件列表改成精簡 ticker，優先顯示最近且重要的事件。
- `window.render_game_to_text()` 暴露目前仍在畫面上的回饋事件，讓 E2E 可以驗證。
- 保持 core rules framework-neutral；新增視覺回饋狀態應放在 Phaser 層。
- 既有死亡狀態機與 1 秒勝利轉場不能被破壞。

## Non Goals

- 不改 AI、卡牌效果、數值平衡或敵人行為。
- 不做完整戰鬥 replay。
- 不重做整體戰鬥 layout。
- 不新增大量素材。
- 不把每個 combat event 都做成中央大提示。
- 不引入新 UI framework；仍使用 Phaser UI helpers。

## Feedback Taxonomy

### 局部跳字

局部跳字用於玩家需要立即感知的數值變化：

- `DAMAGE_DEALT`：敵人附近顯示 `-N`，顏色使用紅色。
- `PLAYER_DAMAGED`：玩家 panel 附近顯示 `-N HP`；若傷害為 0，顯示 `格擋`。
- `BLOCK_GAINED`：玩家 panel 附近顯示 `+N 格擋`，顏色使用綠色或青色。
- `ENEMY_BLOCK_GAINED`：敵人附近顯示 `+N 格擋`。
- `MEMORY_PROGRESS_GAINED`：相關卡牌或玩家區附近顯示 `記憶 +1`，並使用記憶紫色。
- `CARDS_DRAWN`：手牌區附近顯示 `抽 N 張`。

### 右側 ticker

右側 ticker 顯示最近 4-6 條高價值事件，不再直接印出完整 `combat.events.slice(-8)`。

ticker 每條應包含：

- 短文字，例如 `斬擊造成 6 傷害`、`獲得 5 格擋`、`斬擊獲得嗜血記憶`。
- 類型，例如 `damage`、`block`、`memory`、`draw`、`death`、`turn`。
- 可選 icon 或色條，第一版可只用色條與文字。

ticker 排序以事件發生順序為準，最新事件靠下或靠上皆可，但需保持一致。

### 中央短摘要

中央短摘要只用於高重要性事件：

- 敵人死亡：`敵人被擊倒`
- 記憶達到可變異門檻：`記憶覺醒`
- Boss 對策揭示：`Boss 讀出了你的習慣`
- 自動回合切換：`沒有可出的牌`
- 勝利轉場：沿用 `敵人倒下，記憶正在沉澱。`

中央摘要要短、半透明、停留時間短，不遮擋卡牌操作區。

## Phaser Architecture

新增 Phaser 層的 presentation state，不進 `src/core`：

```ts
interface CombatFeedbackItem {
  id: string;
  type: "damage" | "block" | "memory" | "draw" | "death" | "turn" | "system";
  text: string;
  anchor: "player" | "enemy" | "hand" | "battlefield" | "ticker";
  enemyId?: string;
  cardInstanceId?: string;
  createdAt: number;
  expiresAt: number;
}
```

`GameScene.playCombatFx()` 目前直接消費 `CombatEvent` 並播放 `floatText()`。下一步應拆成兩層：

1. `mapCombatEventToFeedback()`：純函式，將 core event 轉為 presentation items。
2. `render / play feedback`：Phaser 依 feedback item 的 type 和 anchor 播放跳字、ticker 或中央摘要。

這樣 E2E 和 unit tests 可以驗證 event-to-feedback mapping，而不用依賴 screenshot 判斷文字。

## Data Flow

1. Core combat 產生 `CombatEvent[]`。
2. `consumeNewCombatEvents()` 找出本次 render 新增事件。
3. `mapCombatEventToFeedback()` 將新增事件轉為 `CombatFeedbackItem[]`。
4. `GameScene` 將 feedback items 存入短生命週期 state。
5. Phaser 播放局部跳字、更新 ticker、必要時顯示中央短摘要。
6. `window.render_game_to_text()` 暴露目前 active feedback items 和 ticker。

## Visual Rules

- 同一 anchor 同一瞬間有多個跳字時，垂直錯開，避免文字重疊。
- 跳字停留 600-900ms；重要事件最多 1200ms。
- ticker 不顯示超過 6 條。
- 顏色語意固定：
  - 傷害：紅色。
  - 格擋：綠色或青色。
  - 記憶：紫色。
  - 抽牌：金色或白色。
  - 系統/回合：淡黃或灰白。
- 右側 ticker 字級要比目前 log 略大或更高對比，避免玩家需要仔細讀。

## Snapshot And Testing Hooks

`window.render_game_to_text()` 增加：

- `feedback.active`: 目前畫面仍存在的 feedback item。
- `feedback.ticker`: 右側 ticker item。
- `feedback.centerMessage`: 若有中央摘要則暴露文字與類型。

範例：

```json
{
  "feedback": {
    "active": [
      { "type": "damage", "text": "-6", "anchor": "enemy", "enemyId": "sticker_punk-1" }
    ],
    "ticker": [
      { "type": "damage", "text": "斬擊造成 6 傷害" }
    ],
    "centerMessage": null
  }
}
```

## Testing Strategy

### Unit Tests

- `mapCombatEventToFeedback()`：
  - `DAMAGE_DEALT` 產生 enemy damage feedback。
  - `BLOCK_GAINED` 產生 player block feedback。
  - `MEMORY_PROGRESS_GAINED` 產生 memory feedback。
  - `CARDS_DRAWN` 產生 hand draw feedback。
  - `ENEMY_STATE_CHANGED` dead 轉換產生 death feedback。

### E2E

- 打出斬擊後，`render_game_to_text().feedback.active` 出現 `damage`。
- 使用格擋後，feedback 出現 `block`。
- 記憶增加後，feedback 出現 `memory`。
- 擊殺敵人後，feedback 或 center message 出現 `death`，且不破壞 1 秒勝利轉場。

### Develop Web Game / Manual

依 `AGENTS.md`，實作時必須使用 `develop-web-game`：

- 啟動本機遊戲。
- 用 Playwright 驅動出牌、格擋、擊殺。
- 檢查 screenshot 中跳字、ticker、中央摘要不互相重疊。
- 檢查 `render_game_to_text()` 的 feedback state。
- 檢查 console/page errors。

## Risks

- **事件重複播放**：render 重建時若 cursor 管理錯誤，跳字會重複出現。需沿用並測試 `consumeNewCombatEvents()`。
- **文字重疊**：同時觸發傷害、記憶、抽牌時可能擠在同一區域。需建立 anchor offset 規則。
- **ticker 過吵**：如果所有事件都進 ticker，玩家仍然需要讀長文字。需做事件優先級與文字壓縮。
- **狀態只存在於 tween**：feedback state 需可被 `render_game_to_text()` 觀察，不能只存在於 Phaser tween 物件。
- **死亡轉場回歸**：擊殺後的 death feedback 不能提前完成 combat；仍需等待既有 `victoryTransition`。

## Acceptance Criteria

- 打出斬擊時，敵人附近出現傷害數字，snapshot 可觀察 `feedback.active.type = "damage"`。
- 使用格擋時，玩家附近出現格擋數字，snapshot 可觀察 `feedback.active.type = "block"`。
- 記憶進度增加時，畫面有明確提示，snapshot 可觀察 `feedback.active.type = "memory"`。
- 右側戰況區改為最近事件 ticker，而不是完整長 log。
- 敵人死亡仍有淡出/死亡狀態，且額外出現 death feedback。
- `npm test`、`npm run build`、`npm run test:e2e` 通過。
- develop-web-game / Playwright 截圖確認回饋不重疊，且無 console/page errors。
