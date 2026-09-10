const KEY='stock-ledger-v2-preloaded';const DEFAULT_DB={"transactions":[],"manualTrades":[],"quotes":{},"cash":{"長期":0,"波段":0,"loan":0,"reserve":0},"meta":{"appVersion":"6.6.0","publicSafe":true,"fundPlan":{"longTerm":1000000,"swing":700000,"loan":100000,"reserve":200000,"locked":true}}};let storageBlocked=false;let db;const storedRaw=localStorage.getItem(KEY);try{const parsed=JSON.parse(storedRaw||JSON.stringify(DEFAULT_DB));db=Ledger.applyPolicy(parsed);if(storedRaw&&JSON.stringify(parsed)!==JSON.stringify(db)){localStorage.setItem(KEY+'-prepolicy-v6-6-0',storedRaw);localStorage.setItem(KEY,JSON.stringify(db));}}catch(err){storageBlocked=true;db=Ledger.applyPolicy(DEFAULT_DB);setTimeout(()=>alert('資料無法讀取，原始資料未改動。請先匯出原始資料，再使用完整還原。'+err.message),0);}if(!Array.isArray(db.manualTrades))db.manualTrades=[];db.meta=db.meta||{};db.meta.symbolMap=db.meta.symbolMap||{};
const $=id=>document.getElementById(id),N=x=>Number(x||0),F=(x,d=2)=>Number.isFinite(x)?x.toLocaleString('zh-TW',{minimumFractionDigits:d,maximumFractionDigits:d}):'—',M=x=>Number.isFinite(x)?Math.round(x).toLocaleString('zh-TW'):'—',C=x=>x>0?'pos':x<0?'neg':'',D=s=>new Date(s),E=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function save(){if(storageBlocked)throw Error('資料讀取異常，禁止覆寫；請使用完整還原');db=Ledger.applyPolicy(db);localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function snapshot(){const raw=localStorage.getItem(KEY);if(raw){localStorage.setItem(KEY+'-preimport-backup',raw);let history=[];try{history=JSON.parse(localStorage.getItem(KEY+'-history')||'[]')}catch{};if(!Array.isArray(history))history=[];history.unshift({at:new Date().toISOString(),data:raw});localStorage.setItem(KEY+'-history',JSON.stringify(history.slice(0,5)));}}
function commitDb(next,planOverride){if(storageBlocked)throw Error('請先完整還原');const checked=Ledger.applyPolicy(next,planOverride);snapshot();localStorage.setItem(KEY,JSON.stringify(checked));db=checked;renderAll();}

const tabButtons=[...document.querySelectorAll('.tab')];
const panels=[...document.querySelectorAll('.panel')];
function showTabByIndex(index,direction=0){
  if(index<0||index>=tabButtons.length)return;
  tabButtons.forEach(x=>x.classList.remove('active'));
  panels.forEach(x=>x.classList.remove('active'));
  const btn=tabButtons[index],panel=$(btn.dataset.tab);
  btn.classList.add('active');
  if(panel){
    panel.style.setProperty('--swipe-shift',direction>0?'18px':direction<0?'-18px':'0px');
    panel.classList.add('active');
  }
  btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
}
function activeTabIndex(){return Math.max(0,tabButtons.findIndex(x=>x.classList.contains('active')))}
tabButtons.forEach((b,i)=>b.onclick=()=>showTabByIndex(i,0));

/* 左右滑動切換分頁：
   - 左滑：下一頁
   - 右滑：上一頁
   - 表格橫向捲動、輸入欄、按鈕等互動區域不觸發
   - 必須以水平手勢為主，避免上下捲動時誤切頁 */
let swipeStartX=0,swipeStartY=0,swipeTracking=false;
function swipeBlockedTarget(target){
  return !!target.closest('input,textarea,select,button,a,label,.btn,.scroll,table');
}
document.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||swipeBlockedTarget(e.target)){swipeTracking=false;return}
  swipeTracking=true;
  swipeStartX=e.touches[0].clientX;
  swipeStartY=e.touches[0].clientY;
},{passive:true});
document.addEventListener('touchend',e=>{
  if(!swipeTracking||e.changedTouches.length!==1)return;
  swipeTracking=false;
  const dx=e.changedTouches[0].clientX-swipeStartX;
  const dy=e.changedTouches[0].clientY-swipeStartY;
  const minDistance=60;
  if(Math.abs(dx)<minDistance||Math.abs(dx)<Math.abs(dy)*1.25)return;
  const current=activeTabIndex();
  if(dx<0)showTabByIndex(current+1,1);
  else showTabByIndex(current-1,-1);
},{passive:true});

