/* Stock Ledger 6.6.0 — pure accounting, portfolio policy and atomic import planning. */
(function(root){
  'use strict';
  const VERSION='6.6.0';
  const LONG_TERM_TICKERS=Object.freeze(['MU','QQQM','AVGO']);
  const DEFAULT_FUND_PLAN=Object.freeze({longTerm:1000000,swing:700000,loan:100000,reserve:200000,locked:true});
  const clone = x => JSON.parse(JSON.stringify(x));
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  const has = x => x !== null && x !== undefined;
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  const positionKey = t => [t.account,t.ticker,t.currency].join('|');
  const manualKey = t => [t.ticker,t.direction,t.open,t.close,t.currency].join('|');
  const txKey = t => [positionKey(t),t.date,t.side,t.qty,t.price].join('|');
  const closeEnough = (a,b) => Math.abs(a-b)<=Math.max(1e-8,Math.abs(a)*1e-10);
  const classifyAccount=ticker=>LONG_TERM_TICKERS.includes(String(ticker||'').trim().toUpperCase())?'長期':'波段';
  function normalizeFundPlan(plan){
    const p=plan&&typeof plan==='object'&&!Array.isArray(plan)?plan:{};
    const amount=(key,fallback)=>finite(Number(p[key]))&&Number(p[key])>=0?Number(p[key]):fallback;
    return {longTerm:amount('longTerm',DEFAULT_FUND_PLAN.longTerm),swing:amount('swing',DEFAULT_FUND_PLAN.swing),loan:amount('loan',DEFAULT_FUND_PLAN.loan),reserve:amount('reserve',DEFAULT_FUND_PLAN.reserve),locked:true};
  }
  function applyPolicy(data,fundPlan){
    const d=clone(data);
    d.meta=d.meta&&typeof d.meta==='object'&&!Array.isArray(d.meta)?d.meta:{};
    d.transactions=Array.isArray(d.transactions)?d.transactions.map(t=>({...t,account:classifyAccount(t.ticker)})):d.transactions;
    d.meta.fundPlan=normalizeFundPlan(fundPlan??d.meta.fundPlan);
    d.meta.accountPolicy={longTermTickers:[...LONG_TERM_TICKERS],fallback:'波段',locked:true};
    d.meta.appVersion=VERSION;
    return validate(d);
  }
  function sameManual(a,b){return manualKey(a)===manualKey(b)&&['entry','exit','qty','pnl'].every(k=>a[k]===b[k]||(finite(a[k])&&finite(b[k])&&closeEnough(a[k],b[k])));}
  function validate(data){
    if(!data||!Array.isArray(data.transactions))throw Error('缺少 transactions 陣列');
    const d=clone(data); d.manualTrades=d.manualTrades??[];d.cash=d.cash??{};d.quotes=d.quotes??{};d.meta=d.meta??{};
    if(!Array.isArray(d.manualTrades))throw Error('manualTrades 必須是陣列');
    for(const k of ['cash','quotes','meta'])if(!d[k]||Array.isArray(d[k])||typeof d[k]!=='object')throw Error(k+' 格式錯誤');
    const ids=new Set();
    for(const [i,t] of d.transactions.entries()){
      const label='交易 '+(i+1);
      if(!t||typeof t!=='object')throw Error(label+' 格式錯誤');
      for(const k of ['id','date','account','ticker','currency','asset'])if(typeof t[k]!=='string'||!t[k].trim())throw Error(label+' 缺少 '+k);
      if(['__proto__','constructor','prototype'].includes(t.ticker))throw Error(label+' 代號不合法');
      if(ids.has(t.id))throw Error(label+' 重複 ID');ids.add(t.id);
      if(!['BUY','SELL','INIT'].includes(t.side)||!['長期','波段'].includes(t.account))throw Error(label+' 類型錯誤');
      if(!Number.isFinite(Date.parse(t.date)))throw Error(label+' 日期錯誤');
      for(const k of ['qty','price','fx'])if(!finite(t[k])||t[k]<=0)throw Error(label+' '+k+' 必須大於 0');
      for(const k of ['fee','tax']){if(has(t[k])&&(!finite(t[k])||t[k]<0))throw Error(label+' '+k+' 格式錯誤');}
      for(const k of ['stop','brokerPnlBase','brokerPnlTwd','tradeReturnPct','settlementTwd','originalRiskBase','RMultiple'])if(has(t[k])&&!finite(t[k]))throw Error(label+' '+k+' 必須是數字或 null');
      if(t.currency==='TWD'&&t.fx!==1)throw Error(label+' 台幣匯率必須為 1');
      if(has(t.originalRiskBase)&&t.originalRiskBase<=0)throw Error(label+' 原始風險必須大於 0');
      if(has(t.brokerPnlScope)&&!['execution','position'].includes(t.brokerPnlScope))throw Error(label+' 券商損益範圍錯誤');
    }
    const manualIds=new Set();
    for(const [i,t] of d.manualTrades.entries()){
      if(!t||!['LONG','SHORT'].includes(t.direction)||!t.ticker||!t.currency)throw Error('歷史交易 '+(i+1)+' 格式錯誤');
      for(const k of ['open','close'])if(!Number.isFinite(Date.parse(t[k])))throw Error('歷史交易日期錯誤');
      if(Date.parse(t.close)<Date.parse(t.open))throw Error('平倉不可早於開倉');
      for(const k of ['qty','entry','exit'])if(!finite(t[k])||t[k]<=0)throw Error('歷史交易 '+k+' 錯誤');
      for(const k of ['pnl','returnPct','priceReturnPct','rMultiple'])if(has(t[k])&&!finite(t[k]))throw Error('歷史交易 '+k+' 錯誤');
      if(t.id){if(manualIds.has(t.id))throw Error('歷史交易重複 ID');manualIds.add(t.id);}
    }
    for(const v of Object.values(d.cash))if(!finite(v))throw Error('資金池必須為數字');
    for(const q of Object.values(d.quotes))if(!q||!finite(q.price)||q.price<=0||!finite(q.fx)||q.fx<=0)throw Error('行情價格或匯率錯誤');
    return d;
  }
  function compute(data){
    const positions=new Map(),active=new Map(),realized=[],trades=[],issues=[];
    const tx=[...data.transactions].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
    for(const t of tx){
      const key=positionKey(t);
      if(!positions.has(key))positions.set(key,{account:t.account,ticker:t.ticker,currency:t.currency,asset:t.asset,qty:0,costBase:0,costTwd:0});
      const p=positions.get(key),gross=t.qty*t.price,fees=(t.fee||0)+(t.tax||0);
      if(t.side==='BUY'||t.side==='INIT'){
        const base=gross+fees,twd=has(t.settlementTwd)?Math.abs(t.settlementTwd):base*t.fx;
        if(!p.qty)active.set(key,{ticker:t.ticker,asset:t.asset,currency:t.currency,account:t.account,open:t.date,buyCostTwd:0,buyCostBase:0,realizedTwd:0,realizedBase:0,riskBase:0,riskComplete:true,estimated:t.side==='INIT',exitReason:''});
        const tr=active.get(key);tr.buyCostTwd+=twd;tr.buyCostBase+=base;
        if(has(t.stop)&&t.stop<t.price&&t.stop>=0)tr.riskBase+=(t.price-t.stop)*t.qty+fees;else tr.riskComplete=false;
        p.qty+=t.qty;p.costBase+=base;p.costTwd+=twd;
      }else if(t.side==='SELL'){
        if(t.qty>p.qty+1e-9||p.qty<=0){issues.push(t.ticker+' '+t.date+'：賣出數量大於持倉，損益未納入');continue;}
        const costBase=p.costBase*t.qty/p.qty,costTwd=p.costTwd*t.qty/p.qty;
        const calcPnlBase=gross-fees-costBase;
        const calcPnlTwd=(has(t.settlementTwd)?t.settlementTwd:(gross-fees)*t.fx)-costTwd;
        const tr=active.get(key),whole=t.brokerPnlScope==='position';
        if(whole&&Math.abs(p.qty-t.qty)>1e-8){issues.push(t.ticker+'：整輪損益只能用於最後平倉');continue;}
        // Whole-position broker totals reconcile the accumulated results once.
        // The last realization is a balancing allocation, not a broker fill P/L.
        const pnlBase=has(t.brokerPnlBase)?t.brokerPnlBase-(whole?tr.realizedBase:0):calcPnlBase;
        const pnlTwd=has(t.brokerPnlTwd)?t.brokerPnlTwd-(whole?tr.realizedTwd:0):calcPnlTwd;
        realized.push({...t,pnlBase,pnlTwd,calcPnlBase,calcPnlTwd});
        p.qty-=t.qty;p.costBase-=costBase;p.costTwd-=costTwd;
        tr.realizedBase+=pnlBase;tr.realizedTwd+=pnlTwd;tr.exitReason=t.exitReason||tr.exitReason;
        if(Math.abs(p.qty)<1e-8){
          p.qty=0;p.costBase=0;p.costTwd=0;
          tr.close=t.date;
          tr.returnPct=has(t.tradeReturnPct)?t.tradeReturnPct:tr.realizedBase/tr.buyCostBase*100;
          const risk=has(t.originalRiskBase)?t.originalRiskBase:(tr.riskComplete?tr.riskBase:0);
          tr.rMultiple=risk>0?tr.realizedBase/risk:NaN;
          tr.riskBase=risk;tr.holdHours=(Date.parse(tr.close)-Date.parse(tr.open))/36e5;
          if(t.account==='波段')trades.push({...tr});
        }
      }
    }
    return {positions:[...positions.values()],realized,trades,issues};
  }
  function transactionValueTwd(t){
    if(has(t.settlementTwd)&&finite(t.settlementTwd))return Math.abs(t.settlementTwd);
    const gross=t.qty*t.price,fees=(t.fee||0)+(t.tax||0);
    return (t.side==='SELL'?Math.max(0,gross-fees):gross+fees)*t.fx;
  }
  function fundSummary(data,result){
    const plan=normalizeFundPlan(data?.meta?.fundPlan),computed=result||compute(data);
    const buckets={
      '長期':{allocation:plan.longTerm,available:plan.longTerm,cost:0,marketValue:0,realized:0,missingQuotes:0,tickers:[]},
      '波段':{allocation:plan.swing,available:plan.swing,cost:0,marketValue:0,realized:0,missingQuotes:0,tickers:[]}
    };
    for(const t of data.transactions){
      const b=buckets[classifyAccount(t.ticker)],value=transactionValueTwd(t);
      b.available+=t.side==='SELL'?value:-value;
    }
    for(const p of computed.positions.filter(x=>x.qty>0)){
      const b=buckets[classifyAccount(p.ticker)],q=data.quotes[p.ticker];
      b.cost+=p.costTwd;b.tickers.push(p.ticker);
      if(q&&finite(q.price)&&q.price>0&&finite(q.fx)&&q.fx>0)b.marketValue+=p.qty*q.price*q.fx;
      else b.missingQuotes++;
    }
    for(const t of computed.realized)buckets[classifyAccount(t.ticker)].realized+=t.pnlTwd;
    for(const b of Object.values(buckets)){
      b.tickers=[...new Set(b.tickers)];
      b.equityKnown=b.available+b.marketValue;
      b.netGainKnown=b.equityKnown-b.allocation;
      b.usagePct=b.allocation?(b.allocation-b.available)/b.allocation*100:NaN;
    }
    return {plan,buckets,totalPlan:plan.longTerm+plan.swing+plan.loan+plan.reserve,investmentPlan:plan.longTerm+plan.swing,protectedPlan:plan.loan+plan.reserve};
  }
  function merge(current,incoming){
    const d=validate(current),src=validate(incoming),report={txAdded:0,txUpdated:0,txSkipped:0,manualAdded:0,manualUpdated:0,manualSkipped:0,changes:[]};
    for(const t of src.transactions){
      const idx=d.transactions.findIndex(x=>x.id===t.id);
      if(idx>=0){
        const old=d.transactions[idx],next={...old,...t};
        const changed=Object.keys(next).filter(k=>JSON.stringify(next[k])!==JSON.stringify(old[k]));
        if(changed.length){d.transactions[idx]=next;report.txUpdated++;report.changes.push(t.ticker+' '+t.date+'：'+changed.join(', '));}else report.txSkipped++;
      }else{
        const match=d.transactions.find(x=>txKey(x)===txKey(t));
        if(match){
          const fields=['fee','tax','fx','stop','brokerPnlBase','brokerPnlTwd','brokerPnlScope','tradeReturnPct','settlementTwd','originalRiskBase'];
          if(fields.some(k=>has(t[k])&&t[k]!==match[k]))throw Error('相同成交但 ID 不同且欄位衝突：'+t.ticker+' '+t.date+'。請沿用既有 ID 修正。');
          report.txSkipped++;
        }else{d.transactions.push(t);report.txAdded++;}
      }
    }
    for(const t of src.manualTrades){
      const idx=t.id?d.manualTrades.findIndex(x=>x.id===t.id):-1;
      if(idx>=0){const next={...d.manualTrades[idx],...t};if(JSON.stringify(next)!==JSON.stringify(d.manualTrades[idx])){d.manualTrades[idx]=next;report.manualUpdated++;}else report.manualSkipped++;}
      else if(d.manualTrades.some(x=>sameManual(x,t)))report.manualSkipped++;
      else if(d.manualTrades.some(x=>manualKey(x)===manualKey(t)))throw Error('歷史交易衝突：'+t.ticker+' '+t.open+'。請使用完整還原或穩定 ID 修正。');
      else{d.manualTrades.push(t);report.manualAdded++;}
    }
    // Import files cannot silently change live cash balances or quote snapshots.
    const checked=validate(d),result=compute(checked);
    if(result.issues.length)throw Error(result.issues.join('\n'));
    return {db:checked,report};
  }
  function stats(trades){
    const wins=trades.filter(t=>t.realizedTwd>0),losses=trades.filter(t=>t.realizedTwd<0),n=trades.length;
    const avg=a=>a.length?a.reduce((s,t)=>s+t.returnPct,0)/a.length:NaN;
    const aw=avg(wins),al=Math.abs(avg(losses));
    return {count:n,winRate:n?wins.length/n*100:NaN,avgWin:aw,avgLoss:al,payoff:al>0?aw/al:NaN,expectancy:avg(trades)};
  }
  const api={VERSION,LONG_TERM_TICKERS,DEFAULT_FUND_PLAN,validate,compute,merge,stats,sameManual,manualKey,classifyAccount,normalizeFundPlan,applyPolicy,fundSummary,transactionValueTwd};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.Ledger=api;
})(typeof globalThis!=='undefined'?globalThis:this);
