# Phaser Game Feel Design

## Context

目前 `main` 已完成整體遊戲 UI redesign，畫面結構已經像 roguelike deckbuilder，但互動回饋仍偏靜態。玩家出牌、敵人受擊、敵人回合、玩家扣血、勝利進獎勵等狀態變化，大多是整個畫面重新 render 後直接跳到結果。

這會造成兩個問題：

- 玩家難以感覺「我剛剛的操作造成了什麼」。
- 戰鬥中玩家被扣血時，左側玩家面板顯示的是 `run.playerHp`，而不是 `combat.player.hp`，因此戰鬥中實際 HP 已變化但 UI 看起來沒有正常更新。

本 backlog 先處理戰鬥回饋與扣血顯示，不擴張到完整轉場或拖曳出牌。

## Confirmed Direction

採用 **B：戰鬥回饋優先**。

第一版目標是讓玩家明確感受到：

- 攻擊牌打到敵人。
- 敵人受到傷害、死亡或被格擋。
- 敵人回合造成玩家扣血或被格擋。
- 玩家 HP 在戰鬥中顯示正確，並搭配扣血動畫。

## Alternatives Considered

### A. 卡牌手感優先

優點是 hover、選牌、出牌飛行會讓手牌操作更像卡牌遊戲。缺點是它不直接解決玩家受擊與 HP 顯示錯誤，且拖曳/出牌流程之後已有獨立 backlog。

### B. 戰鬥回饋優先

優點是最直接改善「打人、被打、扣血」的遊戲感，也能順手修掉戰鬥中玩家 HP 顯示問題。這是本次採用方向。

### C. 整體轉場優先

優點是 title、map、combat、reward 間的流程會更流暢。缺點是對核心戰鬥可讀性的提升較間接，也不處理扣血顯示問題。

## Design Goals

- 修正戰鬥中玩家 HP 顯示，讓 UI 使用當前 combat state。
- 用短動畫強化攻擊、受擊、扣血、死亡、勝利的因果關係。
- 建立共用 Phaser FX helper，避免每個 UI component 手寫 tween。
- 保持核心規則 framework-neutral，不改 `src/core` 的戰鬥規則。
- 保持 E2E 穩定，動畫不能改變 snapshot button 座標。
- 先以 1280x720 desktop canvas 為驗收目標。

## Non Goals

- 不做拖曳出牌。
- 不重做卡牌規則或敵人 AI。
- 不新增素材、sprite sheet 或骨骼動畫。
- 不做完整音效 pass。
- 不做完整全畫面轉場系統；只做必要的 combat/reward entry feedback。
- 不讓 E2E 依賴動畫 frame 或時間點。

## Current HP Display Issue

目前資料流如下：

- `startCombatNode()` 建立 `currentCombat`，把 `run.playerHp` 傳入 `combat.player.hp`。
- 戰鬥中的傷害會更新 `combat.player.hp`。
- `run.playerHp` 只在 `completeCombat()` 時同步為 `combat.player.hp`。
- `renderPlayerPanel()` 目前吃 `RunState`，顯示 `run.playerHp / run.playerMaxHp`。

因此戰鬥中玩家被打後，UI 仍顯示戰鬥開始前的 HP。

設計修正：

- `renderPlayerPanel()` 支援覆寫目前 HP 與 max HP，或接受一個 `PlayerPanelState`。
- `GameScene.drawCombat()` 傳入 `combat.player.hp`、`combat.player.maxHp`、`combat.player.block`、`combat.player.energy`。
- 非戰鬥畫面仍使用 `run.playerHp`。
- `window.render_game_to_text()` 的 combat snapshot 增加 player hp/maxHp/block，讓 E2E 可以檢查戰鬥中 HP。

## FX Architecture

新增 `src/phaser/fx/`，先拆成兩類 helper。

### `combatFx.ts`

負責戰鬥事件的視覺回饋：

- `flashTarget(scene, target, color)`
- `shakeTarget(scene, target, intensity)`
- `floatText(scene, x, y, text, color)`
- `cameraHit(scene, strength)`
- `fadeOutOnDeath(scene, target)`

這些 helper 只操作 Phaser object，不知道核心規則。

### `screenFx.ts`

負責簡短進場效果：

- `staggerChildren(scene, container, options)`
- `fadeSlideIn(scene, target, direction)`
- `pulseButton(scene, target)`

第一版只用在 reward cards 和 combat elements，不建立複雜 transition state machine。

