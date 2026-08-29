const CACHE="training-tracker-v2.8.1";
const ASSETS=["./","./index.html","./app.css?v=2.3.2","./plan.js?v=2.3.2","./app.js?v=2.3.2","./recommendation.js?v=2.3.2","./storage.js?v=2.3.2","./manifest.webmanifest","./icon.svg"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;

  if(e.request.mode==="navigate"){
    e.respondWith(
      fetch(e.request).then(r=>{
        const copy=r.clone();
        caches.open(CACHE).then(c=>c.put("./index.html",copy));
        return r;
      }).catch(()=>caches.match("./index.html"))
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request))
  );
});