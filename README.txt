股票記帳 App v6｜GitHub Pages 公開安全版
========================================

v6 重點：
1. JSON 匯入由「整份覆蓋」改成「合併＋去重」。
2. 匯入 JSON 前自動保存一份「匯入前快照」。
3. 新增「還原匯入前快照」按鈕。
4. 新增 Binance CSV 專用匯入。
5. Binance CSV 匯入會依：
   交易對 + 方向 + 開倉時間 + 平倉時間 + 進場價 + 出場價 + 數量
   自動判定重複。
6. 匯入後顯示：
   - 新增幾筆
   - 重複略過幾筆
   - 無法解析幾筆
7. GitHub 公開程式碼仍不含私人投資資料。

JSON 合併原則：
- 股票交易：只新增不存在的交易。
- manualTrades（原油/BTC等完整交易）：只新增不存在的交易。
- 行情 quotes：保留更新時間較新的資料。
- 資金池 cash：不會用匯入檔直接覆蓋手機上已存在的非零金額。
- 匯入失敗時，不清除原資料。

Binance CSV：
- 支援常見 Binance 合約倉位歷史欄位的中英文名稱。
- 如果 CSV 缺少原始停損，R multiple 保持 N/A。
- 若 Binance 未在檔內提供手續費/Funding，App 不會自行猜測。

部署 GitHub Pages 時只需上傳：
- index.html
- manifest.webmanifest
- sw.js
- README.txt

私人 JSON / Binance CSV 不要上傳 Public Repository。
