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
