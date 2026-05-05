# Drag Drop Card Play Design

## Context

目前戰鬥出牌流程是點擊卡牌後再點擊敵人或直接結算。這套流程穩定、適合 E2E，但玩家感受接近表單操作，不像卡牌遊戲。`01-phaser-game-feel` 已補上受擊、扣血、reward 進場與戰鬥音樂切換；下一步應把最核心的「拿起一張牌、放到戰場上」做出來。

本設計對應 `backlogs/02-drag-drop-card-play-backlog.md`。

## Confirmed Direction

採用拖曳操作方案 **A：拖到敵人或戰場後放開才出牌**。

已確認規則：

- 卡牌拖曳後放開才嘗試出牌。
- 點擊出牌保留為 fallback，不移除目前 E2E 可用的 click card / click target 流程。
- 攻擊牌若放到指定敵人上，就攻擊該敵人。
- 攻擊牌若沒有放到指定敵人上，系統自動選敵。
- 場上只有一隻活著的敵人時，自動選該敵人。
- 場上多隻敵人時，自動選目前 HP 最低的活著敵人。
- 非攻擊牌拖到戰場中央或玩家區，都視為出牌。
- 拖到無效區域，或卡牌不可用，卡牌回到手牌位置，不消耗能量。
- 不以「能量用完」直接自動換回合；每次出牌結算後檢查手上是否還有任何可出的牌，沒有才進入自動回合切換階段。
- 回合切換是一個明確的遊戲運行階段，可注入訊息。玩家主動結束回合顯示普通訊息，自動結束回合顯示特殊訊息。
- 戰鬥中音效不可只共用單一音效；互動與戰鬥事件要使用可分辨的 cue。戰鬥氛圍音樂已由 `audio:combatBgm` 提供。

## Alternatives Considered

### A. 放開才出牌

最接近卡牌遊戲直覺，也最不容易誤觸。玩家能在拖曳過程中改變主意，放錯地方時回手牌。本次採用。

### B. Hover 預覽，放開才出牌

目標提示最清楚，但第一版會增加 hover 狀態和視覺細節，容易把 scope 擴張到完整 targeting UX。後續可在本設計基礎上追加。

### C. 拖出門檻就自動出牌

節奏最快，但誤出牌風險高，也不利於有指定目標的攻擊牌。暫不採用。

## Design Goals

- 讓卡牌 GameObject 支援 drag start / drag / drop，出牌手感像卡牌遊戲。
- 保留現有 click fallback，避免行動裝置和 E2E 不穩。
- 讓 `window.render_game_to_text()` 可以觀察 drag/hover/selected/turn-transition 狀態。
- 拖曳失敗不得造成資源消耗或狀態錯亂。
- 自動結束回合要由遊戲 loop 階段處理，而不是藏在單張卡牌效果內。
- 音效透過 asset registry 與事件 cue 管理，不在 scene 中硬編任意檔案路徑。

## Non Goals

- 不改核心卡牌效果。
- 不做複雜物理碰撞或多指觸控。
- 不移除點擊模式。
- 不做完整 hover 預覽面板。
- 不做完整音效素材 pass；本次只建立 cue 使用規則與必要觸發點。
- 不重做整體戰鬥 layout。

## Interaction Model

### Drag State

`GameScene` 增加一個 Phaser 層的 drag state，至少包含：

- `cardInstanceId`
- `originX`
- `originY`
- `currentX`
- `currentY`
- `validDropZone`
- `hoverEnemyId`
- `reasonIfBlocked`

drag state 是 UI 狀態，不進 `src/core`。

### Drop Zones

本次使用簡單幾何判斷，不使用複雜 physics：

- Enemy zone：每個活著敵人的視覺區域加上合理 padding。
- Battlefield zone：`layout.battlefield` 的主要矩形。
- Player zone：左側玩家 panel 或玩家資訊區。
- Hand zone：原手牌區；放回手牌區視為取消。

### Card Play Resolution

拖曳放開時依序判斷：

1. 找出卡牌與定義；若不存在，取消拖曳。
2. 若 `effectiveCardCost(card) > combat.player.energy`，取消拖曳，顯示不可用提示，不消耗能量。
3. 若卡牌需要 `singleEnemy`：
   - 有 `hoverEnemyId` 時用該敵人。
   - 沒有指定敵人時，自動選敵。
4. 若卡牌是 `allEnemies`：
   - 在任意有效戰場釋放區放開即可出牌。
   - 目標敵人可傳 `undefined`，由核心效果處理全部敵人。
5. 若卡牌是 `self` 或 `none`：
   - 放到戰場中央或玩家區就出牌。
6. 若卡牌是 `handCard`：
   - 第一版沿用目前 fallback：自動選另一張手牌作為 target card。
   - 若沒有另一張可選手牌，視為不可出牌並取消拖曳。

自動選敵規則：

- 只看活著敵人。
- 若只有一隻，選該敵人。
- 若多隻，選 HP 最低者。
- 若 HP 相同，選畫面順序最前者，確保 deterministic。

## Turn Transition Stage