## Event Trigger Strategy

核心戰鬥事件已存在於 `combat.events`，例如：

- `DAMAGE_DEALT`
- `PLAYER_DAMAGED`
- `COMBAT_VICTORY`
- `COMBAT_DEFEAT`

GameScene 需要記錄上一次已處理的事件數量：

- `private lastCombatEventCount = 0`

每次 render combat 後，比對新事件：

- 取 `combat.events.slice(lastCombatEventCount)`
- 根據 event type 觸發 FX
- 更新 `lastCombatEventCount`
- 進入新 combat 時重設為 0

注意：render 會重建 display objects，所以 FX 不能依賴舊 object reference。需要在本次 render 建立 enemy/player 的可定位資訊，例如：

- `enemyAnchors: Map<enemyInstanceId, { x, y, container }>`
- `playerAnchor: { x, y, container }`

若事件 payload 找不到目標，仍可用 fallback 位置顯示浮字，不能讓遊戲中斷。

## Combat Feedback Design

### Enemy Hit

觸發：

- `DAMAGE_DEALT` 且 payload 有 `enemy` 與 `damage`。

效果：

- 目標 enemy container 進行短 shake。
- sprite 或 container 有白/紅 tint flash。
- 在敵人上方浮出 `-X`。
- 若敵人 HP 變 0，追加縮小或淡出。

限制：

- 不移動 enemy button descriptor。
- 動畫總長約 180-320ms。

### Player Damaged

觸發：

- `PLAYER_DAMAGED`。

效果：

- 左側玩家 panel 或 HP bar flash。
- 若 damage > 0，浮出 `-X HP`。
- camera 做低強度 shake。
- 若 damage = 0，浮出 `格擋` 或 `BLOCK`，不使用紅色扣血語言。

修正：

- HP bar 顯示立即使用 `combat.player.hp`。

### Combat Victory

觸發：

- combat 進入 reward 前，或 render reward 時根據上一個模式判斷。

第一版效果：

- Reward cards 使用 staggered fade/slide-in。
- 不阻塞 E2E 點擊；button descriptor 仍即時存在。

## UI Data And Snapshot Changes

`TextSnapshot.combat` 增加：

- `playerHp`
- `playerMaxHp`
- `playerBlock`

E2E 可以做：

- 進入 combat 後記錄 HP。
- 結束回合讓敵人行動。
- 重新讀 snapshot，若有 `PLAYER_DAMAGED` 且 damage > 0，確認 `combat.playerHp` 反映扣血後狀態。

因為 `run.hp` 在戰鬥中不會同步，E2E 不應再用 `run.hp` 驗證戰鬥中 HP。

## Testing Strategy

### Unit / Integration

- `npm test`
- 若抽出純 helper，可為事件 diff 建立小型 Vitest。
- 不測 Phaser tween frame。

### E2E

- `npm run test:e2e`
- 新增/調整探索測試：
  - 選擇 combat。
  - 可行時按 `end-turn` 讓敵人行動。
  - 檢查 combat snapshot 中 `playerHp` 有反映扣血。
  - 檢查 buttons 座標仍存在且可點。

### Manual Visual Review

用 browser / Playwright 截圖檢查：

- combat 初始畫面。
- 攻擊後敵人受擊畫面。
- 敵人回合後玩家扣血畫面。
- reward cards 進場畫面。

## Risks

- **Render 重建與 tween 衝突**：`GameScene.render()` 會 destroy root。FX 必須只針對本次 render 後的新 object 執行。
- **E2E flake**：動畫不能延後按鈕註冊，也不能讓 button descriptor 跟視覺位置分離。
- **事件重播**：若 `lastCombatEventCount` 重設不正確，可能每次 render 都重播傷害動畫。
- **HP 來源混淆**：戰鬥中用 `combat.player.hp`，戰鬥外用 `run.playerHp`，需在命名上明確區分。
- **過度動畫**：第一版只做短促回饋，避免每個 render 都讓整個畫面跳動。

## Acceptance Criteria

- 戰鬥中玩家被扣血後，左側 HP bar 和 snapshot 都立即顯示正確剩餘 HP。
- 敵人受到傷害時有可見 shake/flash 或傷害浮字。
- 玩家受到傷害時有 HP panel/HP bar feedback 和傷害浮字。
- Reward cards 有簡短進場動畫。
- E2E 仍穩定通過，不因 tween 造成點擊失效。
- `npm test`、`npm run build`、`npm run test:e2e` 全部通過。
