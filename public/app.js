/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  app.js — Дія PWA — повний реімплемент              ║
 * ║  • Правильний 3D-flip (iOS spring, без глюків)      ║
 * ║  • QR / Barcode toggle з таймером                   ║
 * ║  • DiyaDB (GitHub Raw + API) + localStorage fallback║
 * ║  • Оптимізовано під кожен пристрій                  ║
 * ╚══════════════════════════════════════════════════════╝
 */

'use strict';

/* ══════════════════════════════════════════════════════
   0. CONSTANTS
   ══════════════════════════════════════════════════════ */
const LS_KEY  = 'diyaLocalState_v2';
const PIN_KEY = 'diya_pin_override';

let _localState = {};
try { _localState = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch {}

let APP_DATA = {};

function mergeData(fromDB) {
  APP_DATA = Object.assign(
    {},
    typeof defaultUserData !== 'undefined' ? defaultUserData : {},
    _localState,
    fromDB || {}
  );
}

/* ══════════════════════════════════════════════════════
   1. DOM DATA BINDING
   ══════════════════════════════════════════════════════ */
function applyDataToDOM(data) {
  data = data || APP_DATA;

  Object.keys(data).forEach(id => {
    if (id === 'mainPhoto' || id === 'sigPhoto' || id.startsWith('doc_')) return;
    document.querySelectorAll('#' + CSS.escape(id)).forEach(el => {
      if (data[id] != null && data[id] !== '') el.textContent = data[id];
    });
  });

  const photo = data.mainPhoto || 'assets/user_photo.jpg';
  document.querySelectorAll('.card-photo, #imgPassport, #imgStudent, #imgRights, #imgZagran')
    .forEach(img => { if (photo) img.src = photo; });

  if (data.sigPhoto) {
    document.querySelectorAll('img[src*="sig"]').forEach(img => img.src = data.sigPhoto);
  }

  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  const dateStr = `${p(now.getDate())}.${p(now.getMonth()+1)}.${now.getFullYear()}`;
  const dtStr   = `${p(now.getHours())}:${p(now.getMinutes())} | ${dateStr}`;
  document.querySelectorAll('#getCurrentDateTime').forEach(el => el.textContent = dtStr);
  document.querySelectorAll('.dataNow').forEach(el => el.textContent = dateStr);
}

/* ══════════════════════════════════════════════════════
   2. CARD FLIP — ЄДИНА ПРАВИЛЬНА РЕАЛІЗАЦІЯ
   ══════════════════════════════════════════════════════ */
// WeakMap зберігає стан та таймер кожної картки
const _cardMeta = new WeakMap();

function _getCardMeta(slider) {
  if (!_cardMeta.has(slider)) {
    _cardMeta.set(slider, { flipped: false, timerId: null, seconds: 179 });
  }
  return _cardMeta.get(slider);
}

/**
 * flipCard — перегортає картку.
 * Викликається при кліку на .slider (але не на кнопки всередині).
 */
function flipCard(slider) {
  const meta = _getCardMeta(slider);

  // Блокуємо повторний клік під час анімації
  if (slider.classList.contains('is-flipping')) return;

  slider.classList.add('is-flipping');
  setTimeout(() => slider.classList.remove('is-flipping'), 560);

  meta.flipped = !meta.flipped;

  if (meta.flipped) {
    slider.classList.add('is-flipped');
    _startQrTimer(slider, meta);
    if (navigator.vibrate) navigator.vibrate(8);
  } else {
    slider.classList.remove('is-flipped');
    _stopQrTimer(meta);
  }
}

/**
 * resetCard — скидаємо картку до лицьової сторони (при свайпі).
 */
function resetCard(slider) {
  const meta = _getCardMeta(slider);
  if (!meta.flipped) return;
  meta.flipped = false;
  slider.classList.remove('is-flipped', 'is-flipping');
  _stopQrTimer(meta);
}

window.flipCard  = flipCard;
window.resetCard = resetCard;

/* ══════════════════════════════════════════════════════
   3. QR TIMER
   ══════════════════════════════════════════════════════ */
function _startQrTimer(slider, meta) {
  _stopQrTimer(meta);
  meta.seconds = 179;

  const timerEl = slider.querySelector('[data-time]');
  if (!timerEl) return;

  function _tick() {
    if (meta.seconds <= 0) {
      // Авто-оновлення коду — скидаємо на 3 хвилини
      meta.seconds = 179;
    }
    const m = Math.floor(meta.seconds / 60);
    const s = String(meta.seconds % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
    meta.seconds--;
  }

  _tick();
  meta.timerId = setInterval(_tick, 1000);
}

function _stopQrTimer(meta) {
  if (meta.timerId) {
    clearInterval(meta.timerId);
    meta.timerId = null;
  }
}

/* ══════════════════════════════════════════════════════
   4. QR / BARCODE TOGGLE
   ══════════════════════════════════════════════════════ */
function _setupQrToggle(container) {
  const slider  = container.closest('.slider');
  if (!slider) return;

  const qrBtn   = container.querySelector('[data-index="1"]');
  const shBtn   = container.querySelector('[data-index="2"]');
  const codeDiv = slider.querySelector('.changeCode');
  const shText  = slider.querySelector('.shText');

  if (!qrBtn || !shBtn || !codeDiv) return;

  function _setMode(mode) {
    const qrDot = qrBtn.querySelector('div');
    const shDot = shBtn.querySelector('div');
    const qrImg = qrBtn.querySelector('img');
    const shImg = shBtn.querySelector('img');

    if (mode === 'qr') {
      codeDiv.className = 'qrcode changeCode';
      if (shText) { shText.style.display = 'none'; shText.classList.remove('visible'); }
      qrDot?.classList.add('active');
      shDot?.classList.remove('active');
      if (qrImg) qrImg.style.filter = '';    // чорна іконка на чорному фоні
      if (shImg) shImg.style.filter = '';
    } else {
      codeDiv.className = 'shcode changeCode';
      if (shText) { shText.style.display = 'flex'; shText.classList.add('visible'); }
      shDot?.classList.add('active');
      qrDot?.classList.remove('active');
      if (shImg) shImg.style.filter = '';
      if (qrImg) qrImg.style.filter = '';
    }
  }

  // Ставимо QR активним за замовчуванням
  _setMode('qr');

  qrBtn.addEventListener('click', e => { e.stopPropagation(); _setMode('qr'); });
  shBtn.addEventListener('click', e => { e.stopPropagation(); _setMode('sh'); });
}

/* ══════════════════════════════════════════════════════
   5. SWIPER — ДОКУМЕНТИ
   ══════════════════════════════════════════════════════ */
let docSwiper  = null;
let newsSwiper = null;

function initSwipers() {
  if (typeof Swiper === 'undefined') return;

  // Запобігаємо повторній ініціалізації
  const docEl = document.querySelector('.documentSlider');
  if (docEl && !docEl.swiper) {
    docSwiper = new Swiper('.documentSlider', {
      slidesPerView: 1.08,
      centeredSlides: true,
      spaceBetween: 14,
      speed: 420,
      grabCursor: true,
      resistanceRatio: 0.75,
      touchRatio: 1.1,
      touchAngle: 45,
      threshold: 8,          // менше 8px — клік, більше — свайп
      longSwipesRatio: 0.25,
      preventClicks: false,
      preventClicksPropagation: false,
      watchSlidesProgress: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: false,
      },
      on: {
        // Скидаємо перегорнуті картки при свайпі
        slideChangeTransitionStart() {
          document.querySelectorAll('.slider.is-flipped').forEach(s => resetCard(s));
        },
        // Паралакс-масштаб для ефекту стеку
        progress(swiper) {
          swiper.slides.forEach(slide => {
            const p    = Math.abs(slide.progress || 0);
            const sc   = 1 - Math.min(p * 0.05, 0.08);
            const op   = 1 - Math.min(p * 0.22, 0.4);
            const ty   = Math.min(p * 8, 14);
            slide.style.transform = `scale(${sc}) translateY(${ty}px)`;
            slide.style.opacity   = op;
          });
        },
        setTransition(swiper, dur) {
          swiper.slides.forEach(s => {
            s.style.transitionDuration = dur + 'ms';
          });
        },
      },
    });
  } else if (docEl?.swiper) {
    docSwiper = docEl.swiper;
  }

  const newsEl = document.querySelector('.sliderNews');
  if (newsEl && !newsEl.swiper) {
    newsSwiper = new Swiper('.sliderNews', {
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 360,
      pagination: { el: '.swiper-pagination2', clickable: true },
    });
  } else if (newsEl?.swiper) {
    newsSwiper = newsEl.swiper;
  }
}

/* ══════════════════════════════════════════════════════
   6. CARD CLICK HANDLER
   ══════════════════════════════════════════════════════ */
function _onCardClick(e) {
  // Ігноруємо кліки на кнопки / перемикачі / dots
  if (e.target.closest(
    '.qrChange, .card-qr-toggle, .copyPng, .moreInfo, .card-dots, ' +
    '.card-copy-btn, button, .action-card-circle, .add-doc-card, ' +
    '.swap-doc-card, .qrChangeInfo, [data-index]'
  )) return;

  flipCard(this);
}

function _bindCardClicks() {
  document.querySelectorAll('.slider').forEach(slider => {
    // Видаляємо старий listener перед додаванням нового
    slider.removeEventListener('click', _onCardClick);
    slider.addEventListener('click', _onCardClick);

    // QR toggle
    slider.querySelectorAll('.qrChange, .card-qr-toggle').forEach(c => _setupQrToggle(c));
  });
}

/* ══════════════════════════════════════════════════════
   7. ACTION SHEETS (bottom sheets)
   ══════════════════════════════════════════════════════ */
let _activeSheet = null;

function _openSheet(sheetEl) {
  if (!sheetEl) return;
  if (_activeSheet && _activeSheet !== sheetEl) _closeSheet(_activeSheet);

  _activeSheet = sheetEl;
  sheetEl.classList.add('active');
  const inner = sheetEl.querySelector(':scope > div');
  if (inner) inner.classList.add('active');

  // Свайп вниз щоб закрити
  _initSheetSwipe(sheetEl);
}

function _closeSheet(sheetEl) {
  if (!sheetEl) return;
  sheetEl.classList.remove('active');
  const inner = sheetEl.querySelector(':scope > div');
  if (inner) inner.classList.remove('active');
  if (_activeSheet === sheetEl) _activeSheet = null;
}

function _initSheetSwipe(sheet) {
  const inner = sheet.querySelector(':scope > div') || sheet;
  let startY = 0;

  function onStart(e) { startY = (e.touches?.[0] ?? e).clientY; }
  function onMove(e) {
    const dy = (e.touches?.[0] ?? e).clientY - startY;
    if (dy > 0) inner.style.transform = `translateY(${dy * 0.6}px)`;
  }
  function onEnd(e) {
    const dy = (e.changedTouches?.[0] ?? e).clientY - startY;
    inner.style.transform = '';
    inner.style.transition = '';
    if (dy > 80) _closeSheet(sheet);
  }

  sheet.addEventListener('touchstart', onStart, { passive: true, once: false });
  sheet.addEventListener('touchmove',  onMove,  { passive: true });
  sheet.addEventListener('touchend',   onEnd,   { passive: true });
}

function _setupActionSheets() {
  // Dots / moreInfo → відкриває sheet
  document.addEventListener('click', e => {
    const trigger = e.target.closest('.moreInfo, .card-dots, .arrowSvg[data-index]');
    if (!trigger) return;
    e.stopPropagation();
    const idx   = trigger.getAttribute('data-index');
    const sheet = idx ? document.querySelector(`.${idx}_block_div`) : null;
    if (sheet) _openSheet(sheet);
  });

  // Кнопки закриття
  document.querySelectorAll('.close_block').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx   = btn.getAttribute('data-index');
      const sheet = idx
        ? document.querySelector(`.${idx}_block_div`)
        : btn.closest('.document_block_div');
      _closeSheet(sheet);
    });
  });

  // Клік поза sheet
  document.addEventListener('click', e => {
    if (_activeSheet && !_activeSheet.contains(e.target)) {
      _closeSheet(_activeSheet);
    }
  });

  // QR toggle всередині sheet (qrChangeInfo)
  document.querySelectorAll('.qrChangeInfo').forEach(c => {
    // Знаходимо відповідний slider через index
    const sheetDiv = c.closest('.document_block_div');
    if (!sheetDiv) return;
    const docId = Array.from(sheetDiv.classList)
      .find(cl => cl.endsWith('_block_div'))
      ?.replace('_block_div', '');
    const slider = docId ? document.querySelector(`.slider.${docId}`) : null;
    if (!slider) return;

    const qBtn = c.querySelector('[data-index="1"]');
    const sBtn = c.querySelector('[data-index="2"]');
    const cd   = slider.querySelector('.changeCode');
    const st   = slider.querySelector('.shText');
    if (!qBtn || !sBtn || !cd) return;

    qBtn.addEventListener('click', e => {
      e.stopPropagation();
      cd.className = 'qrcode changeCode';
      if (st) { st.style.display = 'none'; st.classList.remove('visible'); }
      qBtn.querySelector('div')?.classList.add('active');
      sBtn.querySelector('div')?.classList.remove('active');
    });
    sBtn.addEventListener('click', e => {
      e.stopPropagation();
      cd.className = 'shcode changeCode';
      if (st) { st.style.display = 'flex'; st.classList.add('visible'); }
      sBtn.querySelector('div')?.classList.add('active');
      qBtn.querySelector('div')?.classList.remove('active');
    });
  });
}

