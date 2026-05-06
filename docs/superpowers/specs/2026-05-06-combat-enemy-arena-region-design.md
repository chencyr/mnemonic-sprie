# Combat Enemy Arena Region Design

## 背景與目前問題

`24-combat-enemy-arena-region-backlog.md` 目標是整理戰鬥畫面正中央的敵人區域。

目前敵人已能顯示 sprite、HP、意圖、目標選取與死亡半透明樣貌，但死亡狀態仍容易和流程判定不同步。玩家已觀察到敵人死亡後可能在下回合從半透明變回實體，這代表敵人的遊戲狀態、畫面狀態、勝利判定順序沒有被清楚分層。

這份設計先不追求華麗舞台，而是優先修正戰鬥過程的正確性：敵人何時活著、何時死亡、何時可被攻擊、何時可行動、何時允許進入勝利階段，都必須由狀態機清楚決定。

## 已確認方向

本 backlog 採用 **A：狀態機與流程正確優先**。

核心原則：

- Core combat logic 決定敵人的 gameplay state。
- Phaser scene 決定敵人的 presentation state。
- Victory / reward 不能只看 HP 或 core dead state，還要等 Phaser 死亡過場完成。
- 死亡敵人必須保持死亡樣貌，不可在下一次 render 或敵人回合中回到 alive 視覺。

## 曾考慮的替代方案

### 方案 1：Core 與 Phaser 分層狀態機

Core 保留敵人真實 gameplay state，例如 `alive` / `dead`。Phaser 額外維護畫面狀態，例如 `alive` / `dying` / `dead`。當 core enemy 變成 dead，Phaser 先進入 `dying`，播放 1 秒死亡過場，完成後進入 `dead`。勝利判定等到所有死亡過場完成才繼續。

決策：採用。這能保持核心規則 framework-neutral，也符合未來可能移植 Godot 4 的方向。

### 方案 2：把動畫階段放進 Core

Core 直接產出 `enemyDying`、`victoryPending` 等動畫階段，Phaser 只照狀態顯示。這會讓測試容易，但會把動畫時間與 Phaser/Godot 呈現細節帶進核心規則。

決策：不採用。Core 不應被 1 秒動畫時間污染。

### 方案 3：只在 Phaser 修補 alpha bug

敵人死亡時在 Phaser 直接設 alpha、disable interactive、延遲 reward。這最快，但狀態責任不清楚，未來仍可能因 render 重建、回合切換或 E2E quick mode 再次復發。

決策：不採用作為主要設計。

## 設計目標

- Dead enemy 永遠不能被攻擊。
- Dead enemy 永遠不能行動。
- Dead enemy 在畫面上保持死亡樣貌。
- Alive/dead 的判斷不能依賴 alpha 或 sprite 外觀。
- Death transition 至少 1 秒，或由測試模式中的 fast config 明確縮短。
- Victory 判定必須等所有 enemy death presentation state 完成。
- `window.render_game_to_text()` 必須能觀察 gameplay state、presentation state、pending transition、victory blocked reason。

## 非目標

- 不改敵人 AI 或數值平衡。
- 不完整實作 `05-enemy-intent-status-clarity` 的 icon/status 系統。
- 不重畫玩家狀態區、手牌區、ticker、回合動作區。
- 不新增 Boss 或敵人種類。
- 不把死亡動畫素材化成正式 sprite sheet；本 backlog 可用 Phaser tween/flash/fade 完成。

## 狀態模型

### Gameplay State

Core enemy gameplay state 只描述規則層事實。

```ts
type EnemyGameplayState = "alive" | "dead";
```

規則：

- `alive`：可被選為攻擊目標，可在敵人回合行動。
- `dead`：不可被選為攻擊目標，不可在敵人回合行動，不計入敵人行動隊列。

若現有 core 尚未有明確 state 欄位，可先由 `hp > 0` / `hp <= 0` 封裝成 selector，但 Phaser 與 E2E 不應直接依賴 alpha 或文字樣貌判斷敵人是否活著。

### Presentation State

