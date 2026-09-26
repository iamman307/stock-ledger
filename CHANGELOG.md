## v6.11.1 — 2026-09-26

- 將已知 Binance／加密投入本金15萬元正式歸入波段70萬元配置，股票波段基礎額度顯示為55萬元。
- 波段卡新增「加密交易配置」「股票波段基礎額度」與已扣加密配置的「波段策略剩餘」，避免誤以為完整70萬元仍可買股票。
- 證券戶橋接改為直接使用已扣加密本金的波段餘額，不再於橋接區重複扣除。
- 加密本金仍按固定投入額管理；股票 TWD 與網格／合約 USDT 績效維持分開統計。

## v6.11.0 — 2026-09-26

- 新增股票交易可自動建立待交割款：買進為負、賣出為正，納入成交金額、手續費、交易稅與成交匯率。
- 總覽新增待交割明細，可逐筆標示「已交割」；結清時以銀行實際帳面／圈存餘額更新快照，只移除對應待交割款。
- 新增與交割股票都不會被誤記為投入或提領本金；回補已交割歷史交易時可取消自動待交割。
- 刪除交易時同步清除該交易自動建立的待交割款，手動建立的待交割資料不受影響。

## v6.10.1 — 2026-09-26

- 長期與波段卡片的「估算可動用」改名為「策略預算剩餘」，明確標示尚未扣除共用校正與外部投資轉出。
- 證券戶現金對帳新增完整橋接：長期＋波段策略池、歷史現金校正、外部投資轉出、股票配置模型及模型與銀行待對帳差額。
- 待對帳差額明確標示為「不是投資損益」，避免將現金模型差異誤判為虧損。

## v6.10.0 — 2026-09-26

- 新增證券戶銀行快照：分開顯示帳面餘額、圈存、目前可用、待交割與全部交割後預估。
- 待交割款保留原幣金額與暫估匯率；圈存不會在交割後預估中重複扣除。
- 外部持倉的已知 TWD 入金（目前為 Binance 信貸 150,000 元）會從股票配置模型餘額扣除，但仍保留在整體投資資產與資金來源統計中。
- 原「證券戶現金」配置推算改名為「股票配置模型餘額」，避免把預算模型誤認為銀行存款。
- 合併匯入可安全更新較新的證券戶快照；資金配置、私人資金來源與行情仍不被覆寫。

## v6.9.1 — 2026-09-22

- 新增「未分配／其他投資現金」對帳校正，不改變長期 100 萬／波段 70 萬鎖定配置，也不列入股票損益。
- 總覽新增「投資可動用現金」與證券戶現金對帳卡；交易會先反映，銀行端仍需等交割同步。
- 現金校正值保存在本機私人 capitalTracking，完整 JSON 可備份；public repo 不寫入私人金額。

## v6.9.0 — 2026-09-20

- 績效頁新增按幣別分組的平均獲利／虧損金額、金額盈虧比、平均單筆損益與完整策略總損益。
- 百分比指標改名為「報酬率盈虧比」與「平均單筆報酬率」，避免與金額績效混淆。
- 新增可展開的計算說明與標準化期望值；無虧損樣本時不顯示虛假的零值。
- 手機版突出平均單筆損益；保持既有交易資料與資金計算方式。

# 6.8.2

- External cash can now be labelled as mixed-source instead of falsely assigning the whole balance to one funding source.
- The holdings table can show a concise source breakdown while keeping funding transfers outside transaction performance.
- Corrective imports may update stable historical strategy IDs from gross execution P/L to platform net P/L without duplicating samples.

# 6.8.1

- Added a dedicated external/crypto holdings snapshot model. These holdings appear separately from stock positions and never inflate stock transaction or win-rate counts.
- Merge imports can add or update stable external holding IDs without changing device-local fund plans, capital-source settings or quotes.
- Legacy BTC can be shown with the platform cost and unrealized P/L while remaining an opening snapshot rather than a fabricated historical buy.

# 6.8.0

- Added one performance-scope selector for stock swings, USD/TWD stock subsets, derivatives/grid strategies and all strategies.
- Combined scope counts every complete strategy while keeping TWD and USDT monetary totals separate.
- Win rate uses every closed strategy with a known result; average return, Payoff and Expectancy use only records with an explicit platform/strategy return, so missing ROI is never silently treated as zero.
- The performance page now explains why stock transaction fills and completed strategy samples have different counts.
- Grid modes render as neutral, long or long/upward-trailing instead of exposing the compatibility-only LONG schema value.
- Stock fund pools, source-of-capital attribution and dashboard TWD results remain stock-only.

Verification covers missing-ROI combined statistics, application runtime, ledger calculations and browser rendering with synthetic device data.

# 6.7.1