function setNow(){const z=new Date();z.setMinutes(z.getMinutes()-z.getTimezoneOffset());$('date').value=z.toISOString().slice(0,16)}setNow();
function updateAccountHint(){const ticker=$('ticker').value.trim().toUpperCase(),account=Ledger.classifyAccount(ticker);$('account').value=account;if($('accountHint'))$('accountHint').textContent=ticker?`${ticker} 固定歸類：${account}`:'MU、QQQM、AVGO 為長期；其餘固定為波段';}
$('ticker').addEventListener('input',updateAccountHint);updateAccountHint();
$('txForm').onsubmit=e=>{e.preventDefault();const ticker=$('ticker').value.trim().toUpperCase();const t={tax:N($('tax').value),id:crypto.randomUUID(),date:$('date').value,account:Ledger.classifyAccount(ticker),ticker,asset:$('asset').value,side:$('side').value,qty:N($('qty').value),price:N($('price').value),fee:N($('fee').value),fx:N($('fx').value)||1,stop:$('stop').value===''?null:N($('stop').value),currency:$('currency').value,exitReason:$('exitReason').value,note:$('note').value.trim()};if(!t.ticker||t.qty<=0)return alert('請確認代號與數量');try{const next=JSON.parse(JSON.stringify(db));next.transactions.push(t);const checked=Ledger.applyPolicy(next);const c=Ledger.compute(checked);if(c.issues.length)throw Error(c.issues.join('\n'));commitDb(checked);}catch(err){return alert(err.message)}e.target.reset();$('fee').value=0;$('fx').value=db.meta?.currentUsdTwd||1;$('currency').value='USD';setNow();updateAccountHint()};
function compute(){return Ledger.compute(db)}
function renderDash(c){
 const f=Ledger.fundSummary(db,c),long=f.buckets['長期'],swing=f.buckets['波段'];
 const pools=[['長期資金',long,'pool-long'],['波段資金',swing,'pool-swing']];
 const mv=long.marketValue+swing.marketValue,cost=long.cost+swing.cost,unr=mv-cost,r=long.realized+swing.realized;
 const investmentEquity=long.equityKnown+swing.equityKnown,totalTracked=investmentEquity+f.protectedPlan,totalGain=totalTracked-f.totalPlan;
 const partial=long.missingQuotes+swing.missingQuotes;
 if($('fundOverview'))$('fundOverview').innerHTML=`
   <div class="fund-hero-top"><div><div class="eyebrow">鎖定資金配置</div><div class="hero-amount">${M(f.totalPlan)} <small>TWD</small></div></div><span class="lock-badge">🔒 匯入不覆寫</span></div>
   <div class="allocation-track" aria-label="資金配置比例"><span class="seg-long" style="width:${f.plan.longTerm/f.totalPlan*100}%"></span><span class="seg-swing" style="width:${f.plan.swing/f.totalPlan*100}%"></span><span class="seg-loan" style="width:${f.plan.loan/f.totalPlan*100}%"></span><span class="seg-reserve" style="width:${f.plan.reserve/f.totalPlan*100}%"></span></div>
   <div class="allocation-legend"><span><i class="dot long"></i>長期 100 萬</span><span><i class="dot swing"></i>波段 70 萬</span><span><i class="dot loan"></i>信貸 10 萬</span><span><i class="dot reserve"></i>定存 20 萬</span></div>
   <div class="hero-metrics"><div><span>已知總資產</span><b>${M(totalTracked)} TWD</b></div><div><span>相對規劃</span><b class="${C(totalGain)}">${totalGain>=0?'+':''}${M(totalGain)} TWD</b></div></div>
   ${partial?`<div class="estimate-note">有 ${partial} 個持倉缺少行情，總資產目前是部分估值。</div>`:''}`;
 $('kpis').innerHTML=[['持倉市值',M(mv),''],['持倉成本',M(cost),''],['未實現損益',M(unr),C(unr)],['已實現損益',M(r),C(r)]].map(x=>`<div class="card kpi"><div class="label">${x[0]}</div><div class="value ${x[2]}">${x[1]}</div><div class="unit">TWD</div></div>`).join('');
 $('accountSummary').innerHTML=pools.map(([label,b,klass])=>{const used=Math.max(0,Math.min(100,b.usagePct)),over=b.available<0;return `<article class="pool-card ${klass}"><div class="pool-head"><div><span class="pool-kicker">${label}</span><h3>${M(b.allocation)} <small>TWD</small></h3></div><span class="pool-status ${over?'over':''}">${over?'超出配置':'配置內'}</span></div><div class="pool-progress"><span style="width:${used}%"></span></div><div class="pool-stats"><div><span>估算可動用</span><b class="${over?'neg':''}">${M(b.available)}</b></div><div><span>目前持倉成本</span><b>${M(b.cost)}</b></div><div><span>已知市值</span><b>${M(b.marketValue)}</b></div><div><span>已實現損益</span><b class="${C(b.realized)}">${b.realized>=0?'+':''}${M(b.realized)}</b></div></div><div class="ticker-list">${b.tickers.length?b.tickers.map(t=>`<span>${E(t)}</span>`).join(''):'<span class="muted">目前無持倉</span>'}</div><p class="pool-note">自匯入紀錄起估算${b.missingQuotes?`；${b.missingQuotes} 檔缺行情`:''}</p></article>`}).join('');
 if($('reserveSummary'))$('reserveSummary').innerHTML=`<div class="reserve-item"><div class="reserve-icon">貸</div><div><span>信貸扣款帳戶</span><b>${M(f.plan.loan)} TWD</b></div><em>不列入投資</em></div><div class="reserve-item"><div class="reserve-icon">存</div><div><span>隨時解約定存</span><b>${M(f.plan.reserve)} TWD</b></div><em>緊急預備</em></div>`;
}
function renderTx(){const rows=[...db.transactions].sort((a,b)=>D(b.date)-D(a.date));$('txTable').innerHTML=`<thead><tr><th>日期</th><th>帳戶</th><th>代號</th><th>動作</th><th>數量</th><th>價格</th><th>費用</th><th>匯率</th><th>停損</th><th></th></tr></thead><tbody>`+(rows.length?rows.map(t=>`<tr><td>${E(t.date.replace('T',' '))}</td><td>${E(t.account)}</td><td>${E(t.ticker)}</td><td>${E(t.side)}</td><td>${F(t.qty,4)}</td><td>${F(t.price,4)}</td><td>${F(t.fee)}</td><td>${F(t.fx,4)}</td><td>${t.stop==null?'—':F(t.stop,4)}</td><td><button class="tiny danger" data-delete-tx="${E(t.id)}">刪除</button></td></tr>`).join(''):`<tr><td colspan="10" class="empty">尚無交易</td></tr>`)+`</tbody>`}window.delTx=id=>{if(confirm('確定刪除？')){const next=JSON.parse(JSON.stringify(db));next.transactions=next.transactions.filter(x=>x.id!==id);const issues=Ledger.compute(next).issues;if(issues.length)return alert('刪除會造成持股不足，未變更：'+issues.join('\n'));commitDb(next)}};$('clearAll').onclick=()=>{if(confirm('確定清空全部交易？')){const next=JSON.parse(JSON.stringify(db));next.transactions=[];commitDb(next)}};
function renderPos(c){const ps=c.positions.filter(p=>p.qty>0);$('posTable').innerHTML=`<thead><tr><th>代號</th><th>帳戶</th><th>數量</th><th>平均成本</th><th>歷史有效匯率</th><th>現價</th><th>目前匯率</th><th>市值 TWD</th><th>未實現</th><th>股價影響</th><th>匯率影響</th><th>報酬率</th></tr></thead><tbody>`+(ps.length?ps.map(p=>{const avgB=p.costBase/p.qty,histFx=p.costBase?p.costTwd/p.costBase:NaN,q=db.quotes[p.ticker],baseNow=q?p.qty*q.price:NaN,mv=q?baseNow*q.fx:NaN,pnl=q?mv-p.costTwd:NaN,pricePnl=q&&Number.isFinite(histFx)?baseNow*histFx-p.costTwd:NaN,fxPnl=q&&Number.isFinite(histFx)?baseNow*(q.fx-histFx):NaN,ret=q&&p.costTwd?pnl/p.costTwd*100:NaN;return `<tr><td>${E(p.ticker)}</td><td>${E(p.account)}</td><td>${F(p.qty,4)}</td><td>${F(avgB,4)} ${E(p.currency)}</td><td>${Number.isFinite(histFx)?F(histFx,4):'—'}</td><td>${q?F(q.price,4):'—'}</td><td>${q?F(q.fx,4):'—'}</td><td>${M(mv)}</td><td class="${C(pnl)}">${M(pnl)}</td><td class="${C(pricePnl)}">${M(pricePnl)}</td><td class="${C(fxPnl)}">${M(fxPnl)}</td><td class="${C(ret)}">${Number.isFinite(ret)?F(ret,2)+'%':'—'}</td></tr>`}).join(''):`<tr><td colspan="12" class="empty">尚無持倉</td></tr>`)+`</tbody>`}
function renderPerf(c){
 const market=$('perfMarket').value,tr=c.trades.filter(t=>market==='all'||(market==='tw'?t.currency==='TWD':t.currency==='USD'));
 const s=Ledger.stats(tr);
 $('perfKpis').innerHTML=[['完整交易',s.count+' 筆'],['勝率',F(s.winRate,1)+'%'],['平均獲利率',F(s.avgWin)+'%'],['平均虧損率',F(s.avgLoss)+'%'],['Payoff',F(s.payoff)+':1'],['Expectancy',F(s.expectancy)+'% / trade']].map(([label,value])=>'<div class="card kpi"><div class="label">'+label+'</div><div class="value">'+value+'</div></div>').join('');
 $('tradeTable').innerHTML='<thead><tr><th>標的</th><th>開倉</th><th>平倉</th><th>投入成本 TWD</th><th>實現損益 TWD</th><th>報酬</th><th>R（原幣）</th><th>持有區間</th><th>時間效率（區間估算）</th></tr></thead><tbody>'+tr.map(t=>'<tr><td>'+E(t.ticker)+'</td><td>'+E(t.open)+'</td><td>'+E(t.close)+'</td><td>'+M(t.buyCostTwd)+'</td><td class="'+C(t.realizedTwd)+'">'+M(t.realizedTwd)+'</td><td>'+F(t.returnPct)+'%</td><td>'+(Number.isFinite(t.rMultiple)?F(t.rMultiple,4)+'R':'N/A')+'</td><td>'+F(t.holdHours/24,2)+' d'+(t.estimated?'（期初快照）':'')+'</td><td>'+(t.holdHours>0&&!t.estimated?F(t.returnPct/(t.holdHours<24?t.holdHours:t.holdHours/24),4)+(t.holdHours<24?'%/hour':'%/day'):'N/A')+'</td></tr>').join('')+'</tbody>';
}


