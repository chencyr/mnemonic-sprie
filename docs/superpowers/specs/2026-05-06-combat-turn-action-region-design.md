# Combat Turn Action Region Design

## 背景與目前問題

`22-combat-turn-action-region-backlog.md` 目標是重新實作戰鬥畫面右下角的回合動作區。

目前右下區只是黑色半透明容器，顯示回合、能量與 `結束回合` 按鈕。這能暫時支撐操作，但還不是完整 UI Design 實現。玩家需要在這個區域清楚理解：

- 現在第幾回合。
- 目前能量是多少。
- 是否可以結束回合。
- 若不可操作，原因是敵人階段、結束中、勝利過場，還是其他狀態。

同時，這個 backlog 不是要改戰鬥流程本身。真正的回合 sequence，例如棄牌、敵人逐一行動、抽牌、新回合，屬於 `04-turn-flow-pacing`。

## 已確認方向

本 backlog 是 **右下 Turn Action UI 的完整視覺實作**：

- 依主視覺製作右下 turn action panel 素材。
- 素材提供框、底板、裝置感、按鈕底座、狀態燈或能量槽裝飾。
- 動態文字、數字、回合、能量、按鈕 label 不嵌入圖片。
- Phaser 透過 core query API 取得規則狀態，再映射成 UI presentation state。
- Phaser 透過明確 command API 呼叫 core，不直接在 UI 中偷改規則狀態。

主視覺方向採用 **暗色街頭裝置面板**：

- 跟 proposal-1 戰鬥背景一致。
- 深色玻璃感 / 街機控制板感。
- cyan / magenta / yellow 少量霓虹邊緣。
- 低噪音，不能搶手牌、敵人與戰況 ticker 的視線。

## 曾考慮的替代方案

### 方案 1：只用黑色半透明容器加文字

這最容易實作，也延續目前臨時方案。但它無法達成「UI Design 實現」，也無法建立之後其他區域 backlog 的素材化標準。

決策：不採用。

### 方案 2：貼紙式高彩度回合裝置

使用更強 style-teradadara-like 貼紙裝置，按鈕非常醒目。這會比較有遊戲感，但右下是操作與狀態判讀區，太花會干擾能量、回合與按鈕狀態。

決策：不採用作為本 backlog 主方向。

### 方案 3：暗色街頭裝置面板

保留主視覺街頭感，但讓回合動作區更像功能裝置：清楚、低噪音、有材質、有狀態燈。動態文字與按鈕由 Phaser 渲染。

決策：採用。

## 設計目標

- 右下回合動作區看起來是正式 UI，不是臨時 debug panel。
- 玩家能一眼看懂目前回合、能量與是否可結束回合。
- 當 UI 不可操作時，能顯示明確原因。
- Core 提供 query / command 邊界，Phaser 不直接推論規則。
- `window.render_game_to_text()` 暴露 `turnActionUi`，讓 E2E 可以驗證 UI 狀態。
- `?e2e=1` 的 `測試勝利` 保持左下，不進入正式 turn action panel。

## 非目標

- 不改 `endRunTurn` 的核心解析邏輯。
- 不實作完整 action queue。
- 不拆敵人逐一行動動畫。
- 不改能量上限或卡牌費用規則。
- 不重新設計玩家狀態、敵人區、手牌區、ticker 或進度狀態區。
- 不把動態文字、數字、按鈕 label 寫死在圖片中。

## Core API / RPC 邊界

本專案是單機遊戲，這裡的 RPC 指的是 **Phaser 對 core 的本機 command/query boundary**，不是網路 RPC。

### Query API

Core 或 core-facing adapter 應提供：

```ts
export type CombatTurnActionSuggestedUiState =
  | "notCombat"
  | "playerReady"
  | "playerNoPlayableCards"
  | "enemyPhase"
  | "victory"
  | "defeat";

export interface CombatTurnActionState {
  mode: "notCombat" | "combat";
  combatPhase?: "player" | "enemy" | "victory" | "defeat";
  turn?: number;
  energy?: number;
  maxEnergy: number;
  canEndTurn: boolean;
  canPlayAnyHandCard: boolean;
  endTurnDisabledReason?: string;
  suggestedUiState: CombatTurnActionSuggestedUiState;
}

export function getCombatTurnActionState(engine: RunEngine): CombatTurnActionState;
```

Core query 負責回答規則事實：

- 是否在 combat。
- combat phase。
- 回合數。
- 目前能量。
- 能量上限，MVP 為 3。
- 是否有任何可出牌。
- 是否可以結束回合。
- 不能結束回合的規則原因。
- 建議 UI state。

此 query 不負責 Phaser transition，例如 `manualEnding`、`autoEndingNoPlayableCards`、`victoryPresentation`。這些是 Phaser presentation state。

### Command API

右下正式 UI 只能呼叫既有 core command：

```ts
endRunTurn(engine, { completeVictory: false });
playRunCard(engine, cardInstanceId, targetEnemyId, targetCardId, { completeVictory: false });
completeCurrentCombat(engine);
```

`autoWinCombat(engine)` 是 `?e2e=1` 測試 API，不屬於正式 turn action panel 的 command。

### Phaser Presentation Mapping

Phaser 將 core query state 加上 scene transition state，映射成 UI state：

```ts
export type TurnActionUiState =
  | "playerReady"
  | "playerNoPlayableCards"
  | "manualEnding"
  | "autoEndingNoPlayableCards"
  | "enemyActing"
  | "victoryPresentation"
  | "disabled";

export interface TurnActionUiSnapshot {
  state: TurnActionUiState;
  title: string;
  message: string;
  turn: number;
  energy: number;
  maxEnergy: number;
  endTurnEnabled: boolean;
  endTurnDisabledReason?: string;
  quickWinVisible: boolean;
}
```

