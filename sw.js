// Aumente o número da versão sempre que atualizar a tabela, para os celulares baixarem a versão nova.
const VERSAO = 'quiron-v5';
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Páginas e arquivos do app: tenta a rede primeiro (pega atualizações) e cai no cache sem internet.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then((r) => {
        const copia = r.clone();
        caches.open(VERSAO).then((c) => c.put(e.request, copia));
        return r;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // Fontes do Google: guarda para funcionar sem internet.
  if (url.host.endsWith('googleapis.com') || url.host.endsWith('gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request).then((n) => {
        const copia = n.clone();
        caches.open(VERSAO).then((c) => c.put(e.request, copia));
        return n;
      }).catch(() => r))
    );
  }
});
