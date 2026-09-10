/* Stock Ledger 6.7.1: private device-only capital setup import. */
const CACHE='stock-ledger-v6-7-1-20260910';
const ASSETS=['./index.html','./ledger.js?v=6.7.1','./app.js?v=6.7.1','./manifest.webmanifest'];
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
