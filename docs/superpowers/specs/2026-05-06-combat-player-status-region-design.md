# Combat Player Status Region Design

## 背景與目前問題

`19-combat-player-status-region-backlog.md` 目標是重新設計戰鬥畫面左上玩家狀態區。

目前左上區由 `renderCombatPlayerPanel()` 繪製為黑色半透明矩形，內含 HP、能量、格擋與牌組數。它可讀、穩定，也符合現階段測試需求，但視覺上仍像 debug panel。玩家需要在戰鬥中快速判斷：

- 自己還剩多少 HP，是否接近危險線。
- 目前格擋是否足以承受敵人攻擊。
- 目前能量是否足以打出手牌。
- 抽牌堆、棄牌堆與目前手牌資源的大致狀態。

這個區域位於左上角，不能遮擋中央敵人、下方手牌或右下回合動作區。它也不能把重要數字嵌在圖片裡，否則 Phaser 動態更新與 E2E 觀測會變弱。

## 已確認方向

戰鬥主視覺採用 `externals/battle-design-proposal-1.png`。左上玩家狀態區應跟這個主視覺一致：暗色街頭戰鬥 HUD、低噪音、功能性優先，使用 cyan / magenta / yellow 作為少量狀態強調。

本 backlog 採用 **B1：功能裝置元件組**：

- 左上玩家狀態 UI 拆成多個可組合透明 PNG 元件。
- 圖片負責外框、材質、槽位、裝置感與少量邊緣裝飾。
- Phaser 負責排版、文字、數字、bar fill、能量亮起狀態與狀態變化。
- 不使用目前的 `public/assets/ui/combat/player-panel.png` 作為 runtime 主面板，因為它的 chibi 貼紙面板風格太高噪音，會跟 proposal-1 背景、手牌與敵人搶視線。
- 可使用現有 `public/assets/characters/seeker.png` 作為小型玩家 portrait 或剪影點綴，但它不是必要資訊承載物。
- HP、格擋、能量、牌堆數字、狀態 label 都必須由 Phaser 動態文字渲染。
- `window.render_game_to_text()` 必須新增玩家狀態區 snapshot，讓測試能觀察 UI 呈現狀態，而不是只觀察 core combat 數值。

## 曾考慮的替代方案與取捨

### 方案 1：維持純黑半透明區塊

優點是最穩定、最小改動、可讀性已經足夠。缺點是玩家感受仍像工程面板，無法達成「戰鬥 UI redesign」的目標，也無法建立後續左側 HUD 的正式視覺規格。

決策：不採用作為完成狀態，但保留它的可讀性原則。

### 方案 2：完整生成玩家面板素材

使用 `public/assets/ui/combat/player-panel.png` 或重新生成一張大型面板，能立刻增加美術感。缺點是目前專案已確認主要 combat UI 區域不應使用高噪音 generated surface；如果把 HP、能量、格擋放進華麗貼紙框，容易造成文字擠壓，也會增加素材 prompt、透明邊緣與縮放驗收成本。

決策：不作為本 backlog 主方向。若後續視覺驗收認為左上仍太素，可以在另一個素材 backlog 補一張低噪音外框，但不能嵌入動態文字。

### 方案 3：B1 功能裝置元件組

將左上 UI 拆成 panel shell、HP bar frame、block badge、energy pip strip、deck counter plate。素材只承載質感與槽位，Phaser 疊動態文字、數字與填充值。這保留 proposal-1 的街頭暗色裝置感，也維持數值清楚與測試可觀測性。

決策：採用。

### 方案 4：角色頭像導向元件組

加重 `seeker.png` 的 portrait frame，讓左上 UI 更像角色狀態面板。優點是玩家身份感強；缺點是左上空間小，portrait 容易擠壓 HP / 格擋 / 能量。

決策：不採用作為本 backlog 主方向；可在 B1 shell 中保留一個小 avatar 槽位，但不可讓 portrait 壓過狀態資訊。

### 方案 5：極簡裝飾元件組

只產生角飾、狀態燈、能量小圖示，主要面板仍由 Phaser shapes 畫。優點是最穩；缺點是美術完成度不如 B1。

決策：不採用，因為本次目標包含實際產生左上 UI 素材元件。

## 設計目標

- 左上玩家狀態區看起來像正式戰鬥 HUD，不是 debug panel。
- 玩家一眼能讀到 HP、格擋與能量。
- HP、格擋、能量變化時有明確但不吵的回饋。
- 牌組、棄牌、抽牌或手牌資源資訊可讀，但視覺層級低於 HP / 格擋 / 能量。
- 所有動態數值與主要文字由 Phaser 渲染。
- 不改核心戰鬥數值規則。
- 不影響中央敵人區、右上進度區、右側 ticker、右下 turn action、下方手牌。
- `window.render_game_to_text()` 可觀察玩家狀態區的 layout / values / warning state。

## 非目標