Mapping rules:

- Core `playerReady` + no transition => `playerReady`
- Core `playerNoPlayableCards` + no transition => `playerNoPlayableCards`
- Phaser `turnTransition.kind === "manual"` => `manualEnding`，主按鈕文字圖切成 `敵方回合`，不顯示「回合切換中」字樣。
- Phaser `turnTransition.kind === "autoNoPlayableCards"` => `autoEndingNoPlayableCards`，主按鈕文字圖切成 `敵方回合`，不顯示「回合切換中」字樣。
- Core `enemyPhase` => `enemyActing`
- Phaser `victoryTransition` => `victoryPresentation`
- Not combat or unsupported state => `disabled`

## UI Design

### Runtime Asset Slots

新增或整理以下素材槽：

| Runtime Use | Proposed File | Size | Transparency | Notes |
| --- | --- | ---: | --- | --- |
| End turn button plate | `public/assets/ui/combat/end-turn-button-plate.png` | 340x180 | Yes | 依 proposal-1 右下角 UI 重新繪製的大顆青色斜切按鈕底板，含粉紅背板與周圍爆炸貼紙特效，不含文字。 |
| End turn label | `public/assets/ui/combat/end-turn-label.png` | 220x72 | Yes | `結束回合` 文字圖，疊在大顆按鈕底板上。 |
| Enemy turn label | `public/assets/ui/combat/enemy-turn-label.png` | 220x72 | Yes | `敵方回合` 文字圖，敵人階段替換按鈕文字。 |
| Turn energy frame | `public/assets/ui/combat/turn-energy-frame.png` | 300x96 | Yes | 金邊黑底回合/能量資訊框，不含文字、數字與閃電。 |
| Energy lightning icon | `public/assets/ui/combat/energy-lightning-icon.png` | 64x64 | Yes | 獨立青色閃電能量 icon，由 Phaser 依目前能量數量排列。 |

素材生成必須先更新 `docs/assets/image-generation-prompts.jsonl`，並符合 AGENTS.md 規則。

已確認的大顆按鈕方向是「直接重新繪製一張完整素材」，不是從 `externals/battle-design-proposal-1.png` 程式切圖。按鈕本體需要比早期 340x130 試作更高，正式規格為 340x180，避免右下操作區看起來太扁。

### Phaser Dynamic Content

右下區由 Phaser 疊加：

- 回合數，例如 `回合 3`。
- 能量，例如 `能量 2/3`。
- 能量閃電 icon，依目前能量數量重複顯示。
- `結束回合` / `敵方回合` 文字圖，依狀態切換。
- disabled reason。

### Layout

- 右下 panel 保持在 `combatLayout.turnDevice` 附近。
- Panel 不得遮擋手牌。
- Panel 不得和右側 ticker 重疊。
- `測試勝利` 保持左下，只在 `?e2e=1` 顯示。
- 右下 panel 的按鈕尺寸必須穩定，不因文字長短造成 layout shift。
- 大顆按鈕底圖向左旋轉約 20 度；按鈕文字圖跟隨斜切方向但右旋回正約 5 度，最終約為左旋 15 度。文字圖需要稍大並往右內移，落在青色按鈕主體安全區內。
- 回合/能量狀態框縮小到原先約 50%，左界對齊大顆按鈕左界，並下移靠近大顆按鈕上緣。
- 回合/能量狀態框內的文字與能量 icon 需更緊湊、更醒目，整組內容可稍微往右集中；E2E 必須檢查文字與 icon bounds 不超出狀態框 bounds。

## 測試與驗收策略

### Unit Tests

- `getCombatTurnActionState(engine)`：
  - non-combat 回傳 `notCombat`。
  - player phase 有可出牌時回傳 `playerReady`。
  - player phase 無可出牌時回傳 `playerNoPlayableCards`。
  - enemy/victory/defeat phase 回傳對應 state。
  - `canEndTurn` 和 disabled reason 正確。

- Phaser UI mapper：
  - manual transition 顯示 `manualEnding`。
  - auto transition 顯示 `autoEndingNoPlayableCards`。
  - victory transition 顯示 `victoryPresentation`。

### E2E / Browser Verification

- 戰鬥開始時右下 panel 顯示回合與能量。
- 點擊 `結束回合` 後顯示 manual ending 狀態。
- 沒有可出牌時顯示 auto ending 狀態。
- 敵人或勝利過場時 `結束回合` disabled。
- `window.render_game_to_text().turnActionUi` 和畫面一致。
- `?e2e=1` 的 `測試勝利` 仍在左下，不在右下正式 panel 中。
- 使用 Codex in-app browser / develop-web-game 驗證 screenshot、text state、console/page errors。

## 風險

- 若素材過度花俏，會再次搶走戰鬥焦點。Prompt 必須強調 dark functional device、low noise、no readable text。
- 若 core query 直接依賴 Phaser transition，就會破壞 framework-neutral 邊界。Transition state 必須留在 Phaser。
- 若 `turnActionUi` 暴露過多 UI 細節，E2E 會變脆弱。Snapshot 只暴露狀態、文案、按鈕 enabled、能量與回合。
- `04-turn-flow-pacing` 之後可能重寫回合 sequence。本 backlog 的 UI state mapper 必須能被 `04` 擴充，而不是把所有 phase 寫死在 `GameScene`。
