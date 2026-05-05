# Balance And Difficulty Curve Backlog

## Backlog ID

`gameplay-balance-difficulty`

## Worktree Size

中型，一個 worktree。需搭配測試與多輪 quick simulation。

## Player Problem

目前 quick mode 可通關，但正常模式的敵人數值、獎勵、回血、金幣、Boss HP 未經系統性驗證。可能太簡單、太難，或記憶變異來不及發生。

## Scope

- 建立 deterministic simulation runner，跑多個 seed。
- 量測平均通關層數、死亡原因、變異發生次數、牌組大小、金幣使用率。
- 調整敵人 HP/傷害、獎勵金幣、回血比例、記憶閾值。
- 分離 `quick` E2E 數值與正常遊玩數值。

## Out Of Scope

- 不追求正式商業平衡。
- 不新增角色或大幅擴卡池。

## Acceptance Criteria

- 正常模式 12 層內至少能自然看到 1 次變異機會。
- 普通戰鬥不應平均超過 4-5 回合。
- Boss 有壓力，但不是純數值牆。
- Simulation 報告可重複產生。

## Tests

- 新增 simulation 測試或 script。
- 核心測試確認數值資料仍合法。
- E2E quick mode 不受正常模式平衡調整拖慢。

## Likely Files

- `src/data/cards.json`
- `src/data/enemies.json`
- `src/core/run/runEngine.ts`
- `tests/core/*`
- 新增 `scripts/simulate-runs.*`