- 不改 HP、格擋、能量上限或戰鬥規則。
- 不重做整個 combat layout。
- 不實作完整狀態效果系統 UI；若未來有 weak / frail / bleed 等玩家狀態 icon，應另開 backlog。
- 不重新生成所有 combat UI 面板。
- 不把 HP、能量、格擋、牌堆數字、中文 label 寫進圖片。
- 不改右下 turn action 的能量規則；若右下也顯示能量，左上要以玩家狀態總覽為定位，避免重複搶焦點。

## 主要畫面設計

### 區域定位

沿用現有左上位置，保留在 `combatLayout.playerPanel` 附近。預期尺寸約 `318x178` 到 `340x190`，可在 implementation plan 中根據截圖微調，但不得向中央戰場大幅擴張。

區域分三層：

1. **玩家身份與 HP 主列**
   - 左側可放小型 Seeker portrait 或簡化 avatar badge。
   - 右側顯示 `HP`、目前 HP / Max HP、大型 HP bar。
   - HP bar 使用 magenta / red 系列，低 HP 時進入 warning state。

2. **戰鬥防護與能量列**
   - 格擋使用綠色或黃綠色 shield-like pill。
   - 能量使用 cyan 狀態燈或 3 格 pip，文字顯示 `能量 N/3`。
   - 這一列要比 HP 小，但比牌堆 counters 大。

3. **牌堆資源 counters**
   - 顯示抽牌堆、棄牌堆、消耗堆或牌組剩餘資訊。
   - 若目前 core snapshot 無法穩定提供所有區分，MVP 至少顯示 `抽牌`、`棄牌` 與 `手牌` 或現有可得的 deck/discard/hand counts。
   - counter 字級小，使用 muted color，避免搶 HP。

### 視覺語言

- 面板底為深色半透明 glass / street HUD。
- 邊框使用 proposal-1 的低噪音 cyan / magenta / yellow 切角線，不使用高彩度角色面板。
- HP bar、能量 pip、格擋 pill 都用清楚幾何形狀。
- 低 HP warning 可使用短暫 pulse 或邊框色變，不使用大幅 shake。
- 格擋增加時可沿用既有 combat feedback 的浮字語言，但玩家狀態區本身應顯示數值變化後的穩定狀態。

## 系統設計

### Core 邊界

Core combat state 已提供玩家 HP、Max HP、block、energy、hand 等數值。本 backlog 不應新增規則，只應整理 UI 所需的 presentation snapshot。

若需要統一 UI 判斷，可在 Phaser 或 core-facing adapter 增加純 query helper，例如：

```ts
export interface CombatPlayerStatusUiState {
  hp: number;
  maxHp: number;
  hpRatio: number;
  hpState: "healthy" | "wounded" | "critical" | "dead";
  block: number;
  hasBlock: boolean;
  energy: number;
  maxEnergy: number;
  drawPileCount: number;
  discardPileCount: number;
  handCount: number;
}
```

`hpState` 是 UI 派生狀態，不改變 gameplay。建議門檻：

- `healthy`: HP ratio > 0.5
- `wounded`: 0.25 < HP ratio <= 0.5
- `critical`: 0 < HP ratio <= 0.25
- `dead`: HP <= 0

### Phaser UI

`src/phaser/ui/CombatSceneView.ts` 應保留 combat layout helper，並讓 `renderCombatPlayerPanel()` 接受整理後的 UI state，而不是在 render function 裡混合太多規則推論。

渲染職責：

- 繪製 panel 背板、切角邊框、分隔線。
- 繪製 HP bar、energy pips、block pill、deck counters。
- 保持文字不溢出、不重疊。
- 在低 HP 或有格擋時套用簡單 presentation state。

### Snapshot / 測試 hook

`window.render_game_to_text()` 應新增 `playerStatusUi`，至少包含：

```ts
playerStatusUi: {
  hp: number;
  maxHp: number;
  hpRatio: number;
  hpState: "healthy" | "wounded" | "critical" | "dead";
  block: number;
  hasBlock: boolean;
  energy: number;
  maxEnergy: number;
  drawPileCount: number;
  discardPileCount: number;
  handCount: number;
  visible: boolean;
  reference: "battle-design-proposal-1";
}
```

這個 snapshot 是 UI contract，不取代既有 `combat.playerHp` / `combat.energy`。E2E 應同時確認兩者一致，避免 UI snapshot 與 core snapshot 分離。

## 素材策略與產出清單

本 backlog 會新增 4 張左上玩家狀態 UI 元件素材。所有素材都必須是 PNG，存放於 `public/assets/ui/combat/`，並在 `docs/assets/image-generation-prompts.jsonl` 登記來源與 prompt/history。

這批素材必須 **看著 `externals/battle-design-proposal-1.png` 最左上玩家狀態區忠實重畫成一個完整元件**。不得裁切、遮罩、描像素或直接處理主視覺原圖作為 runtime asset；也不得把主視覺只當靈感重新設計成另一套 UI。

可使用的既有素材：

- `public/assets/characters/seeker.png`：可作為小 portrait，但不承載數值。
- `public/assets/ui/combat/battle-bg.png`：主視覺背景參考。

新增素材：

