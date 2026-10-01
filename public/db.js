/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  db.js — синхронізація ПВА з БД через Telegram бота  ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Архітектура:                                       ║
 * ║  Telegram Bot (Python/Node) <-> GitHub Actions       ║
 * ║  <- JSON файл у репо по userId ->                   ║
 * ║  ПВА при старті: GET /api/user?uid={tgId}           ║
 * ║  Бот при /set: POST /api/user  body={uid, field, v}  ║
 * ║                                                      ║
 * ║  Або через GitHub Actions + GitHub Pages JSON:       ║
 * ║  https://raw.githubusercontent.com/{repo}/           ║
 * ║    main/users/{userId}.json                          ║
 * ╚══════════════════════════════════════════════════════╝
 */

(function (global) {
  'use strict';

  // ────────────────────────────────────────────────────
  // 🔧 НАЛАШТУВАННЯ ЗА ЗАМОВЧУВАННЯМ
  // ────────────────────────────────────────────────────
  const DB_CONFIG = {
    // Варіант A: raw GitHub JSON ('github_raw')
    // Варіант B: Власний API / Cloudflare Workers ('api')
    mode: 'github_raw',   // 'github_raw' | 'api'

    // Для mode = 'github_raw'
    githubRaw: 'https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/users',

    // Для mode = 'api'
    apiBase: 'https://your-api.vercel.app/api',

    // Скільки тримати кеш у пам'яті (мс)
    cacheTtlMs: 60_000,

    // Fallback ID для тестування поза Telegram WebApp
    fallbackUserId: 'demo_user',
  };

  /* ════════════════════════════════════════════════════
     1. Отримання userId з Telegram WebApp або URL param
     ════════════════════════════════════════════════════ */
  function getTelegramUserId() {
    try {
      const tg = global.Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user?.id) {
        return String(tg.initDataUnsafe.user.id);
      }
    } catch (e) {
      console.warn('[DB] Telegram WebApp context unavailable:', e);
    }

    // Fallback: ?uid=123 у URL (для тестування)
    const urlUid = new URLSearchParams(location.search).get('uid');
    if (urlUid) return urlUid;

    return DB_CONFIG.fallbackUserId;
  }

  /* ════════════════════════════════════════════════════
     2. Завантаження даних з БД
     ════════════════════════════════════════════════════ */
  let _cache = null;
  let _cacheTime = 0;
  let _uid = null;

  async function loadUserData() {
    _uid = _uid || getTelegramUserId();

    // Перевіряємо кеш у пам'яті
    if (_cache && (Date.now() - _cacheTime) < DB_CONFIG.cacheTtlMs) {
      return _cache;
    }

    let data = null;

    try {
      if (DB_CONFIG.mode === 'github_raw') {
        const url = `${DB_CONFIG.githubRaw}/${_uid}.json?t=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          data = await res.json();
        }
      } else {
        // mode = 'api'
        const res = await fetch(`${DB_CONFIG.apiBase}/user?uid=${_uid}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const json = await res.json();
          data = json.data || json;
        }
      }
    } catch (e) {
      console.warn('[DB] Не вдалося завантажити дані з мережі:', e);
    }

    if (data) {
      _cache = data;
      _cacheTime = Date.now();
      // Зберігаємо локально як резервну копію
      try {
        localStorage.setItem('diya_db_cache_' + _uid, JSON.stringify(data));
      } catch (e) {
        console.warn('[DB] Не вдалося зберегти у localStorage:', e);
      }
    } else {
      // Використовуємо локальний кеш якщо мережа недоступна
      try {
        const local = localStorage.getItem('diya_db_cache_' + _uid);
        if (local) {
          _cache = JSON.parse(local);
          console.log('[DB] Завантажено локальні дані з кешу');
        }
      } catch (e) {
        console.warn('[DB] Помилка читання з localStorage:', e);
      }
    }

    return _cache;
  }

  /* ════════════════════════════════════════════════════
     3. Збереження окремого поля
     ════════════════════════════════════════════════════ */
  async function saveField(field, value) {
    _uid = _uid || getTelegramUserId();

    if (!_cache) _cache = {};
    _cache[field] = value;
    _cacheTime = Date.now();

    try {
      localStorage.setItem('diya_db_cache_' + _uid, JSON.stringify(_cache));
    } catch (e) {}

    if (DB_CONFIG.mode !== 'api') {
      return true;
    }

    try {
      const res = await fetch(`${DB_CONFIG.apiBase}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: _uid, field, value }),
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('[DB] saveField error:', e);
    }
    return false;
  }

  /* ════════════════════════════════════════════════════
     4. Масове збереження полів (saveAllFields)
     ════════════════════════════════════════════════════ */
  async function saveAllFields(fieldsObj) {
    _uid = _uid || getTelegramUserId();

    if (!_cache) _cache = {};
    Object.assign(_cache, fieldsObj);
    _cacheTime = Date.now();

    try {
      localStorage.setItem('diya_db_cache_' + _uid, JSON.stringify(_cache));
    } catch (e) {}

    if (DB_CONFIG.mode !== 'api') {
      console.info('[DB] saveAllFields: збережено локально (режим github_raw)');
      return true;
    }

    try {
      const res = await fetch(`${DB_CONFIG.apiBase}/user/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: _uid, fields: fieldsObj }),
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('[DB] saveAllFields error:', e);
    }
    return false;
  }

  /* ════════════════════════════════════════════════════
     5. Polling (періодична перевірка оновлень)
     ════════════════════════════════════════════════════ */
  let _pollingInterval = null;

  function startPolling(intervalMs = 30_000, onUpdate) {
    if (_pollingInterval) clearInterval(_pollingInterval);
    _pollingInterval = setInterval(async () => {
      const prevJson = JSON.stringify(_cache);
      _cacheTime = 0; // Скидаємо таймер кешу для примусового фетчу

      try {
        if (typeof global.setAllSyncing === 'function') global.setAllSyncing('syncing');
        const fresh = await loadUserData();
        if (typeof global.setAllSyncing === 'function') global.setAllSyncing('ok');

        if (fresh && JSON.stringify(fresh) !== prevJson) {
          console.log('[DB] Виявлено нові дані з сервера/бота');
          if (typeof onUpdate === 'function') onUpdate(fresh);
        }
      } catch (err) {
        if (typeof global.setAllSyncing === 'function') global.setAllSyncing('error');
      }
    }, intervalMs);
  }

  function stopPolling() {
    if (_pollingInterval) {
      clearInterval(_pollingInterval);
      _pollingInterval = null;
    }
  }

  /* ════════════════════════════════════════════════════
     6. Server-Sent Events (SSE)
     ════════════════════════════════════════════════════ */
  let _sse = null;

  function disconnectSSE() {
    if (_sse) {
      _sse.close();
      _sse = null;
    }
  }

  function connectSSE(onUpdate) {
    disconnectSSE();

    if (DB_CONFIG.mode !== 'api') {
      startPolling(30_000, onUpdate);
      return;
    }

    try {
      _uid = _uid || getTelegramUserId();
      _sse = new EventSource(`${DB_CONFIG.apiBase}/stream?uid=${_uid}`);

      _sse.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && typeof data === 'object') {
            _cache = { ..._cache, ...data };
            _cacheTime = Date.now();
            if (typeof global.setAllSyncing === 'function') global.setAllSyncing('ok');
            if (typeof onUpdate === 'function') onUpdate(_cache);
          }
        } catch (err) {
          console.warn('[DB] SSE JSON parse error:', err);
        }
      };

      _sse.onerror = () => {
        disconnectSSE();
        // При розриві SSE переходимо на резервний фоновий polling
        startPolling(15_000, onUpdate);
      };
    } catch (e) {
      startPolling(30_000, onUpdate);
    }
  }

  /* ════════════════════════════════════════════════════
     7. Публічний інтерфейс
     ════════════════════════════════════════════════════ */
  global.DiyaDB = {
    getUserId: getTelegramUserId,
    getTelegramUserId: getTelegramUserId,
    load: loadUserData,
    saveField,
    saveAllFields,
    startPolling,
    stopPolling,
    connectSSE,
    disconnectSSE,
    getCache: () => _cache,
    clearCache: () => {
      _cache = null;
      _cacheTime = 0;
    },
    configure: (opts) => Object.assign(DB_CONFIG, opts || {}),
  };

  // Конфігурація з глобального об'єкта вікна, якщо задано
  if (typeof window !== 'undefined' && window.__DIYA_CONFIG__) {
    Object.assign(DB_CONFIG, window.__DIYA_CONFIG__);
  }

  console.log('[DB] DiyaDB успішно ініціалізовано. Режим:', DB_CONFIG.mode);

})(window);