/* ══════════════════════════════════════════════════════
   8. MODALS (full-screen bottom sheets)
   ══════════════════════════════════════════════════════ */
function _setupModals() {
  const overlay = document.getElementById('overlay');

  function openModal(modal, fromBlockClass) {
    if (!modal) return;
    modal.classList.add('open');
    if (overlay) { overlay.classList.remove('hidden'); overlay.style.opacity = '1'; }
    if (fromBlockClass) _closeSheet(document.querySelector('.' + fromBlockClass));
    _initModalSwipe(modal);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
  }

  function _initModalSwipe(modal) {
    let startY = 0, dragging = false;
    const handle = modal.querySelector('.handle');
    const scrollArea = modal.querySelector('.modal-content') || modal;

    function onStart(e) {
      startY = (e.touches?.[0] ?? e).clientY; dragging = true;
      modal.style.transition = 'none';
    }
    function onMove(e) {
      if (!dragging || scrollArea.scrollTop > 0) return;
      const dy = (e.touches?.[0] ?? e).clientY - startY;
      if (dy > 0) modal.style.top = `calc(6% + ${dy}px)`;
    }
    function onEnd(e) {
      if (!dragging) return; dragging = false;
      modal.style.transition = 'top .35s cubic-bezier(.2,.9,.3,1)';
      const dy = (e.changedTouches?.[0] ?? e).clientY - startY;
      if (dy > 100) {
        closeModal(modal);
        if (overlay) { overlay.classList.add('hidden'); }
      } else {
        modal.style.top = '6%';
      }
    }

    modal.addEventListener('touchstart', onStart, { passive: true });
    modal.addEventListener('touchmove',  onMove,  { passive: true });
    modal.addEventListener('touchend',   onEnd,   { passive: true });
    handle?.addEventListener('click', () => {
      closeModal(modal);
      if (overlay) overlay.classList.add('hidden');
    });
  }

  // Прив'язки trigger → modal
  const MAP = {
    '#fullInfoPasport': { modal: 'pasport-modal', block: 'pasport_block_div' },
    '#fullInfoZagran':  { modal: 'zagran-modal',  block: 'zagran_block_div'  },
    '#fullInfoStudy':   { modal: 'study-modal',   block: 'study_block_div'   },
    '#fullInfoeDoc':    { modal: 'eDoc-modal',     block: 'eDoc_block_div'    },
    '#fullInfoPrava':   { modal: 'prava-modal',    block: 'prava_block_div'   },
    '#fullInfoZbroya':  { modal: 'zbroya-modal',   block: 'zbroya_block_div'  },
    '#fullInfoDip':     { modal: 'dip-modal',      block: 'dip_block_div'     },
    '#fullInfoPodatki': { modal: 'podatki-modal',  block: 'podatki_block_div' },
  };

  Object.entries(MAP).forEach(([sel, cfg]) => {
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        openModal(document.getElementById(cfg.modal), cfg.block);
      });
    });
  });

  // Делегований клік (для динамічно доданих тригерів)
  document.addEventListener('click', e => {
    const t = e.target.closest('[id^="fullInfo"]');
    if (t) {
      const key = '#' + t.id;
      if (MAP[key]) {
        e.stopPropagation();
        openModal(document.getElementById(MAP[key].modal), MAP[key].block);
      }
    }
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      document.querySelectorAll('.modal.open').forEach(m => closeModal(m));
      overlay.classList.add('hidden');
    });
  }
}

