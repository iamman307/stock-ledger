const CACHE='stock-ledger-v6-4-github-quotes-20260904';
const ASSETS=['./','./index.html','./manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req=event.request;
  const u=new URL(req.url);
  if(u.origin!==self.location.origin) return; // quote snapshot goes straight to network

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',copy));
        return resp;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(req).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
      return resp;
    }).catch(()=>caches.match(req))
  );
});
