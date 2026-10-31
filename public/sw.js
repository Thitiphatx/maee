const CACHE = 'maee-v10'
const PRECACHE = ['/', '/index.html']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('maee-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(event.request)
    if (cached) return cached

    try {
      const response = await fetch(event.request)
      if (response.ok) await cache.put(event.request, response.clone())
      return response
    } catch (error) {
      if (event.request.mode === 'navigate') {
        const offlinePage = await cache.match('/index.html')
        if (offlinePage) return offlinePage
      }
      throw error
    }
  })())
})
