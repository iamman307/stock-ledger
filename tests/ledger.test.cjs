const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const L=require('../ledger.js');
const empty=()=>({transactions:[],manualTrades:[],quotes:{},cash:{},meta:{}});
const tx=(id,side,qty,price,more={})=>({id,side,qty,price,date:'2026-01-01T09:00:00',account:'波段',ticker:'TEST',currency:'TWD',asset:'台股',fee:0,tax:0,fx:1,...more});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
let tests=0;
function test(name,run){run();tests++;console.log('PASS '+name);}
test('tax, settlement, partial exit and full-position broker override',()=>{
 const d=empty();d.transactions=[tx('a','BUY',2,100,{fee:2}),tx('b','SELL',1,120,{fee:1,tax:2}),tx('c','SELL',1,120,{fee:1,tax:2,brokerPnlBase:30,brokerPnlTwd:30,brokerPnlScope:'position'})];
 const c=L.compute(L.validate(d));assert.equal(c.trades.length,1);near(c.realized[0].pnlTwd,16);near(c.realized[1].pnlTwd,14);near(c.trades[0].realizedTwd,30);
});
test('missing stop on a purchase prevents incomplete-risk R',()=>{
 const d=empty();d.transactions=[tx('a','BUY',1,100,{stop:90}),tx('b','BUY',1,100),tx('c','SELL',2,120)];assert.ok(Number.isNaN(L.compute(d).trades[0].rMultiple));
 d.transactions[2].originalRiskBase=20;near(L.compute(d).trades[0].rMultiple,2);
});
test('oversell is reported and rejected on import',()=>{const d=empty();d.transactions=[tx('a','SELL',1,100)];assert.equal(L.compute(d).issues.length,1);assert.throws(()=>L.merge(empty(),d));});
test('partial position is not a completed sample',()=>{const d=empty();d.transactions=[tx('a','BUY',2,100),tx('b','SELL',1,110)];assert.equal(L.compute(d).trades.length,0);});
test('long-term and swing positions stay separate',()=>{const d=empty();d.transactions=[tx('a','BUY',1,100,{account:'長期'}),tx('b','BUY',1,200),tx('c','SELL',1,210)];const c=L.compute(d);assert.equal(c.trades.length,1);near(c.trades[0].realizedTwd,10);assert.equal(c.positions.find(p=>p.account==='長期').qty,1);});
test('locked ticker policy reclassifies current and imported records',()=>{
 const d=empty();d.transactions=[tx('a','BUY',1,100,{ticker:'MU',account:'波段'}),tx('b','BUY',1,100,{ticker:'TSLA',account:'長期'})];
 const p=L.applyPolicy(d);assert.equal(p.transactions[0].account,'長期');assert.equal(p.transactions[1].account,'波段');assert.deepEqual(p.meta.accountPolicy.longTermTickers,['MU','QQQM','AVGO']);assert.equal(p.meta.fundPlan.longTerm,1000000);assert.equal(p.meta.fundPlan.swing,700000);
});
test('fund summary starts from imported cash flows and keeps reserves separate',()=>{
 const d=empty();d.transactions=[tx('a','INIT',2,100,{ticker:'MU',account:'波段'}),tx('b','BUY',1,100),tx('c','SELL',1,120)];d.quotes.MU={price:150,fx:1};
 const p=L.applyPolicy(d,{longTerm:1000,swing:700,loan:100,reserve:200}),s=L.fundSummary(p);
 assert.equal(s.totalPlan,2000);assert.equal(s.protectedPlan,300);near(s.buckets['長期'].available,800);near(s.buckets['長期'].marketValue,300);near(s.buckets['波段'].available,720);near(s.buckets['波段'].realized,20);
});
test('idempotent merge, preserves cash and quotes, no mutation on failure',()=>{
 const d=empty();d.cash={長期:100};d.transactions=[tx('a','BUY',1,100)];const incoming=empty();incoming.transactions=[tx('a','BUY',1,101)];incoming.cash={長期:0};
 const m=L.merge(d,incoming);assert.equal(m.report.txUpdated,1);assert.equal(m.db.cash.長期,100);const twice=L.merge(m.db,incoming);assert.equal(twice.report.txUpdated,0);assert.equal(twice.report.txAdded,0);assert.equal(d.transactions[0].price,100);
 const before=JSON.stringify(d);incoming.transactions.push(tx('bad','SELL',5,120));assert.throws(()=>L.merge(d,incoming));assert.equal(JSON.stringify(d),before);
});
test('manual dedupe tolerates harmless price rounding',()=>{
 const a={ticker:'TEST',direction:'LONG',open:'2026-01-01T09:00:00',close:'2026-01-02T09:00:00',currency:'USDT',qty:0.1,entry:12345.123456789,exit:12456.123456789,pnl:11.1,returnPct:null};
 const b={...a,entry:12345.123457,exit:12456.123457};assert.equal(L.sameManual(a,b),true);const d=empty();d.manualTrades=[a];const src=empty();src.manualTrades=[b];assert.equal(L.merge(d,src).report.manualSkipped,1);
});
test('schema rejects duplicate IDs, wrong TWD FX and nonnumeric quantities',()=>{for(const change of [d=>d.transactions.push(d.transactions[0]),d=>d.transactions[0].fx=30,d=>d.transactions[0].qty='1']){const d=empty();d.transactions=[tx('a','BUY',1,100)];change(d);assert.throws(()=>L.validate(d));}});
test('expectancy includes break-even and works for all wins',()=>{near(L.stats([{realizedTwd:1,returnPct:10},{realizedTwd:0,returnPct:0}]).expectancy,5);near(L.stats([{realizedTwd:1,returnPct:10}]).expectancy,10);});
test('UI script executes with empty state; CSV missing ROI is null',()=>{
 const elems=new Map();const get=id=>{if(!elems.has(id))elems.set(id,{value:id==='perfMarket'?'all':'',addEventListener(){},innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},reset(){}});return elems.get(id);};
 const storage=new Map();const ctx={Ledger:L,console,document:{getElementById:get,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout(){},setInterval(){},navigator:{},location:{protocol:'file:'},alert(){},confirm:()=>true};ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),ctx);
 const t=vm.runInContext(`binanceRowToTrade({'符號':'TEST','倉位方向':'LONG','已開啟':'2026-01-01 09:00:00','已關閉':'2026-01-02 09:00:00','進場價格':'100','平均收盤價':'110','已平倉交易量':'1','平倉盈虧':'10'})`,ctx);
 assert.equal(t.returnPct,null);near(t.priceReturnPct,10);assert.ok(Number.isNaN(vm.runInContext("parseNum('')",ctx)));
});
test('fund estimates reconcile broker P/L without rewriting cash flows',()=>{
 const d=empty();d.transactions=[tx('a','INIT',2,100),tx('b','SELL',1,120,{brokerPnlTwd:30})];d.quotes.TEST={price:110,fx:1};
 const p=L.applyPolicy(d),before=JSON.stringify(p),s=L.fundSummary(p).buckets['波段'];
 near(s.available,700000-100+30);near(s.cashFlowAvailable,700000-200+120);near(s.reconciliationAdjustment,10);near(s.netGainKnown,40);assert.equal(JSON.stringify(p),before);
 delete p.quotes.TEST;const missing=L.fundSummary(p).buckets['波段'];assert.equal(missing.missingQuotes,1);assert.ok(Number.isNaN(missing.equityKnown));
});
test('capital source tracking crystallizes P/L before new self capital',()=>{
 const d=empty();d.meta.capitalTracking={enabled:true,resetDate:'2026-09-10',openingLoan:800,openingSelf:200,openingFamily:0,loanGross:1000,loanFee:10,principalRepaid:100,interestPaid:20,pnlBaselineTwd:0,events:[{id:'fund-1',date:'2026-10-01',type:'IN',source:'self',amount:100,pnlCheckpointTwd:100,note:'salary'}]};
 const p=L.applyPolicy(d),s=L.capitalSummary(p,200);
 near(s.attributedPnl.loan,153.33333333333334);near(s.attributedPnl.self,46.666666666666664);near(s.sourceTotal,1300);near(s.outstandingPrincipal,900);near(s.loanNetResult,123.33333333333334);assert.equal(s.configured,true);
});
test('pro-rata investment withdrawal preserves source ratio',()=>{
 const d=empty();d.meta.capitalTracking={enabled:true,resetDate:'2026-09-10',openingLoan:750,openingSelf:200,openingFamily:50,pnlBaselineTwd:0,events:[{id:'fund-1',date:'2026-10-01',type:'OUT',source:'proRata',amount:100,pnlCheckpointTwd:0,note:''}]};
 const s=L.capitalSummary(L.applyPolicy(d),0);near(s.values.loan,675);near(s.values.self,180);near(s.values.family,45);near(s.ratios.loan,.75);
});
test('merge keeps device capital settings instead of imported metadata',()=>{
 const d=empty();d.meta.capitalTracking={enabled:true,resetDate:'2026-09-10',openingLoan:100,openingSelf:20,openingFamily:0,pnlBaselineTwd:0,events:[]};
 const incoming=empty();incoming.meta.capitalTracking={enabled:true,resetDate:'2025-01-01',openingLoan:1,openingSelf:0,openingFamily:0,pnlBaselineTwd:0,events:[]};
 const merged=L.merge(L.applyPolicy(d),L.applyPolicy(incoming)).db;assert.equal(merged.meta.capitalTracking.resetDate,'2026-09-10');assert.equal(merged.meta.capitalTracking.openingLoan,100);
});
console.log(`${tests} checks passed`);
