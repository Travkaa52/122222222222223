/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  db.js — синхронізація ПВА з БД через Telegram бота ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Архітектура:                                        ║
 * ║  Telegram Bot (Python/Node) <-> GitHub Actions       ║
 * ║  <- JSON файл у репо по userId ->                    ║
 * ║  ПВА при старті: GET /api/user?uid={tgId}            ║
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
  // 🔧  НАЛАШТУЙ ЦЕ ПІД СВІЙ РЕПОЗИТОРІЙ / API
  // ────────────────────────────────────────────────────
  const DB_CONFIG = {
    // Варіант A: raw GitHub JSON (GitHub Actions генерує файл)
    // Бот: пише users/{userId}.json у репо через GitHub API
    // ПВА: читає його напряму
    mode: 'github_raw',   // 'github_raw' | 'api'

    // Для mode = 'github_raw'
    githubRaw: 'https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/users',

    // Для mode = 'api' (свій сервер / Cloudflare Workers / Vercel)
    apiBase: 'https://your-api.vercel.app/api',

    // Скільки тримати кеш (мс)
    cacheTtlMs: 60_000,

    // Поле в Telegram WebApp InitData де uid
    // Якщо запускається поза Telegram — fallback
    fallbackUserId: 'demo_user',
  };
  // ────────────────────────────────────────────────────

  /* ════════════════════════════════════════════════════
     1. Отримання userId з Telegram WebApp або URL param
     ════════════════════════════════════════════════════ */
  function getTelegramUserId() {
    try {
      const tg = global.Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user?.id) {
        return String(tg.initDataUnsafe.user.id);
      }
    } catch (e) {}

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

    // Перевіряємо кеш
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
      console.warn('[DB] Не вдалося завантажити дані:', e);
    }

    if (data) {
      _cache = data;
      _cacheTime = Date.now();
      // Зберігаємо локально як fallback
      try { localStorage.setItem('diya_db_cache_' + _uid, JSON.stringify(data)); } catch (e) {}
    } else {
      // Використовуємо локальний кеш якщо сервер недоступний
      try {
        const local = localStorage.getItem('diya_db_cache_' + _uid);
        if (local) _cache = JSON.parse(local);
      } catch (e) {}
    }

    return _cache;
  }

  /* ════════════════════════════════════════════════════
     3. Збереження поля через API (якщо потрібно з ПВА)
        Зазвичай зміни йдуть через бота, але залишаємо
        можливість прямого запису
     ════════════════════════════════════════════════════ */
  async function saveField(field, value) {
    _uid = _uid || getTelegramUserId();

    // Завжди зберігаємо в локальний кеш DiyaDB
    if (!_cache) _cache = {};
    _cache[field] = value;
    try {
      localStorage.setItem('diya_db_cache_' + _uid, JSON.stringify(_cache));
    } catch (e) {}

    if (DB_CONFIG.mode !== 'api') {
      // github_raw — локально стан збережено
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
     4. Polling — перевіряємо зміни кожні N секунд
        (бот змінив дані — ПВА оновиться без перезавантаження)
     ════════════════════════════════════════════════════ */
  let _pollingInterval = null;

  function startPolling(intervalMs = 30_000, onUpdate) {
    if (_pollingInterval) clearInterval(_pollingInterval);
    _pollingInterval = setInterval(async () => {
      const prevJson = JSON.stringify(_cache);
      _cacheTime = 0; // примусово скидаємо кеш для свіжого запиту
      try {
        if (typeof global.setAllSyncing === 'function') global.setAllSyncing('syncing');
        const fresh = await loadUserData();
        if (typeof global.setAllSyncing === 'function') global.setAllSyncing('ok');
        if (fresh && JSON.stringify(fresh) !== prevJson) {
          console.log('[DB] Дані оновлено з сервера/бота');
          if (typeof onUpdate === 'function') onUpdate(fresh);
        }
      } catch (err) {
        if (typeof global.setAllSyncing === 'function') global.setAllSyncing('error');
      }
    }, intervalMs);
  }

  function stopPolling() {
    if (_pollingInterval) { clearInterval(_pollingInterval); _pollingInterval = null; }
  }

  /* ════════════════════════════════════════════════════
     5. WebSocket / SSE (опціонально, якщо API підтримує)
        Бот надсилає -> сервер пушить -> ПВА оновлює
     ════════════════════════════════════════════════════ */
  let _sse = null;

  function connectSSE(onUpdate) {
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
        } catch (err) {}
      };
      _sse.onerror = () => {
        _sse?.close();
        // Якщо SSE відвалилось — fallback на polling
        startPolling(15_000, onUpdate);
      };
    } catch (e) {
      startPolling(30_000, onUpdate);
    }
  }

  async function saveAllFields(fieldsObj) {
    const uid = getTelegramUserId();
    if (DB_CONFIG.mode !== 'api') {
      console.warn('[DB] saveAllFields requires mode:"api". Use bot to update github_raw.');
      return false;
    }
    try {
      const res = await fetch(`${DB_CONFIG.apiBase}/user/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, fields: fieldsObj }),
      });
      if (res.ok) {
        if (_cache) Object.assign(_cache, fieldsObj);
        return true;
      }
    } catch (e) {
      console.warn('[DB] saveAllFields error:', e);
    }
    return false;
  }

  /* ════════════════════════════════════════════════════
     6. Публічне API модуля
     ════════════════════════════════════════════════════ */
  global.DiyaDB = {
    getUserId: getTelegramUserId,
    load: loadUserData,
    saveField,
    saveAllFields,
    startPolling,
    stopPolling,
    connectSSE,
    getCache: () => _cache,
    clearCache: () => { _cache = null; _cacheTime = 0; },
    configure: (opts) => Object.assign(DB_CONFIG, opts),
  };

  if (typeof window !== 'undefined' && window.__DIYA_CONFIG__) {
    Object.assign(DB_CONFIG, window.__DIYA_CONFIG__);
  }

  console.log('[DB] DiyaDB ready. mode:', DB_CONFIG.mode);

})(window);