function renderManualTrades(){
  const tr=[...(db.manualTrades||[])].sort((a,b)=>D(b.close)-D(a.close));
  const el=$('manualTradeTable'); if(!el)return;
  el.innerHTML=`<thead><tr><th>標的</th><th>方向</th><th>開倉</th><th>平倉</th><th>進場</th><th>出場</th><th>數量</th><th>實現損益</th><th>平台報酬</th><th>價格報酬</th><th>持有</th></tr></thead><tbody>`+
  (tr.length?tr.map(x=>{const h=(D(x.close)-D(x.open))/36e5,hold=h<24?F(h,2)+' hr':F(h/24,2)+' d';
    return `<tr><td>${E(x.ticker)}</td><td>${E(x.direction)}</td><td>${E(x.open.replace('T',' '))}</td><td>${E(x.close.replace('T',' '))}</td><td>${F(x.entry,4)}</td><td>${F(x.exit,4)}</td><td>${F(x.qty,4)}</td><td class="${C(x.pnl)}">${Number.isFinite(x.pnl)?F(x.pnl,2):'N/A'} ${E(x.currency)}</td><td class="${C(x.returnPct)}">${Number.isFinite(x.returnPct)?F(x.returnPct,2)+'%':'N/A'}</td><td class="${C(x.priceReturnPct)}">${F(x.priceReturnPct,4)}%</td><td>${hold}</td></tr>`
  }).join(''):`<tr><td colspan="11" class="empty">尚無其他歷史交易</td></tr>`)+`</tbody>`;
}