/* ══════════════════════════════════════════════════════
   9. DB — ініціалізація та polling
   ══════════════════════════════════════════════════════ */
async function initFromDB() {
  if (typeof DiyaDB === 'undefined') {
    console.info('[App] DiyaDB не підключено → використовуємо values.js + localStorage');
    mergeData({});
    applyDataToDOM();
    _hideAllSkeletons();
    // Показуємо підказку про налаштування
    _showDbConfigHint();
    return;
  }

  _showAllSkeletons();
  _setSyncAll('syncing');

  try {
    const data = await DiyaDB.load();
    mergeData(data);
    applyDataToDOM();
    _setSyncAll('ok');
    _hideAllSkeletons();

    // Зберігаємо у localStorage
    try { localStorage.setItem(LS_KEY, JSON.stringify(data || {})); } catch {}

    // Підключаємо SSE або polling для live-оновлень
    DiyaDB.connectSSE(fresh => {
      mergeData(fresh);
      applyDataToDOM(fresh);
      _setSyncAll('ok');
      try { localStorage.setItem(LS_KEY, JSON.stringify(fresh)); } catch {}
      showNotification('✓ Дані оновлено ботом', true);
    });

  } catch (err) {
    console.error('[App] DB error:', err);
    mergeData({});
    applyDataToDOM();
    _setSyncAll('error');
    _setOfflineBanner(true);
    _hideAllSkeletons();
  }
}