新增一個明確的回合切換 UI 階段，例如 `turnTransition` 或 `pendingTurnTransition`，放在 `GameScene` 的互動層管理。

這個階段包含：

- `kind`: `manual` 或 `autoNoPlayableCards`
- `message`: 顯示在戰況 log 或短暫 overlay
- `delayMs`: 建議 500-800ms
- `startedAt` 或等效 timer state

玩家按「結束回合」：

- 訊息使用普通語氣，例如「回合結束。」
- 進入相同的回合切換階段，再執行 `endRunTurn(engine)`。

出牌後自動檢查：

- 每次 `playRunCard` 成功後檢查手牌是否還有任何可出的牌。
- 若沒有可出牌，進入 `autoNoPlayableCards` 回合切換階段。
- 訊息使用特殊語氣，例如「沒有可出的牌，自動結束回合。」

可出牌定義：

- 卡片費用小於等於目前能量。
- 攻擊牌：場上至少有活著敵人。
- `self` / `none`：玩家可直接作為目標或不需目標。
- `handCard`：手上有另一張可作為 target card 的牌。

## Audio Design

戰鬥互動必須使用多個 cue，而不是整套系統只播一個音效。

第一版建議 cue：

- `cardDragStart`
- `cardDropPlay`
- `cardDropCancel`
- `attackHit`
- `blockGain`
- `enemyAttack`
- `autoEndTurn`

若正式音檔尚未齊全，implementation 可以先把這些 key 映射到既有 placeholder SFX，但程式 API 與資料表要保留不同 cue，避免日後替換素材時需要改 scene 邏輯。

戰鬥氛圍音樂：

- 戰鬥模式使用 `audio:combatBgm`。
- 非戰鬥模式使用 `audio:bgm`。
- 這是背景音樂，不替代短 SFX。

## Snapshot And E2E Hooks

`window.render_game_to_text()` 增加：

- `drag.active`
- `drag.cardInstanceId`
- `drag.hoverEnemyId`
- `drag.validDropZone`
- `drag.reasonIfBlocked`
- `turnTransition.kind`
- `turnTransition.message`
- `audio.currentMusic`

E2E 仍使用 button descriptors 驗證 fallback，同時新增 Playwright mouse path 測試拖曳。

## Testing Strategy

### Unit / Integration

- 測試自動選敵 helper：
  - 單敵人時選唯一活著敵人。
  - 多敵人時選 HP 最低者。
  - HP 相同時選畫面順序最前者。
- 測試可出牌判斷：
  - 費用不足不可出。
  - `handCard` 沒有另一張手牌不可出。
  - 有能量和合法目標時可出。

### E2E

- 保留現有 click fallback 出牌測試。
- 新增拖曳攻擊牌到敵人上釋放，敵人 HP 降低。
- 新增拖曳攻擊牌到戰場空白處，若有活敵人則自動選敵並造成傷害。
- 新增拖曳卡牌回手牌或無效區域，能量與手牌不變。
- 新增拖曳防禦牌到玩家區或戰場中央，玩家 block 增加。
- 新增無可出牌後自動回合切換狀態與訊息檢查。

### Manual / Develop Web Game

依 `AGENTS.md`，使用 `superpowers:executing-plans` 實作此 backlog 時必須同時使用 `develop-web-game`：

- 啟動本機遊戲。
- 使用 `$WEB_GAME_CLIENT` 或等效 Playwright client 驅動拖曳路徑。
- 檢查最新 screenshot。
- 檢查 `window.render_game_to_text()`。
- 檢查 console/page errors。

## Risks

- **render 重建拖曳物件**：拖曳期間若整個 scene 重新 render，card object 可能被 destroy。實作時要避免拖曳中主動 render，或把拖曳 preview 放在獨立 overlay。
- **button fallback 與 drag hit area 重疊**：卡牌仍有透明 click button。實作時要確保 pointerdown 可以啟動 drag，同時短點擊仍走 fallback。
- **E2E mouse path flake**：拖曳測試要使用 `render_game_to_text()` 的座標與狀態輔助，不只依賴固定 screenshot。
- **自動回合過快**：自動結束需要 500-800ms 節奏延遲，避免玩家看不到剛出的牌和訊息。
- **音效 key 先於素材**：若 cue 先建立但素材未齊，必須有 placeholder mapping，不能讓 preload 失敗。

## Acceptance Criteria

- 攻擊牌拖到敵人上釋放會出牌，敵人 HP 下降。
- 攻擊牌拖到有效戰場區但未指定敵人時，會依規則自動選敵。
- 場上只有一隻活敵人時，自動選敵必定選該敵人。
- 非攻擊牌拖到戰場中央或玩家區可出牌。
- 拖到無效區域會回手牌，不消耗能量。
- 費用不足或沒有合法 target card 時不可拖曳出牌，UI/snapshot 顯示原因。
- 點擊 fallback 仍可用。
- 出牌後若沒有任何可出的牌，進入可顯示訊息的自動回合切換階段。
- 手動結束回合與自動結束回合使用不同訊息。
- 戰鬥互動音效使用不同 cue，戰鬥背景音樂仍使用 `audio:combatBgm`。
