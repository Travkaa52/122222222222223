// Service Worker для Дія PWA
// Precache App Shell + Robust Cache-First для відео і шрифтів + Stale-While-Revalidate для динамічних документів

const CACHE_NAME = 'diia-app-shell-v3';
const MEDIA_FONTS_CACHE_NAME = 'diia-media-fonts-v3';
const DOCUMENTS_CACHE_NAME = 'diia-documents-data-v3';

// 1. Критичні ресурси оболонки додатку (App Shell)
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/manifest.json',
  '/logo.mp4',
  '/background_gradient.mp4',
  '/assets/logo.mp4',
  '/assets/background_gradient.mp4',
  '/app.css',
  '/app.js',
  '/main.js',
  '/values.js',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/assets/e-Ukraine-Regular.woff',
  '/assets/e-Ukraine-Regular.woff2',
  '/assets/e-UkraineHead-Medium.woff',
  '/assets/e-UkraineHead-Bold.woff',
  '/assets/swiper-bundle.min.css',
  '/assets/swiper-bundle.min.js',
  '/assets/jquery.min.js',
  '/assets/anime.js',
  '/assets/diya.svg',
  '/assets/photo_passport.jpg',
  '/assets/user_photo.jpg',
  '/assets/gerb.png',
  '/assets/qr.svg',
  '/assets/dots.png',
  '/assets/copy.png',
  '/assets/addDocument.png',
  '/assets/arrow.svg'
];

// Встановлення та попереднє кешування App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL_ASSETS.map((assetUrl) =>
          cache.add(assetUrl).catch((err) => {
            console.warn('[SW] Не вдалося закешувати:', assetUrl, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Активація та очищення застарілих кешів
self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_NAME, MEDIA_FONTS_CACHE_NAME, DOCUMENTS_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!allowedCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обробка Range-запитів для відео (HTTP 206 Partial Content)
async function handleRangeVideoRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get('Range');
  if (!rangeHeader || !cachedResponse) {
    return cachedResponse;
  }

  const arrayBuffer = await cachedResponse.arrayBuffer();
  const bytes = /^bytes\=(\d+)-(\d+)?$/g.exec(rangeHeader);

  if (bytes) {
    const total = arrayBuffer.byteLength;
    const start = Number(bytes[1]);
    const end = bytes[2] ? Number(bytes[2]) : total - 1;

    if (start >= total || end >= total) {
      return new Response('', {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: { 'Content-Range': `bytes */${total}` }
      });
    }

    const slicedBuffer = arrayBuffer.slice(start, end + 1);
    return new Response(slicedBuffer, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(slicedBuffer.byteLength),
        'Accept-Ranges': 'bytes'
      }
    });
  }

  return cachedResponse;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ігноруємо розширення браузера та сокети розробки
  if (url.protocol.startsWith('chrome-extension')) return;

  // =========================================================================
  // 1. ВІДЕО-АССЕТИ: Cache-First з повною підтримкою Range-запитів
  // =========================================================================
  if (/\.(mp4|webm|ogv)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_FONTS_CACHE_NAME).then(async (mediaCache) => {
        let cached = await mediaCache.match(request, { ignoreSearch: true });
        if (!cached) {
          cached = await caches.match(request, { ignoreSearch: true });
        }

        if (cached) {
          return handleRangeVideoRequest(request, cached);
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            mediaCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Офлайн-фолбек: якщо відео запитано за іншим відносним шляхом, шукаємо в кеші
          const fallback =
            (await caches.match('/background_gradient.mp4')) ||
            (await caches.match('/assets/background_gradient.mp4')) ||
            (await caches.match('/logo.mp4')) ||
            (await caches.match('/assets/logo.mp4'));

          return fallback ? handleRangeVideoRequest(request, fallback) : Response.error();
        }
      })
    );
    return;
  }

  // =========================================================================
  // 2. ШРИФТИ (woff, woff2, ttf, otf, eot): Строгий Cache-First
  // =========================================================================
  if (/\.(woff2?|ttf|otf|eot)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_FONTS_CACHE_NAME).then(async (fontCache) => {
        const cachedFont = (await fontCache.match(request)) || (await caches.match(request));
        if (cachedFont) {
          return cachedFont;
        }

        try {
          const networkFont = await fetch(request);
          if (networkFont && networkFont.status === 200) {
            fontCache.put(request, networkFont.clone());
          }
          return networkFont;
        } catch (err) {
          return Response.error();
        }
      })
    );
    return;
  }

  // =========================================================================
  // 3. ДИНАМІЧНІ ДАНІ ДОКУМЕНТІВ: Stale-While-Revalidate
  // Забезпечує миттєве завантаження карток і документів без інтернету,
  // фоново оновлюючи дані при появі зв'язку.
  // =========================================================================
  const isDynamicDocumentData =
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('api') ||
    url.pathname.includes('/documents') ||
    url.pathname.endsWith('/values.js') ||
    url.pathname.endsWith('.json');

  if (isDynamicDocumentData) {
    event.respondWith(
      caches.open(DOCUMENTS_CACHE_NAME).then(async (docCache) => {
        const cachedData = (await docCache.match(request)) || (await caches.match(request));

        // Фоновий запит для ревалідації (оновлення кешу при доступності мережі)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              docCache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Мережа недоступна — якщо даних немає навіть у кеші, повертаємо валідний JSON-фолбек
            if (!cachedData) {
              return new Response(
                JSON.stringify({
                  offline: true,
                  message: 'Додаток працює в автономному режимі. Документи доступні локально.'
                }),
                {
                  status: 200,
                  headers: { 'Content-Type': 'application/json; charset=utf-8' }
                }
              );
            }
            return null;
          });

        // Повертаємо закешовані дані негайно, або чекаємо відповіді мережі
        return cachedData || fetchPromise;
      })
    );
    return;
  }

  // =========================================================================
  // 4. НАВІГАЦІЯ (HTML): Network-First з негайним переходом на index.html
  // =========================================================================
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // =========================================================================
  // 5. ІНШІ СТАТИЧНІ АССЕТИ (CSS, JS, SVG, PNG): Cache-First + Stale-While-Revalidate
  // =========================================================================
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});

// Слухач повідомлень для негайного оновлення Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