function _showDbConfigHint() {
  // Показуємо тільки якщо GitHub Raw ще не налаштовано
  if (typeof DiyaDB !== 'undefined') return;
  let hint = document.querySelector('.db-config-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'db-config-hint';
    hint.textContent = '⚙️ Налаштуй db.js — вкажи своє GitHub репо або API';
    document.body.appendChild(hint);
  }
  hint.classList.add('visible');
  setTimeout(() => hint.classList.remove('visible'), 6000);
}

function _showAllSkeletons() {
  document.querySelectorAll('.card-skeleton').forEach(s => s.classList.remove('hidden'));
}
function _hideAllSkeletons() {
  document.querySelectorAll('.card-skeleton').forEach(s => s.classList.add('hidden'));
}
function _setSyncAll(state) {
  document.querySelectorAll('.card-sync-badge').forEach(b => {
    b.classList.remove('syncing', 'error');
    if (state === 'syncing') b.classList.add('syncing');
    if (state === 'error')   b.classList.add('error');
  });
}
function _setOfflineBanner(show) {
  let b = document.getElementById('offline-banner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'offline-banner'; b.className = 'offline-banner';
    b.innerHTML = '<span class="offline-banner-dot"></span><span>Офлайн — дані можуть бути застарілими</span>';
    document.body.prepend(b);
  }
  show ? b.classList.add('visible') : b.classList.remove('visible');
}

