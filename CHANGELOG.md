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