const QUOTE_SNAPSHOT_URL='https://raw.githubusercontent.com/iamman307/stock-ledger/quotes-data/quotes.json';

async function fetchQuoteSnapshot(){
  const url=QUOTE_SNAPSHOT_URL+'?t='+Date.now();
  const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error('行情快照 HTTP '+r.status);
  const j=await r.json();
  if(!j || typeof j!=='object' || !j.quotes)throw new Error('行情快照格式錯誤');
  return j;
}
let quoteBusy=false;
async function refreshAllQuotes(showAlert=false){
  if(quoteBusy||storageBlocked)return;quoteBusy=true;
  const btn=$('refreshQuotes'),st=$('autoStatus');
  if(btn)btn.disabled=true;
  if(st)st.textContent='讀取行情快照…';

  const held=[...new Set(compute().positions.filter(p=>p.qty>0).map(p=>p.ticker))];
  let ok=0,fail=0,missing=[],snapshot=null;

  try{
    snapshot=await fetchQuoteSnapshot();
    const fx=snapshot.usdTwd==null?NaN:Number(snapshot.usdTwd);
    if(Number.isFinite(fx)&&fx>0){
      db.meta=db.meta||{};
      db.meta.currentUsdTwd=fx;
      db.meta.fxUpdated=snapshot.fxUpdated||snapshot.updated||new Date().toISOString();
      db.meta.fxSource=snapshot.fxSource||'Frankfurter';
      if($('currency')?.value==='USD')$('fx').value=fx.toFixed(4);
      if($('qFx'))$('qFx').value=fx.toFixed(4);
    }

    for(const t of held){
      const q=snapshot.quotes[String(t).toUpperCase()];
      const ccy=String(q?.currency||'').toUpperCase();const quoteFx=ccy==='TWD'?1:(ccy==='USD'?(Number.isFinite(fx)&&fx>0?fx:Number(db.meta?.currentUsdTwd)):NaN);
      if(q && Number.isFinite(Number(q.price)) && Number(q.price)>0 && quoteFx>0){
        const old=db.quotes[t]||{};
        db.quotes[t]={
          ...old,
          price:Number(q.price),
          fx:quoteFx,currency:ccy,
          updated:q.updated||snapshot.updated||new Date().toISOString(),
          source:snapshot.source||'Yahoo Finance via GitHub Actions',
          marketState:q.marketState||'',
          exchange:q.exchange||''
        };
        ok++;
      }else{
        fail++;
        missing.push(t);
      }
    }

    db.meta=db.meta||{};
    db.meta.lastQuoteSnapshot=snapshot.updated||new Date().toISOString();db.meta.appVersion='6.6.0';
    if(storageBlocked)throw Error('資料讀取異常，停止寫入行情');
    localStorage.setItem(KEY,JSON.stringify(db));
    renderAll();

    const ageMs=Date.now()-Date.parse(snapshot.updated||'');
    const ageMin=Number.isFinite(ageMs)?Math.max(0,Math.round(ageMs/60000)):null;
    const ageTxt=ageMin==null?'':'｜快照約 '+ageMin+' 分鐘前';
    const fxTxt=Number.isFinite(fx)&&fx>0?'｜USD/TWD '+F(Number(snapshot.usdTwd),4):'';
    if(st)st.textContent=`成功 ${ok}｜失敗 ${fail}${ageTxt}${fxTxt}`;

    if(showAlert){
      let msg=`行情讀取完成\n成功：${ok} 檔\n失敗：${fail} 檔`;
      if(ageMin!=null)msg+=`\n行情快照：約 ${ageMin} 分鐘前`;
      if(missing.length)msg+=`\n快照尚無：${missing.join(', ')}`;
      if(Number.isFinite(fx)&&fx>0)msg+=`\nUSD/TWD：${F(Number(snapshot.usdTwd),4)}`;
      alert(msg);
    }
  }catch(e){
    console.warn(e);
    if(st)st.textContent='行情快照讀取失敗｜沿用最後資料';
    if(showAlert)alert('行情讀取失敗：'+String(e?.message||e)+'\n原有行情資料沒有被清除。');
  }finally{
    quoteBusy=false;
    if(btn)btn.disabled=false;
  }
}
$('refreshQuotes').onclick=()=>refreshAllQuotes(true);
$('currency').addEventListener('change',()=>{
  if($('currency').value==='USD'&&db.meta?.currentUsdTwd)$('fx').value=Number(db.meta.currentUsdTwd).toFixed(4);
  else if($('currency').value==='TWD')$('fx').value=1;
});