window.setSyncState = (id, state) => {
  const b = document.getElementById('sync-' + id);
  if (!b) return;
  b.classList.remove('syncing', 'error');
  if (state === 'syncing') b.classList.add('syncing');
  if (state === 'error')   b.classList.add('error');
};
window.setAllSyncing = _setSyncAll;

/* ══════════════════════════════════════════════════════
   10. PIN + SPLASH
   ══════════════════════════════════════════════════════ */
let _enteredPin = '';
const _correctPin = (() => {
  try {
    const stored = localStorage.getItem(PIN_KEY);
    if (stored) return stored;
  } catch {}
  return typeof entryPin !== 'undefined' ? String(entryPin) : '1234';
})();

function _updatePinDots() {
  document.querySelectorAll('.start-vhod > div').forEach((dot, i) => {
    dot.classList.toggle('active', i < _enteredPin.length);
  });
}

function _shakePin() {
  const block = document.querySelector('.start-block');
  if (!block) return;
  const seq = [[−12,0],[12,70],[−8,140],[8,210],[0,280]];
  seq.forEach(([x,t]) => setTimeout(() => block.style.transform = `translateX(${x}px)`, t));
  if (navigator.vibrate) navigator.vibrate([40,20,40]);
}

function _unlockApp() {
  const startDiv = document.querySelector('.start-div');
  const main = document.querySelector('.main');
  if (startDiv) {
    Object.assign(startDiv.style, { opacity:'0', transform:'scale(.96)', transition:'opacity .3s, transform .3s' });
    setTimeout(() => { startDiv.classList.remove('active'); startDiv.style.cssText = ''; }, 320);
  }
  if (main) {
    main.classList.add('active');
    switchTab(2);
    requestAnimationFrame(() => _triggerCardEntrance());
  }
}

function handlePinDigit(digit) {
  if (digit === 'del') { _enteredPin = _enteredPin.slice(0,-1); _updatePinDots(); return; }
  if (_enteredPin.length >= 4) return;
  _enteredPin += digit;
  _updatePinDots();
  if (_enteredPin.length === 4) {
    if (_enteredPin === _correctPin) { setTimeout(_unlockApp, 180); }
    else { setTimeout(() => { _shakePin(); _enteredPin = ''; _updatePinDots(); }, 260); }
  }
}
window.handlePinDigit = handlePinDigit;

function _triggerCardEntrance() {
  document.querySelectorAll('.documentSlider .slider').forEach((card, i) => {
    card.classList.remove('animate-card-entrance');
    card.style.animationDelay = `${i * 70}ms`;
    void card.offsetWidth; // reflow
    card.classList.add('animate-card-entrance');
  });
}
window.triggerCardEntranceAnimation = _triggerCardEntrance;

