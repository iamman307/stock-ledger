股票記帳 App v6.4｜免 Token 行情快照＋安全資料修正
===================================================

行情：
- 不需要 MarketData API Token。
- 不需要 Vercel。
- GitHub Actions 每 30 分鐘由伺服器端抓 Yahoo Finance。
- 行情寫入 quotes-data branch 的 quotes.json。
- App 從 raw.githubusercontent.com 讀最新快照，避免 Yahoo browser CORS。
- 按「讀取最新行情」只讀快照，不會消耗第三方 API credits。
- 行情用途為投資記帳與資產估值，不是即時下單報價；GitHub 排程可能延遲。

JSON 匯入：
- 同 transaction id：更新/修正該筆，不再只是略過。
- 不同 id 但經濟欄位完全相同：去重略過。
- 新交易：加入。
- 匯入前仍會保留 pre-import snapshot。
- 不覆蓋手機已存在的非零資金池。

Binance：
- 保留 Binance CSV 自動匯入＋去重。

公開安全：
- GitHub app code 不包含私人交易、持倉數量或資金。
- 行情清單 symbols.txt 只有股票代號，不包含持有數量。

行情清單：
QQQM
AVGO
MU
TSLA
PGR
POWR
PRGS
CAT
VOO
XLV
JPM