$('quoteForm').onsubmit=e=>{e.preventDefault();const t=$('qTicker').value.trim().toUpperCase();if(!t||['__PROTO__','CONSTRUCTOR','PROTOTYPE'].includes(t))return alert('代號錯誤');const next=JSON.parse(JSON.stringify(db));next.quotes[t]={price:N($('qPrice').value),fx:N($('qFx').value),updated:new Date().toISOString(),source:'手動覆寫'};try{commitDb(next)}catch(err){return alert(err.message)}e.target.reset();$('qFx').value=db.meta?.currentUsdTwd?Number(db.meta.currentUsdTwd).toFixed(4):1};
function renderQuotes(){const rows=Object.entries(db.quotes);$('quoteTable').innerHTML=`<thead><tr><th>代號</th><th>現價</th><th>目前匯率</th><th>來源</th><th>更新時間</th><th></th></tr></thead><tbody>`+(rows.length?rows.map(([t,q])=>`<tr><td>${E(t)}</td><td>${F(q.price,4)}</td><td>${F(q.fx,4)}</td><td>${E(q.source||'既有資料')}</td><td>${new Date(q.updated).toLocaleString('zh-TW')}</td><td><button class="tiny danger" data-delete-quote="${E(t)}">刪除</button></td></tr>`).join(''):`<tr><td colspan="6" class="empty">尚無現價</td></tr>`)+`</tbody>`}
window.delQ=t=>{try{const next=JSON.parse(JSON.stringify(db));delete next.quotes[t];commitDb(next)}catch(err){alert(err.message)}};
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};$('exportJson').onclick=()=>dl(`stock-ledger-${new Date().toISOString().slice(0,10)}.json`,(storageBlocked?localStorage.getItem(KEY):JSON.stringify(db,null,2)),'application/json');$('exportCsv').onclick=()=>{const cols=['id','name','tax','settlementTwd','originalRiskBase','RMultiple','brokerPnlScope','date','account','ticker','asset','side','qty','price','fee','fx','stop','currency','exitReason','brokerPnlBase','brokerPnlTwd','tradeReturnPct','note'];const lines=[cols.join(',')].concat(db.transactions.map(t=>cols.map(k=>`"${String(t[k]??'').replaceAll('"','""')}"`).join(',')));dl(`transactions-${new Date().toISOString().slice(0,10)}.csv`,'\ufeff'+lines.join('\n'),'text/csv;charset=utf-8')};
function normText(v){return String(v??'').trim()}
function txKey(t){
  // Normal stock transaction key. Use stable economic fields, not generated id.
  return [
    normText(t.account), normText(t.ticker).toUpperCase(), normText(t.date),
    normText(t.side), Number(t.qty||0).toFixed(8), Number(t.price||0).toFixed(8),
    normText(t.currency)
  ].join('|');
}
function manualTradeKey(t){
  return [
    normText(t.ticker).toUpperCase(), normText(t.direction),
    normText(t.open), normText(t.close),
    Number(t.entry||0).toFixed(8), Number(t.exit||0).toFixed(8),
    Number(t.qty||0).toFixed(8)
  ].join('|');
}


