股票記帳 App v6.2｜Binance CSV 相容修正版
==========================================

修正：
- 支援 Binance 官方「合約倉位記錄」中文欄位：
  符號、保證金模式、倉位方向、進場價格、平均收盤價、
  已平倉交易量、平倉盈虧、已開啟、已關閉、狀態。
- 保留 v6.1 的 JSON 合併＋去重。
- 保留 Binance CSV 自動去重。
- 保留匯入前快照與還原功能。
- 公開版不含私人交易資料。
- Service Worker 已升版，手機 PWA 可抓到 v6.2。

更新 GitHub Pages：
覆蓋上傳 index.html、manifest.webmanifest、sw.js、README.txt 後 Commit。