function _initSplash() {
  const loadpage = document.querySelector('.loadpage');
  const startDiv = document.querySelector('.start-div');
  setTimeout(() => {
    if (loadpage) {
      loadpage.classList.add('hidden');
      setTimeout(() => {
        loadpage.style.display = 'none';
        if (startDiv) startDiv.classList.add('active');
      }, 550);
    }
  }, 1400);
}

/* ══════════════════════════════════════════════════════
   11. TABS
   ══════════════════════════════════════════════════════ */
function switchTab(index) {
  document.querySelectorAll('.block, .blockStart').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.footer > div[data-index]').forEach(b => b.classList.remove('active'));

  const tabs = [
    document.querySelector('.blockStart'),
    document.querySelector('.block2'),
    document.querySelectorAll('.block1')[0],
    document.querySelectorAll('.block1')[1],
  ];
  tabs[index - 1]?.classList.add('active');
  document.querySelector(`.footer > div[data-index="${index}"]`)?.classList.add('active');

  if (index === 2) {
    docSwiper?.update();
    _triggerCardEntrance();
  }
}
window.switchTab = switchTab;

/* ══════════════════════════════════════════════════════
   12. TOAST
   ══════════════════════════════════════════════════════ */
let _toastTimer = null;
function showNotification(msg, isBot = false) {
  const el = document.getElementById('notification');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('toast-bot-update', !!isBot);
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.remove('show', 'toast-bot-update');
  }, 3000);
}
window.showNotification = showNotification;

/* ══════════════════════════════════════════════════════
   13. PULL-TO-REFRESH
   ══════════════════════════════════════════════════════ */
function _initPullToRefresh() {
  const container = document.querySelector('.block2');
  if (!container) return;

  let ptr = document.getElementById('ptr-indicator');
  if (!ptr) {
    ptr = document.createElement('div');
    ptr.id = 'ptr-indicator'; ptr.className = 'ptr-indicator';
    ptr.innerHTML = '<div class="ptr-spinner"></div>';
    container.querySelector('.documentSlider')?.before(ptr) || container.prepend(ptr);
  }

  let startY = 0, pulling = false, refreshing = false;

  container.addEventListener('touchstart', e => {
    if (container.scrollTop > 0 || refreshing) return;
    startY = e.touches[0].pageY; pulling = true;
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (!pulling || refreshing) return;
    if (e.touches[0].pageY - startY > 40) ptr.classList.add('active');
  }, { passive: true });

  container.addEventListener('touchend', async e => {
    if (!pulling || refreshing) return;
    pulling = false;
    const dy = e.changedTouches[0].pageY - startY;
    if (dy < 55) { ptr.classList.remove('active'); return; }

    refreshing = true;
    _setSyncAll('syncing');

    try {
      if (typeof DiyaDB !== 'undefined') {
        DiyaDB.clearCache();
        const fresh = await DiyaDB.load();
        mergeData(fresh);
        applyDataToDOM(fresh);
        _setSyncAll('ok');
      }
      showNotification('✓ Оновлено');
    } catch { _setSyncAll('error'); }
    finally {
      setTimeout(() => { ptr.classList.remove('active'); refreshing = false; }, 500);
    }
  });
}

/* ══════════════════════════════════════════════════════
   14. COPY TO CLIPBOARD
   ══════════════════════════════════════════════════════ */
function _setupCopy() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.copyPng, .card-copy-btn, .modal-copy-btn');
    if (!btn) return;
    e.stopPropagation();
    const val = btn.getAttribute('data-copy')
      || btn.closest('div')?.querySelector('h3,span')?.textContent?.trim()
      || '';
    if (val && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(val).catch(() => {});
    }
    showNotification('Скопійовано ✓');
  });
}

/* ══════════════════════════════════════════════════════
   15. AI SHEET
   ══════════════════════════════════════════════════════ */
const _AI_KB = {
  'паспорт':   '📋 ID-картка — дійсний документ за законом України.',
  'права':     '🚗 Посвідчення водія перевірено в базах МВС.',
  'загран':    '🌍 Закордонний паспорт підходить для ідентифікації на кордоні.',
  'диплом':    '🎓 Диплом внесено в ЄДЕБО.',
  'студент':   '🎓 Студентський квиток діє до кінця навчання.',
  'зброя':     '🔫 Дозвіл на зброю перевірений ТЦК.',
  'підтримк':  '📞 Служба Дії: 0 800 700 500 (цілодобово).',
  'допомога':  '📞 Служба Дії: 0 800 700 500.',
  'документи': '📋 Електронні документи мають юридичну силу.',
};

