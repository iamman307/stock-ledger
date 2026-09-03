// Stock Ledger v6.4 generic upgrade patch. No private portfolio data is embedded here.
(() => {
  function patchVersionLabel(){
    const sub=document.querySelector('.sub');
    if(sub) sub.textContent='v6.4｜免 Token 線上行情｜GitHub 約每 30 分鐘更新行情快照｜JSON 可修正＋去重。';
    const footer=document.querySelector('.footer');
    if(footer) footer.textContent='Stock Ledger v6.4｜GitHub 行情快照＋安全資料修正｜本工具只做記帳與績效追蹤，不會自動下單。';
    const btn=document.getElementById('refreshQuotes');
    if(btn) btn.textContent='讀取最新行情';
  }

  function mergeImportedDbV64(incoming){
    if(!incoming || !Array.isArray(incoming.transactions)) throw new Error('invalid_json');
    db.transactions=Array.isArray(db.transactions)?db.transactions:[];
    db.manualTrades=Array.isArray(db.manualTrades)?db.manualTrades:[];
    db.quotes=db.quotes||{};
    db.cash=db.cash||{'長期':0,'波段':0,loan:0,reserve:0};
    db.meta=db.meta||{};

    const idIndex=new Map();
    db.transactions.forEach((t,i)=>{if(t?.id)idIndex.set(String(t.id),i)});
    let txAdded=0,txSkipped=0,txUpdated=0;

    for(const t of incoming.transactions){
      if(t?.id && idIndex.has(String(t.id))){
        const idx=idIndex.get(String(t.id));
        const before=JSON.stringify(db.transactions[idx]);
        const merged={...db.transactions[idx],...t};
        if(JSON.stringify(merged)!==before){db.transactions[idx]=merged;txUpdated++;}
        else txSkipped++;
        continue;
      }
      const existing=new Set(db.transactions.map(txKey));
      const k=txKey(t);
      if(existing.has(k)){txSkipped++;continue;}
      db.transactions.push(t);
      if(t?.id)idIndex.set(String(t.id),db.transactions.length-1);
      txAdded++;
    }

    const existingManual=new Set(db.manualTrades.map(manualTradeKey));
    let manualAdded=0,manualSkipped=0;
    for(const t of (incoming.manualTrades||[])){
      const k=manualTradeKey(t);
      if(existingManual.has(k)){manualSkipped++;continue;}
      db.manualTrades.push(t);existingManual.add(k);manualAdded++;
    }

    for(const [ticker,q] of Object.entries(incoming.quotes||{})){
      const cur=db.quotes[ticker];
      if(!cur||!cur.updated||!q.updated||new Date(q.updated)>=new Date(cur.updated))db.quotes[ticker]=q;
    }

    if(incoming.cash){
      for(const key of ['長期','波段','loan','reserve']){
        if((db.cash[key]===undefined||Number(db.cash[key])===0)&&incoming.cash[key]!==undefined)db.cash[key]=incoming.cash[key];
      }
    }
    db.meta.lastMergedImport=new Date().toISOString();
    db.meta.appVersion='6.4';
    return {txAdded,txSkipped,txUpdated,manualAdded,manualSkipped};
  }

  const input=document.getElementById('importJson');
  if(input){
    input.onchange=async e=>{
      const f=e.target.files[0];if(!f)return;
      try{
        const incoming=JSON.parse(await f.text());
        localStorage.setItem(KEY+'-preimport-backup',JSON.stringify(db));
        const r=mergeImportedDbV64(incoming);
        save();
        alert(`JSON 合併完成\n新增股票交易：${r.txAdded} 筆\n修正既有交易：${r.txUpdated} 筆\n略過重複股票交易：${r.txSkipped} 筆\n新增歷史完整交易：${r.manualAdded} 筆\n略過重複歷史交易：${r.manualSkipped} 筆`);
      }catch(err){
        console.error(err);
        alert('JSON 匯入失敗：原有資料沒有被清除。');
      }finally{e.target.value='';}
    };
  }

  patchVersionLabel();
})();
