# Accessibility And Responsive Backlog

## Backlog ID

`gameplay-accessibility-responsive`

## Worktree Size

小到中型，一個 worktree。

## Player Problem

目前 UI 是 1280x720 Canvas FIT，桌面可用，但不同瀏覽器尺寸、筆電小螢幕、色弱或文字閱讀需求還沒檢查。卡牌文字也可能在不同字型環境下擠壓。

## Scope

- 定義 1280x720、1024x768、390x844 三種檢查 viewport。
- 大字/高對比模式。
- 鍵盤 fallback：Tab/Enter 或快捷鍵選卡、結束回合。
- 重要資訊不只靠顏色，搭配 icon/文字。
- Canvas scale 後 pointer 座標確認。

## Out Of Scope

- 不做完整 WCAG 驗證。
- 不做螢幕閱讀器完整支援，Canvas 遊戲先以 text state 輔助測試。

## Acceptance Criteria

- 主要按鈕在三種 viewport 不被裁切。
- 卡牌核心資訊可讀。
- 色彩狀態至少有文字或圖示輔助。

## Tests

- Playwright 多 viewport 截圖。
- E2E 驗證縮放後按鈕座標仍可點。
- 手動檢查高對比模式。

## Likely Files

- `src/scenes/GameScene.ts`
- `src/style.css`
- `tests/e2e/*`