function openAiDiia() {
  document.getElementById('aiOverlay')?.classList.add('open');
  document.getElementById('aiSheet')?.classList.add('open');
  setTimeout(() => document.getElementById('aiInput')?.focus(), 320);
}
function closeAiDiia() {
  document.getElementById('aiOverlay')?.classList.remove('open');
  document.getElementById('aiSheet')?.classList.remove('open');
}
function sendAiMsg() {
  const input = document.getElementById('aiInput');
  const area  = document.getElementById('aiChatArea');
  if (!input || !area) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const uDiv = document.createElement('div');
  uDiv.className = 'ai-msg user'; uDiv.textContent = text;
  area.appendChild(uDiv); area.scrollTop = area.scrollHeight;

  setTimeout(() => {
    const lc = text.toLowerCase();
    let answer = '🤖 Для детальної консультації — розділ «Послуги» або 0 800 700 500.';
    for (const [k, v] of Object.entries(_AI_KB)) {
      if (lc.includes(k)) { answer = v; break; }
    }
    const bDiv = document.createElement('div');
    bDiv.className = 'ai-msg bot'; bDiv.textContent = answer;
    area.appendChild(bDiv); area.scrollTop = area.scrollHeight;
  }, 680);
}
function aiQuick(el) {
  const inp = document.getElementById('aiInput');
  if (inp) { inp.value = el.textContent.replace(/^\S+\s/, ''); sendAiMsg(); }
}

/* ══════════════════════════════════════════════════════
   16. TELEGRAM THEME + SAFE AREA
   ══════════════════════════════════════════════════════ */
function _initTelegramTheme() {
  try {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready?.(); tg.expand?.();
    const apply = () => {
      if (tg.colorScheme === 'dark') document.documentElement.setAttribute('data-theme','dark');
      else document.documentElement.removeAttribute('data-theme');
    };
    apply(); tg.onEvent?.('themeChanged', apply);
  } catch {}
}

/* ══════════════════════════════════════════════════════
   17. OFFLINE WATCHER
   ══════════════════════════════════════════════════════ */
function _initOfflineWatcher() {
  window.addEventListener('online',  () => _setOfflineBanner(false));
  window.addEventListener('offline', () => _setOfflineBanner(true));
  if (!navigator.onLine) _setOfflineBanner(true);
}

/* ══════════════════════════════════════════════════════
   18. ADMIN PANEL
   ══════════════════════════════════════════════════════ */
