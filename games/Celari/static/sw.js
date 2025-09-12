importScripts("celari.config.js");
importScripts("sw.bundle.js");

self.addEventListener("fetch", (event) => {
  event.respondWith(self.routeCelari(event.request));
});
