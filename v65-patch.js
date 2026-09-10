// Stock Ledger v6.5 patch: BE/Taiwan quotes + correct TWD FX handling.
// No private portfolio data is embedded here.
(() => {
  const SNAPSHOT_URL='https://raw.githubusercontent.com/iamman307/stock-ledger/quotes-data/quotes.json';

  function patchLabels(){
    const sub=document.querySelector('.sub');
    if(sub) sub.textContent='v6.5｜免 Token 線上行情｜支援 BE＋台股代號映射｜台股匯率固定 1｜JSON 合併修正＋去重。';
    const footer=document.querySelector('.footer');
    if(footer) footer.textContent='Stock Ledger v6.5｜美股＋台股行情快照｜本工具只做記帳與績效追蹤，不會自動下單。';
    const btn=document.getElementById('refreshQuotes');
    if(btn) btn.textContent='讀取最新行情';
  }

  async function fetchSnapshot(){
    const r=await fetch(SNAPSHOT_URL+'?t='+Date.now(),{cache:'no-store'});
    if(!r.ok) throw new Error('行情快照 HTTP '+r.status);
    const j=await r.json();
    if(!j || typeof j!=='object' || !j.quotes) throw new Error('行情快照格式錯誤');
    return j;
  }

  async function refreshV65(showAlert=false){
    const btn=document.getElementById('refreshQuotes');
    const st=document.getElementById('autoStatus');
    if(btn) btn.disabled=true;
    if(st) st.textContent='讀取行情快照…';

    const held=[...new Set(compute().positions.filter(p=>p.qty>0).map(p=>p.ticker))];
    let ok=0,fail=0,missing=[];
    try{
      const snapshot=await fetchSnapshot();
      const usdTwd=Number(snapshot.usdTwd);
      if(Number.isFinite(usdTwd)&&usdTwd>0){
        db.meta=db.meta||{};
        db.meta.currentUsdTwd=usdTwd;
        db.meta.fxUpdated=snapshot.fxUpdated||snapshot.updated||new Date().toISOString();
        db.meta.fxSource=snapshot.fxSource||'Frankfurter';
        if(document.getElementById('currency')?.value==='USD') document.getElementById('fx').value=usdTwd.toFixed(4);
        if(document.getElementById('qFx')) document.getElementById('qFx').value=usdTwd.toFixed(4);
      }

      for(const ticker of held){
        const q=snapshot.quotes[String(ticker).toUpperCase()];
        if(q && Number.isFinite(Number(q.price)) && Number(q.price)>0){
          const old=db.quotes[ticker]||{};
          const ccy=String(q.currency||'USD').toUpperCase();
          const quoteFx=ccy==='TWD' ? 1 : ((Number.isFinite(usdTwd)&&usdTwd>0)?usdTwd:(old.fx||db.meta?.currentUsdTwd||1));
          db.quotes[ticker]={
            ...old,
            price:Number(q.price),
            fx:quoteFx,
            currency:ccy,
            yahooSymbol:q.yahooSymbol||ticker,
            updated:q.updated||snapshot.updated||new Date().toISOString(),
            source:snapshot.source||'Yahoo Finance via GitHub Actions',
            marketState:q.marketState||'',
            exchange:q.exchange||''
          };
          ok++;
        }else{
          fail++;
          missing.push(ticker);
        }
      }

      db.meta=db.meta||{};
      db.meta.appVersion='6.5';
      db.meta.lastQuoteSnapshot=snapshot.updated||new Date().toISOString();
      localStorage.setItem(KEY,JSON.stringify(db));
      renderAll();

      const ageMs=Date.now()-Date.parse(snapshot.updated||'');
      const ageMin=Number.isFinite(ageMs)?Math.max(0,Math.round(ageMs/60000)):null;
      const ageTxt=ageMin==null?'':'｜快照約 '+ageMin+' 分鐘前';
      const fxTxt=Number.isFinite(usdTwd)?'｜USD/TWD '+F(usdTwd,4):'';
      if(st) st.textContent=`成功 ${ok}｜失敗 ${fail}${ageTxt}${fxTxt}`;

      if(showAlert){
        let msg=`行情讀取完成\n成功：${ok} 檔\n失敗：${fail} 檔`;
        if(ageMin!=null) msg+=`\n行情快照：約 ${ageMin} 分鐘前`;
        if(missing.length) msg+=`\n快照尚無：${missing.join(', ')}`;
        if(Number.isFinite(usdTwd)) msg+=`\nUSD/TWD：${F(usdTwd,4)}`;
        alert(msg);
      }
    }catch(e){
      console.warn(e);
      if(st) st.textContent='行情快照讀取失敗｜沿用最後資料';
      if(showAlert) alert('行情讀取失敗：'+String(e?.message||e)+'\n原有行情資料沒有被清除。');
    }finally{
      if(btn) btn.disabled=false;
    }
  }

  try{ refreshAllQuotes=refreshV65; }catch(_e){ window.refreshAllQuotes=refreshV65; }
  const refreshBtn=document.getElementById('refreshQuotes');
  if(refreshBtn) refreshBtn.onclick=()=>refreshV65(true);

  const asset=document.getElementById('asset');
  const currency=document.getElementById('currency');
  const fxInput=document.getElementById('fx');
  if(asset){
    asset.addEventListener('change',()=>{
      if(asset.value==='台股'){
        if(currency) currency.value='TWD';
        if(fxInput) fxInput.value=1;
      }else if(currency?.value==='TWD'){
        currency.value='USD';
        if(fxInput) fxInput.value=db.meta?.currentUsdTwd?Number(db.meta.currentUsdTwd).toFixed(4):1;
      }
    });
  }

  const qt=document.getElementById('qTicker');
  const qfx=document.getElementById('qFx');
  if(qt&&qfx){
    qt.addEventListener('input',()=>{
      const t=qt.value.trim().toUpperCase();
      qfx.value=/^\d{4}$/.test(t)?1:(db.meta?.currentUsdTwd?Number(db.meta.currentUsdTwd).toFixed(4):1);
    });
  }

  patchLabels();
  setTimeout(()=>refreshV65(false),500);
})();