| Runtime Use | Asset | Size | Role |
| --- | --- | ---: | --- |
| 完整左上狀態底板 | `public/assets/ui/combat/player-status-base.png` | 420x240 | 忠實重畫主視覺左上整體：骷髏/皇冠 emblem、HP 長條、青色能量板、綠色格擋板。 |
| HP 填充值槽 | `public/assets/ui/combat/player-status-hp-fill-slot.png` | 260x48 | 對齊底板 HP 長條的局部槽位；Phaser 繪製紅色填充值與 HP 文字。 |
| 能量數值槽 | `public/assets/ui/combat/player-status-energy-value-slot.png` | 180x54 | 對齊底板青色能量板的局部槽位；Phaser 繪製能量文字與數字。 |
| 格擋數值槽 | `public/assets/ui/combat/player-status-block-value-slot.png` | 180x54 | 對齊底板綠色格擋板的局部槽位；Phaser 繪製格擋文字與數字。 |

不建議 runtime 使用：

- `public/assets/ui/combat/player-panel.png`：目前 prompt 是高彩度 chibi 狀態精靈面板，與本 backlog 的低噪音功能 HUD 方向不一致。

素材硬性規則：

- 必須以 `externals/battle-design-proposal-1.png` / `public/assets/ui/combat/battle-bg.png` 的暗色街頭裝置感為主視覺。
- 必須對齊 `externals/battle-design-proposal-1.png` 最左上玩家區的拓撲：左側突出的鋸齒 avatar/emblem socket、右側 HP 長條、下方青色能量板與綠色格擋板。
- 必須忠實重畫主視覺原本的輪廓、白色粗框、青色/綠色板、洋紅刮痕與粗糙材質；不得自由重畫成另一套類似 UI，也不得直接裁切處理原圖。
- 必須低噪音、功能性優先，不使用 chibi mascot-heavy panel。
- 不得任意拆成互不相連的 UI 卡片；主素材必須是一個完整左上狀態元件。
- 必須透明背景。
- 必須保留足夠內部空白，讓 Phaser 疊文字與數字。
- 不得包含 readable text、numbers、HP、能量、格擋、抽牌、棄牌、手牌 label。
- 不得包含敵人、卡牌、浮水印或新角色；shell 應忠實重畫主視覺左上原本的骷髏/皇冠 emblem，因為它是已確認主視覺的一部分。
- 不得使用大面積高彩度貼紙裝飾搶走手牌與敵人視線。

## 測試與驗收策略

必要驗證：

- `npm test`
- `npm run build`
- `npm run test:e2e`
- Codex app browser 或 develop-web-game Playwright 檢查 combat screenshot。
- 檢查 `window.render_game_to_text().playerStatusUi`。
- 檢查 console/page errors。

建議新增或更新測試：

- 純 helper test：HP ratio 與 `hpState` 對應正確。
- Phaser/UI helper test：player status snapshot 包含 HP、block、energy、deck counters，且與 combat snapshot 數值一致。
- E2E：進入戰鬥後確認 `playerStatusUi.reference === "battle-design-proposal-1"`。
- E2E：打出格擋牌後，`playerStatusUi.block > 0` 且 `hasBlock === true`。
- E2E：敵人回合造成傷害後，`playerStatusUi.hp` 與 `combat.playerHp` 同步下降。

視覺驗收：

- 左上區不遮擋敵人、手牌或背景主視覺。
- HP、格擋、能量在 1280x720 截圖中可一眼辨識。
- 最長文字不溢出 panel。
- 低 HP 狀態可見但不干擾出牌與敵人閱讀。

## 風險

- **與右下能量重複**：右下 turn action 也可能顯示能量。左上應把能量當玩家總覽的一部分，字級與亮度不要高於右下操作狀態。
- **過度素材化**：若左上變成大型貼紙面板，會破壞 proposal-1 低噪音戰鬥背景方向。MVP 應先用 Phaser HUD 完成。
- **牌堆語意不清**：如果 draw/discard/exhaust 的 core 欄位命名與玩家理解不同，需在 implementation plan 中先確認資料來源，避免顯示錯誤。
- **snapshot 分裂**：新增 `playerStatusUi` 後，必須在測試中確認它與 `combat` snapshot 一致，避免 UI contract 變成另一套真相。
- **左上空間不足**：若同時塞 avatar、HP、block、energy、三個 counter，可能擁擠。implementation 應優先保 HP / block / energy，牌堆 counters 可縮小或排到面板底部。

## 驗收標準對應

- 玩家能一眼理解 HP、格擋與能量：透過 HP 主列、block pill、energy pip/text 達成。
- 玩家狀態區不遮擋背景、敵人或手牌：沿用左上 bounded layout，限制尺寸。
- HP/格擋/能量變化有清楚回饋且不重疊：使用穩定 bar/pill/pip 與可測 snapshot。
- 若使用素材圖，素材規格與 prompt 必須寫入 `docs/assets/`：本 spec 已定義 4 張新增素材，並要求先更新 `docs/assets/` 與 JSONL prompt 後才可生圖。