function _setupAdminPanel() {
  const panel     = document.getElementById('admin-panel');
  const container = document.getElementById('admin-inputs-container');
  const saveBtn   = document.getElementById('admin-save-btn');
  const closeBtn  = document.getElementById('admin-close-btn');
  if (!panel || !container) return;

  const FIELDS = [
    { id:'textName',        label:"Ім'я (привіт)" },
    { id:'name',            label:'ПІБ (укр)' },
    { id:'nameEn',          label:'ПІБ (англ)' },
    { id:'birthDate',       label:'Дата народження' },
    { id:'rnokpp',          label:'РНОКПП' },
    { id:'nomerPasport',    label:'Номер паспорта' },
    { id:'sex',             label:'Стать' },
    { id:'dateGive',        label:'Видано (паспорт)' },
    { id:'dateOut',         label:'Дійсний до (паспорт)' },
    { id:'organ',           label:'Орган' },
    { id:'uznr',            label:'УНЗР' },
    { id:'placeBirth',      label:'Місце народження' },
    { id:'legalAdress',     label:'Адреса' },
    { id:'zagran_number',   label:'№ закордонного' },
    { id:'dateGiveZ',       label:'Видано (закордонний)' },
    { id:'dateOutZ',        label:'Дійсний до (закордонний)' },
    { id:'pravaNnumber',    label:'№ водійського' },
    { id:'rightsCategories',label:'Категорії' },
    { id:'dateGivePrava',   label:'Видано (права)' },
    { id:'srokPrav',        label:'Дійсні до (права)' },
    { id:'nomerStudy',      label:'№ студентського' },
    { id:'university',      label:'ВНЗ' },
    { id:'zbroyaNumber',    label:'№ дозволу зброя' },
    { id:'zbroyaType',      label:'Тип зброї' },
    { id:'stepen_dip',      label:'Ступінь диплома' },
    { id:'number_dip',      label:'№ диплома' },
    { id:'special_dip',     label:'Спеціальність' },
    { id:'dayout_dip',      label:'Видано (диплом)' },
  ];

  container.innerHTML = '';
  FIELDS.forEach(f => {
    const g = document.createElement('div');
    g.className = 'admin-form-group';
    g.innerHTML = `<label>${f.label}</label>
      <input type="text" data-field="${f.id}"
             value="${String(APP_DATA[f.id] || '').replace(/"/g,'&quot;')}"
             autocomplete="off">`;
    container.appendChild(g);
  });

  saveBtn?.addEventListener('click', async () => {
    container.querySelectorAll('input[data-field]').forEach(inp => {
      const k = inp.dataset.field;
      APP_DATA[k] = inp.value;
      _localState[k] = inp.value;
    });
    try { localStorage.setItem(LS_KEY, JSON.stringify(_localState)); } catch {}
    applyDataToDOM();

    if (typeof DiyaDB !== 'undefined') {
      _setSyncAll('syncing');
      for (const [k,v] of Object.entries(_localState)) {
        await DiyaDB.saveField(k, v).catch(() => {});
      }
      _setSyncAll('ok');
    }
    showNotification('Збережено ✓');
    panel.classList.remove('open');
    document.getElementById('admin-overlay')?.classList.remove('open');
  });

  const _close = () => {
    panel.classList.remove('open');
    document.getElementById('admin-overlay')?.classList.remove('open');
  };
  closeBtn?.addEventListener('click', _close);
  document.getElementById('admin-overlay')?.addEventListener('click', _close);

  // Ctrl+Shift+X або 3× клік на лого
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyX') { e.preventDefault(); panel.classList.toggle('open'); }
  });
  let _clicks = 0, _ct = null;
  document.querySelector('.logos-container')?.addEventListener('click', () => {
    clearTimeout(_ct); if (++_clicks >= 3) { panel.classList.toggle('open'); _clicks = 0; }
    _ct = setTimeout(() => _clicks = 0, 600);
  });

  // Фото
  document.getElementById('admin-main-photo')?.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      APP_DATA.mainPhoto = ev.target.result;
      _localState.mainPhoto = ev.target.result;
      document.querySelectorAll('.card-photo,#imgPassport,#imgStudent,#imgRights,#imgZagran')
        .forEach(img => img.src = ev.target.result);
    };
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════════════════════════════════════
   19. MAIN INIT
   ══════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Дані
  mergeData({});
  applyDataToDOM();

  // 2. Сплеш
  _initSplash();

  // 3. PIN
  document.querySelectorAll('.pin-keyboard > button, .start-block > button').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.digit;
      if (d !== undefined) handlePinDigit(d);
    });
  });

  document.querySelectorAll('.biometric-btn, #btn-biometrics').forEach(el => {
    el.addEventListener('click', () => {
      const bioPref = APP_DATA.biometricsEnabled;
      if (bioPref === false || bioPref === 'false') {
        showNotification('Біометрію вимкнено у налаштуваннях');
        return;
      }
      showNotification('Біометрична автентифікація ✓');
      setTimeout(_unlockApp, 250);
    });
  });

  document.querySelector('.forgotPassword')?.addEventListener('click', () => {
    showNotification('Код: ' + _correctPin);
    _enteredPin = _correctPin; _updatePinDots();
    setTimeout(_unlockApp, 300);
  });

  // 4. Tabs
  document.querySelectorAll('.footer > div[data-index]').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.dataset.index, 10);
      if (!isNaN(idx)) switchTab(idx);
    });
  });

  // 5. Cards
  _bindCardClicks();

  // 6. Sheets + Modals
  _setupActionSheets();
  _setupModals();

  // 7. Copy
  _setupCopy();

  // 8. Swipers
  initSwipers();

  // 9. AI
  document.getElementById('aiOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('aiOverlay')) closeAiDiia();
  });
  document.getElementById('aiInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMsg(); }
  });

  // 10. Quick actions
  document.querySelectorAll('.quick-action').forEach(btn => {
    btn.addEventListener('click', () => showNotification('Сервіс активовано ✓'));
  });

  // 11. Admin
  _setupAdminPanel();

  // 12. Telegram theme
  _initTelegramTheme();

  // 13. Offline
  _initOfflineWatcher();

  // 14. Pull-to-refresh
  _initPullToRefresh();

  // 15. Live clock
  setInterval(applyDataToDOM, 30_000);

  // 16. DB
  await initFromDB();
});

/* ── Глобальні exports ─────────────────────────── */
window.openAiDiia   = openAiDiia;
window.closeAiDiia  = closeAiDiia;
window.sendAiMsg    = sendAiMsg;
window.aiQuick      = aiQuick;
