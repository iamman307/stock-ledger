股票記帳 App v6.5.1
=====================
完整更新說明請閱讀 README.md 與 CHANGELOG.md。

先匯出完整備份，再更新 App；不要清除網站儲存資料。
本版直接載入 ledger.js 與 app.js，不再透過 Service Worker 注入補丁。
合併匯入先驗證與預覽；完整還原會取代交易、歷史交易、資金池與行情。
券商整輪損益需標記 brokerPnlScope=position，僅用於最後平倉。
台股稅費納入計算；TWD 行情匯率為 1；缺失 ROI 顯示 N/A。
程式升級不會自動更改既有交易。
GitHub 只放程式與公開行情，私人交易 JSON 不得上傳。