- Added a dedicated device-only private capital-settings import. It changes only the capital-source profile and never transactions, quotes or the locked fund plan.
- Added an informational excluded-living-funds amount. It is already excluded from opening source shares and is never subtracted twice.
- Private setup imports are schema-validated, previewed before confirmation and reset the P/L baseline at import time.
- No personal balances are bundled in the public repository; prepared user values belong only in the separate private setup file.

# 6.7.0

- Added an optional investment-only capital-source ledger with loan, self-funded and family-funded shares.
- First activation captures the current recorded investment P/L as a reset baseline; historical returns are not back-attributed.
- New investment contributions and withdrawals crystallize P/L before changing source ratios, so individual stock trades never need a funding-source tag.
- Added separate loan principal, principal repaid, interest and fee tracking plus loan-attributed and net leveraged results.
- Daily spending accounts, living expenses and travel currency are explicitly excluded; only deliberate investment-pool entries are counted.
- Capital-source settings remain device-local and are preserved during transaction JSON merge and full restore.
- Added mobile dashboard and settings surfaces for source ratios, monthly self-funded contributions and audit history.

Verification covers source attribution across cash-flow checkpoints, pro-rata withdrawals, metadata-preserving merge and UI runtime with synthetic data only.

# 6.6.1

- Fund availability estimates now equal allocation minus remaining cost plus recognized realized P/L, matching the dashboard's broker-first accounting basis.
- Retained the cash-flow estimate and exposed its reconciliation difference; no transaction or actual cash balance is rewritten.
- Total assets are explicitly estimates. Loan/deposit amounts remain planned reserves; manual historical trades remain excluded.
- Missing holding quotes suppress total assets and unrealized P/L instead of treating unpriced holdings as losses.

# 6.6.0

- Locked the default TWD 2,000,000 plan into four separate allocations: 1,000,000 long-term, 700,000 swing, 100,000 loan-payment reserve and 200,000 breakable fixed deposit.
- JSON merge and full restore preserve the live fund plan. Editing requires an explicit unlock; saving locks it again.
- Enforced the confirmed account policy on existing, new and imported records: MU, QQQM and AVGO are long-term; every other ticker is swing.
- Added a one-time pre-policy local backup before reclassifying existing device records.
- Estimated available investment cash now starts from imported INIT/BUY/SELL cash flows. INIT occupies capital; sell proceeds return to the same pool. Loan and fixed-deposit reserves remain outside investment performance.
- Rebuilt the overview as a mobile-first investment dashboard with allocation composition, long/swing pool cards, protected reserves, clearer valuation status and a fixed bottom navigation bar.
- Updated release cache and PWA theme without changing the localStorage key.

Verification: `node tests/ledger.test.cjs` and JavaScript syntax checks. Tests use synthetic records only.

# 6.5.1

- Integrated the 6.5 Taiwan quote behavior into the application; no service-worker HTML injection.
- Kept the existing localStorage key. No private data is bundled or migrated silently.
- Extracted a pure ledger engine and application script.
- Costs and proceeds account for fee/tax and explicit settlement amounts.
- Optional `brokerPnlScope: "position"` on the final SELL reconciles a whole-position broker total exactly once; default remains per execution. The last realization is a balancing allocation, not an independently verified execution P/L.
- R uses original-currency realized P/L and an explicit `originalRiskBase`, or complete purchase stop-risk including entry fees. Unknown risk stays N/A.
- Oversells are surfaced. New transactions and imports reject invalid portfolios.
- JSON merge previews changes, validates a detached draft, and preserves current cash/quotes. Full restore is explicit and confirmed.
- Imports retain a previous snapshot plus five local snapshots. External JSON backup is still essential.
- Manual history dedupe tolerates insignificant price rounding. Stable IDs permit future corrections. Existing duplicates are not deleted automatically.
- CSV handles quoted newlines, rejects malformed rows, leaves missing ROI/P&L unknown, and never guesses ROI units by magnitude.
- Stock performance supports USD/TWD filters, average win/loss and expectancy including break-even. Hold/time-efficiency values are explicitly interval estimates, not weighted durations. Incomplete INIT durations are excluded from time efficiency.
- Market data without a valid conversion rate cannot silently use FX=1. Quote fetch has a timeout and in-flight guard.
- Cache cleanup only touches this app's prefix. HTML and scripts are precached as one release; updates preserve private localStorage.
- No Git history rewriting. Any historical exposure must be handled separately with explicit authorization.

Verification: `node tests/ledger.test.cjs`. Tests use synthetic records only.

Limitations: no cloud sync, automatic broker OCR, weighted holding-time engine, equity-curve drawdown, corporate actions, or bot-session editor. Broker reconciliation does not prove the completeness of source records. Private corrected backups must never be committed here.
