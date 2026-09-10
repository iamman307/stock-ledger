const CACHE='stock-ledger-v6-5-us-tw-quotes-20260910';
const ASSETS=['./','./index.html','./manifest.webmanifest','./v65-patch.js'];
const PATCH_TAG='<script src="./v65-patch.js?v=20260910"></script>';

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

async function patchHtml(resp){
  const type=resp.headers.get('content-type')||'';
  if(!type.includes('text/html')) return resp;
  let html=await resp.text();
  if(!html.includes('v65-patch.js')) html=html.replace('</body>',PATCH_TAG+'</body>');
  const headers=new Headers(resp.headers);
  headers.set('cache-control','no-store');
  return new Response(html,{status:resp.status,statusText:resp.statusText,headers});
}

self.addEventListener('fetch', event => {
  const req=event.request;
  const u=new URL(req.url);
  if(u.origin!==self.location.origin) return;

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const net=await fetch(req,{cache:'no-store'});
        const patched=await patchHtml(net);
        const copy=patched.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',copy));
        return patched;
      }catch(_e){
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
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
