/* Stock Ledger 6.6.0: locked fund policy and refreshed mobile dashboard. */
const CACHE='stock-ledger-v6-6-0-20260910';
const ASSETS=['./index.html','./ledger.js?v=6.6.0','./app.js?v=6.6.0','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('stock-ledger-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith(caches.open(CACHE).then(c=>c.match('./index.html')).then(r=>r||fetch(req)));
  return;
 }
 if(!ASSETS.some(p=>new URL(p,self.registration.scope).href===url.href))return;
 event.respondWith(caches.open(CACHE).then(async c=>(await c.match(req))||fetch(req)));
});
