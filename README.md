# Stock Ledger v6.5.1

Device-local investment ledger. Static GitHub Pages app; GitHub Actions publishes public quote snapshots. No user portfolio data belongs in this repository, its tests, or its history.

## Update

Export a full JSON backup before updating. Open the existing Pages address and reload when the update prompt appears. The page must show v6.5.1. Never clear site storage to force an upgrade.

The existing `stock-ledger-v2-preloaded` storage key is preserved. Existing records are not silently repaired. Use **合併匯入 JSON** for additive/corrective updates with stable IDs; use **完整還原 JSON** only for a verified complete backup that should replace all existing data. Both routes validate before writing and retain a prior snapshot.

## Development

No build or dependencies are required. `index.html` loads `ledger.js` and `app.js`. The old patch files are retained for historical compatibility but are no longer loaded by this release. Service-worker cache names must change for every release.

Run `node tests/ledger.test.cjs` and `node --check app.js` before publishing. Public tests contain synthetic records only. See [CHANGELOG.md](CHANGELOG.md) for calculation conventions and limitations.

`symbols.txt` and `scripts/update_quotes.py` retain the existing Yahoo snapshot workflow. Quotes are for valuation, not order execution. USD conversion requires valid FX; TWD conversion is 1.

Historical Git privacy cleanup is a separate operation requiring explicit authorization; this release does not rewrite history.
