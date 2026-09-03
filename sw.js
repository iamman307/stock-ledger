const CACHE='stock-ledger-v6-4-quote-bridge-20260904';
const ASSETS=['./','./index.html','./manifest.webmanifest'];
const SNAPSHOT='https://raw.githubusercontent.com/iamman307/stock-ledger/quotes-data/quotes.json';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function yahooBridgeResponse(reqUrl){
  try{
    const u=new URL(reqUrl);
    const prefix='/v8/finance/chart/';
    const idx=u.pathname.indexOf(prefix);
    if(idx<0)return null;
    const symbol=decodeURIComponent(u.pathname.slice(idx+prefix.length)).toUpperCase();

    const r=await fetch(SNAPSHOT+'?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw new Error('snapshot '+r.status);
    const snap=await r.json();

    let q=null;
    if(symbol==='TWD=X' || symbol==='USDTWD=X'){
      const rate=Number(snap.usdTwd);
      if(Number.isFinite(rate)&&rate>0){
        q={price:rate,currency:'TWD',exchange:'FX',marketState:'',previousClose:rate};
      }
    }else{
      q=snap?.quotes?.[symbol]||null;
    }

    if(!q || !Number.isFinite(Number(q.price))){
      return new Response(JSON.stringify({chart:{result:null,error:{code:'Not Found',description:'Symbol not in quote snapshot'}}}),{
        status:404,
        headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
      });
    }

    const price=Number(q.price);
    const payload={
      chart:{
        result:[{
          meta:{
            regularMarketPrice:price,
            previousClose:Number(q.previousClose)||price,
            chartPreviousClose:Number(q.previousClose)||price,
            exchangeName:q.exchange||'',
            currency:q.currency||'USD',
            marketState:q.marketState||''
          },
          timestamp:[],
          indicators:{quote:[{}]}
        }],
        error:null
      }
    };
    return new Response(JSON.stringify(payload),{
      status:200,
      headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
    });
  }catch(e){
    return new Response(JSON.stringify({chart:{result:null,error:{code:'SnapshotError',description:String(e?.message||e)}}}),{
      status:503,
      headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
    });
  }
}

self.addEventListener('fetch', event => {
  const req=event.request;
  const u=new URL(req.url);

  if(u.hostname==='query1.finance.yahoo.com' && u.pathname.includes('/v8/finance/chart/')){
    event.respondWith(yahooBridgeResponse(req.url));
    return;
  }

  if(u.origin!==self.location.origin)return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req)
        .then(resp=>{
          const copy=resp.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
          return resp;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(cache=>cache.put(req,copy));
        return resp;
      })
      .catch(()=>caches.match(req))
  );
});
