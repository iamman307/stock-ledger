股票記帳 App v6.1｜強制更新＋公開安全版
==========================================

這版修正兩個重要問題：
1. Service Worker 快取已正式升版，並加入 skipWaiting / clients.claim / updateViaCache:none，
   可大幅減少手機 PWA 卡在舊版的情況。
2. GitHub 公開版 index.html 不再內嵌任何私人交易、持倉或資金資料。
   仍維持相同 localStorage key，因此原手機上已存在的資料不會因更新程式碼而消失。

功能：
- JSON：合併＋去重，不再整份覆蓋。
- 匯入前：自動建立最近一次匯入前快照。
- 可按「還原匯入前快照」。
- Binance CSV：直接匯入、完整交易自動去重。
- 匯入結果會顯示新增 / 重複略過 / 解析失敗筆數。
- 公開 GitHub 程式碼不含私人資料。

更新 GitHub Pages：
請覆蓋上傳：
- index.html
- manifest.webmanifest
- sw.js
- README.txt

重要：
如果先前已把含私人交易資料的 index.html 上傳到「公開」GitHub repository，
單純覆蓋新檔不會清除 Git commit 歷史。最安全做法是：
A. 先把舊 repository 改 Private，或
B. 建立新的乾淨 public repository 部署 v6.1，確認新站正常後刪除舊 repository。
私人 JSON / Binance CSV 請勿上傳 public repository。
