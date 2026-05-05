# Audio Gamefeel Backlog

## Backlog ID

`gameplay-audio-gamefeel`

## Worktree Size

小到中型，一個 worktree。

## Player Problem

目前有 BGM 與音訊槽，但 SFX 串接不完整，聲音不會強化操作回饋。卡牌、傷害、記憶、變異、勝敗需要明確聲音層次。

## Scope

- 卡牌打出、敵人受傷、玩家受傷、記憶增加、變異、勝利、失敗都觸發 SFX。
- 同類 SFX 做最小間隔節流，避免多段傷害爆音。
- BGM 音量、SFX 音量分開控制。
- Mute 狀態顯示清楚。

## Out Of Scope

- 不製作正式音樂。
- 不做複雜混音器或音訊設定頁。

## Acceptance Criteria

- 每個主要玩家行動都有聲音回饋。
- `memory-gained.ogg` 和 `mutation.ogg` 在對應事件確實播放。
- Mute 可關掉 BGM 與 SFX。

## Tests

- E2E 可檢查 sound event log，不直接驗證音訊波形。
- 手動測試瀏覽器自動播放限制下，第一次互動後 BGM 開始。
- 無 console audio error。

## Likely Files

- `src/scenes/GameScene.ts`
- `src/data/assets.json`
- `public/assets/audio/*`