Phaser enemy presentation state 描述畫面過場。

```ts
type EnemyPresentationState = "alive" | "dying" | "dead";
```

規則：

- `alive`：正常顯示，可顯示 target ring，可接受 pointer/drag target。
- `dying`：播放死亡過場，不可被選取，不可行動，仍阻擋 victory/reward 進入下一階段。
- `dead`：固定死亡樣貌，半透明或低飽和，不可被選取，不可行動，不阻擋 victory。

## 狀態轉換

1. 敵人在 core 中從 `alive` 變成 `dead`。
2. Phaser 偵測到該敵人是「新死亡」：
   - presentation state 從 `alive` 進入 `dying`。
   - 清除 target/hover/drop 狀態。
   - 播放死亡過場，目標時長 1 秒。
3. 死亡過場完成：
   - presentation state 進入 `dead`。
   - enemy view 固定成死亡樣貌。
4. 若所有 gameplay enemy 都是 `dead` 且沒有 `dying` enemy：
   - 才允許進入 victory/reward 判定。

## UI 與互動規則

### Targeting

- 自動選敵只可選 `gameplayState === "alive"` 且 `presentationState === "alive"` 的敵人。
- 拖曳攻擊牌到 `dying` 或 `dead` enemy 上時，視為無效目標。
- 場上一個 alive enemy 時，攻擊牌自動選該敵人。
- 場上沒有 alive enemy 但仍有 dying enemy 時，不可提前出牌，也不可直接進 reward。

### Enemy Action

- 敵人回合 action queue 只包含 alive enemy。
- 若敵人在玩家回合死亡，下一個敵人回合不能把它重新納入行動。
- 若多敵人中部分死亡，其他 alive enemy 仍可照規則行動。

### Death Visual

死亡過場不需要新素材，先用 Phaser 動畫：

- hit flash 或短震動。
- alpha / saturation / scale tween。
- 1 秒後固定為 dead style。

Dead style 必須穩定，不能因重新 render 還原到 alive style。

## 可觀測狀態

`window.render_game_to_text()` 應暴露敵人區狀態，至少包含：

- 每個 enemy 的 id/name。
- 每個 enemy 的 hp。
- 每個 enemy 的 `gameplayState`。
- 每個 enemy 的 `presentationState`。
- 是否有 `pendingDeathTransitions`。
- victory 是否被敵人 death transition 阻擋，例如 `victoryBlockedByEnemyTransitions: true`。
- 可選目標清單，或至少 alive target count。

這些欄位用於 E2E 驗證，而不是給玩家直接閱讀。

## 測試與驗收策略

### Unit / Core Tests

- Dead enemy 不出現在可行動敵人清單。
- Dead enemy 不出現在可攻擊目標清單。
- 多敵人中一個 dead 時，其他 alive enemy 行動不受影響。

### Phaser / UI Tests

- Enemy 從 alive 進入 dying 時，不再可被 target。
- Dying 完成後進入 dead 且保持 dead style。
- 下一次 render 後 dead style 不還原。
- Victory 在 death transition 完成前不進 reward。

### E2E / Browser Verification

- 使用 Codex in-app browser 或等效 develop-web-game Playwright client。
- 檢查攻擊敵人到死亡。
- 檢查死亡 1 秒過場期間仍在 combat。
- 檢查過場完成後才進入 reward/victory。
- 檢查 `window.render_game_to_text()` 中 gameplay/presentation state 一致。
- 檢查 console/page errors 為空。

## 風險

- 若目前 core 沒有 enemy state 欄位，直接新增 state 可能擴大影響面。可先用 selector 封裝，等後續需要再落正式欄位。
- Phaser scene 若每次 render 都重建 enemy view，presentation state 必須存在 scene-level tracker，而不能只存在單次 render 的 local 變數。
- E2E quick mode 可能和 1 秒死亡過場衝突。必須有明確 fast animation config，不能讓測試靠任意等待。
- 若 victory 判定散落在多處，需要先集中入口，避免某處仍直接看 core `isCombatWon` 就跳 reward。