function parseCsvLine(line){
  const out=[]; let cur='', inQ=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(inQ && line[i+1]==='"'){cur+='"';i++;}
      else inQ=!inQ;
    }else if(ch===',' && !inQ){out.push(cur);cur='';}
    else cur+=ch;
  }
  out.push(cur);
  return out;
}
function parseCsv(text){
 const rows=[];let row=[],field='',quoted=false;const src=text.replace(/^\uFEFF/,'');
 for(let i=0;i<src.length;i++){const ch=src[i];if(ch==='"'){if(quoted&&src[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(!quoted&&(ch===','||ch==='\n'||ch==='\r')){row.push(field);field='';if(ch!==','){if(row.some(x=>x.trim()))rows.push(row);row=[];if(ch==='\r'&&src[i+1]==='\n')i++;}}else field+=ch;}
 if(quoted)throw Error('CSV 引號未結束');row.push(field);if(row.some(x=>x.trim()))rows.push(row);
 if(!rows.length)return [];const headers=rows.shift().map(x=>x.trim());if(new Set(headers).size!==headers.length)throw Error('CSV 標題重複');return rows.map(vals=>{if(vals.length!==headers.length)throw Error('CSV 欄數不符');return Object.fromEntries(headers.map((h,i)=>[h,vals[i]]));});
}

function pickField(row, candidates){
  const keys=Object.keys(row);
  for(const c of candidates){
    const exact=keys.find(k=>k.trim().toLowerCase()===c.toLowerCase());
    if(exact!=null && normText(row[exact])!=='') return row[exact];
  }
  for(const c of candidates){
    const fuzzy=keys.find(k=>k.toLowerCase().includes(c.toLowerCase()));
    if(fuzzy!=null && normText(row[fuzzy])!=='') return row[fuzzy];
  }
  return '';
}
function parseNum(v){
  const raw=String(v??'').replace(/,/g,'').replace(/%/g,'').trim();if(!raw)return NaN;const x=Number(raw);
  return Number.isFinite(x)?x:NaN;
}
function normalizeDateTime(v){
  let s=normText(v);
  if(!s)return '';
  s=s.replace(/\//g,'-');
  // Keep Binance local timestamps as local wall time; transform "YYYY-MM-DD HH:mm:ss" to ISO-like local.
  const m=s.match(/(\d{4}-\d{1,2}-\d{1,2})[ T](\d{1,2}:\d{2}:\d{2})/);
  if(m){
    const d=m[1].split('-').map((x,i)=>i?x.padStart(2,'0'):x).join('-');
    return d+'T'+m[2];
  }
  return s;
}
function binanceRowToTrade(row){
  // Supports common Binance exported "position history" column name variants in Chinese/English.
  const ticker=normText(pickField(row,['symbol','符號','交易對','合約','幣種','symbol/contract'])).toUpperCase();
  const sideRaw=normText(pickField(row,['direction','方向','side','倉位方向','position side'])).toUpperCase();
  const open=normalizeDateTime(pickField(row,['open time','已開啟','開倉時間','開倉日期','entry time']));
  const close=normalizeDateTime(pickField(row,['close time','已關閉','平倉時間','平倉日期','exit time']));
  const entry=parseNum(pickField(row,['average entry price','avg entry price','進場價格','平均開倉價','開倉均價','entry price']));
  const exit=parseNum(pickField(row,['average close price','avg close price','平均收盤價','平倉均價','平均平倉價','close price']));
  const qty=parseNum(pickField(row,['closed volume','已平倉交易量','quantity','qty','數量','成交數量','平倉數量']));
  const pnl=parseNum(pickField(row,['realized pnl','realized profit','平倉盈虧','已實現盈虧','realized profit and loss']));
  let ret=parseNum(pickField(row,['roi','收益率','return','報酬率']));
  // ROI unit is never guessed by its magnitude. Missing ROI remains unknown.
  if(Number.isFinite(ret)&&!String(pickField(row,['roi','收益率','return','報酬率'])).includes('%'))ret=NaN;
  if(!sideRaw||!/(LONG|SHORT|BUY|SELL|多|空)/.test(sideRaw))return null;
  let direction='LONG';
  if(sideRaw.includes('SHORT')||sideRaw.includes('SELL')||sideRaw.includes('空')) direction='SHORT';

  if(!ticker || !open || !close || !Number.isFinite(entry) || !Number.isFinite(exit) || !Number.isFinite(qty) || qty<=0){
    return null;
  }
  const priceReturn = direction==='SHORT' ? (entry-exit)/entry*100 : (exit-entry)/entry*100;
  return {
    ticker,
    asset: ticker.includes('BTC')?'BTC永續合約':ticker.includes('CL')?'原油永續':'加密/永續合約',
    direction,
    open, close, entry, exit, qty,
    pnl:Number.isFinite(pnl)?pnl:null,
    currency:'USDT',
    returnPct:Number.isFinite(ret)?ret:null,
    priceReturnPct:priceReturn,
    rMultiple:null,
    exitReason:(Number.isFinite(pnl)&&pnl<0)?'平倉虧損':'平倉',
    note:`由 Binance CSV 自動匯入${normText(pickField(row,['保證金模式','margin mode']))?'；'+normText(pickField(row,['保證金模式','margin mode'])):''}；原始停損若CSV未提供，R multiple維持N/A。`
  };
}
function importBinanceRows(rows){
  db.manualTrades=Array.isArray(db.manualTrades)?db.manualTrades:[];
  const existing=db.manualTrades;
  let added=0, skipped=0, failed=0;
  for(const row of rows){
    const t=binanceRowToTrade(row);
    if(!t){failed++;continue}
    const k=manualTradeKey(t);
    if(existing.some(x=>Ledger.sameManual(x,t))){skipped++;continue}
    if(existing.some(x=>Ledger.manualKey(x)===Ledger.manualKey(t)))throw Error('歷史交易衝突：'+t.ticker+' '+t.open);db.manualTrades.push(t); added++;
  }
  db.meta=db.meta||{};
  db.meta.lastBinanceImport=new Date().toISOString();
  return {added,skipped,failed};
}

$('importJson').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{
 const incoming=Ledger.applyPolicy(JSON.parse(await f.text()),db.meta.fundPlan),{db:next,report:r}=Ledger.merge(db,incoming);
 const msg='匯入預覽\n股票 新增 '+r.txAdded+' / 修正 '+r.txUpdated+' / 重複 '+r.txSkipped+'\n歷史 新增 '+r.manualAdded+' / 修正 '+r.manualUpdated+' / 重複 '+r.manualSkipped+'\n資金池、行情保持手機原值\n'+r.changes.slice(0,15).join('\n');
 if(confirm(msg+'\n確認寫入？')){commitDb(next);alert('匯入完成，已保留還原快照');}
 }catch(err){alert('未匯入：'+err.message)}finally{e.target.value='';}};
$('importBinanceCsv').onchange=async e=>{
  const f=e.target.files[0]; if(!f)return;
  try{
    const rows=parseCsv(await f.text());
    const previous=db;db=JSON.parse(JSON.stringify(db));let draft;let r;
    try{r=importBinanceRows(rows);draft=Ledger.validate(db);}finally{db=previous;}
    if(r.failed)throw Error(r.failed+' 列無法解析，整份未匯入');
    if(!confirm('新增 '+r.added+' 筆、重複 '+r.skipped+' 筆；確認匯入？'))return;
    commitDb(draft);

    alert(`Binance CSV 匯入完成
新增：${r.added} 筆
略過重複：${r.skipped} 筆
無法解析：${r.failed} 筆`);
  }catch(err){
    console.error(err);
    alert('Binance CSV 未匯入：'+err.message);
  }finally{e.target.value=''}
};

$('restorePreImport').onclick=()=>{
  const raw=localStorage.getItem(KEY+'-preimport-backup');
  if(!raw)return alert('目前沒有可還原的匯入前快照。');
  if(!confirm('確定還原到最近一次匯入前的狀態？目前資料會被取代。'))return;
  try{const next=Ledger.applyPolicy(JSON.parse(raw),db.meta?.fundPlan);localStorage.setItem(KEY,JSON.stringify(next));db=next;storageBlocked=false;renderAll();alert('已還原到最近一次匯入前狀態；鎖定資金配置保持不變。')}
  catch{alert('快照損壞，無法還原。')}
};

let fundPlanEditing=false;
function setFundPlanEditing(editing){fundPlanEditing=editing;for(const id of ['cashLong','cashSwing','cashLoan','cashReserve'])$(id).readOnly=!editing;$('saveCash').hidden=!editing;$('cancelFundPlan').hidden=!editing;$('editFundPlan').hidden=editing;if($('fundLockState'))$('fundLockState').textContent=editing?'已解鎖，儲存後會重新鎖定':'🔒 已鎖定';}
$('editFundPlan').onclick=()=>{if(confirm('資金配置是績效計算基準。確定暫時解鎖調整？'))setFundPlanEditing(true)};
$('cancelFundPlan').onclick=()=>{setFundPlanEditing(false);renderCash()};
$('saveCash').onclick=()=>{try{const plan=Ledger.normalizeFundPlan({longTerm:N($('cashLong').value),swing:N($('cashSwing').value),loan:N($('cashLoan').value),reserve:N($('cashReserve').value)});if(plan.longTerm+plan.swing+plan.loan+plan.reserve<=0)throw Error('資金配置不可全部為 0');const next=JSON.parse(JSON.stringify(db));next.meta.fundPlan=plan;commitDb(next,plan);setFundPlanEditing(false);alert('資金配置已儲存並重新鎖定。')}catch(err){alert(err.message)}};
function renderCash(){const p=Ledger.normalizeFundPlan(db.meta?.fundPlan);$('cashLong').value=p.longTerm;$('cashSwing').value=p.swing;$('cashLoan').value=p.loan;$('cashReserve').value=p.reserve;if(!fundPlanEditing)setFundPlanEditing(false);if($('fundPlanTotal'))$('fundPlanTotal').textContent=M(p.longTerm+p.swing+p.loan+p.reserve)+' TWD'}
function renderAll(){const c=compute();$('dataWarnings').textContent=c.issues.join('；')||'資料正常｜'+db.transactions.length+' 筆股票交易・'+db.manualTrades.length+' 筆其他歷史交易';$('dataWarnings').classList.toggle('has-warning',c.issues.length>0);renderDash(c);renderTx();renderPos(c);renderPerf(c);renderManualTrades();renderQuotes();renderCash();if($('fxDash'))$('fxDash').innerHTML=db.meta?.currentUsdTwd?`USD/TWD <b>${F(db.meta.currentUsdTwd,4)}</b><span>更新 ${db.meta.fxUpdated?new Date(db.meta.fxUpdated).toLocaleString('zh-TW'):'—'}・歷史成交匯率不變</span>`:'USD/TWD 尚未成功更新；歷史成交匯率保持不變。'}
$('perfMarket').onchange=()=>renderAll();
$('txTable').addEventListener('click',e=>{const b=e.target.closest('[data-delete-tx]');if(b)window.delTx(b.dataset.deleteTx)});
$('quoteTable').addEventListener('click',e=>{const b=e.target.closest('[data-delete-quote]');if(b)window.delQ(b.dataset.deleteQuote)});
$('asset').addEventListener('change',()=>{if($('asset').value==='台股'){$('currency').value='TWD';$('fx').value=1;}});
$('qTicker').addEventListener('input',()=>{$('qFx').value=/^\d{4,6}$/.test($('qTicker').value.trim())?1:(db.meta?.currentUsdTwd||1)});
$('restoreJson').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const currentPlan=Ledger.normalizeFundPlan(db.meta?.fundPlan),next=Ledger.applyPolicy(JSON.parse(await f.text()),currentPlan);const c=Ledger.compute(next);if(c.issues.length)throw Error(c.issues.join('\n'));if(!confirm('完整還原將取代目前交易、歷史交易與行情。\n鎖定資金配置與分類規則會保留。\n還原檔：'+next.transactions.length+' 筆股票、'+next.manualTrades.length+' 筆歷史。\n請先匯出現有備份。確定？'))return;snapshot();localStorage.setItem(KEY,JSON.stringify(next));db=next;storageBlocked=false;renderAll();alert('完整還原完成；資金配置仍保持鎖定。');}catch(err){alert('未還原：'+err.message)}finally{e.target.value='';}};

renderAll();
if(db.meta?.currentUsdTwd&&$('currency').value==='USD')$('fx').value=Number(db.meta.currentUsdTwd).toFixed(4);
setTimeout(()=>!storageBlocked&&refreshAllQuotes(false),900);
setInterval(()=>{if(document.visibilityState==='visible')!storageBlocked&&refreshAllQuotes(false)},15*60*1000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')!storageBlocked&&refreshAllQuotes(false)});
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})
    .then(reg=>{reg.update();navigator.serviceWorker.addEventListener('controllerchange',()=>{if(confirm('新版已就緒，重新載入？未儲存表單會清除，已儲存交易保留。'))location.reload();});})
    .catch(()=>{});
}
