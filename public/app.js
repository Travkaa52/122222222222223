/**
 * ╔═════════════════════════════════════════════════════════════╗
 * ║   app.js — Дія PWA v2  (Оновлено під оригінальний дизайн)   ║
 * ║   • Автентична верстка карток (єДокумент, Податки тощо)     ║
 * ║   • Дані з БД (через DiyaDB) + localStorage як fallback     ║
 * ║   • Автооновлення при зміні через бота                      ║
 * ╚═════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════
// 1. ДАНІ — злиття з БД → localStorage → defaultUserData
// ═══════════════════════════════════════════════════════════════
const LS_KEY = 'diyaLocalState_v2';
let _localState = {};
try {
  _localState = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  if (_localState.name && _localState.name.includes('КОЦЮБА')) {
    delete _localState.name;
    delete _localState.rnokpp;
    delete _localState.birthDate;
    delete _localState.textName;
    delete _localState.nameEn;
    localStorage.setItem(LS_KEY, JSON.stringify(_localState));
  }
} catch (e) {}

// Єдине джерело правди для поточної сесії
let APP_DATA = {};

function mergeData(fromDB) {
  APP_DATA = Object.assign(
    {},
    typeof defaultUserData !== 'undefined' ? defaultUserData : {},
    _localState,
    fromDB || {}
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. ЗАСТОСУВАННЯ ДАНИХ ДО DOM
// ═══════════════════════════════════════════════════════════════
function applyDataToDOM(data) {
  data = data || APP_DATA;

  // Текстові поля
  Object.keys(data).forEach(id => {
    if (id.startsWith('doc_') || id === 'mainPhoto' || id === 'sigPhoto') return;
    document.querySelectorAll('#' + id).forEach(el => {
      if (data[id] !== undefined && data[id] !== '') el.textContent = data[id];
    });
  });

  // Фото — card-photo + старі селектори
  const photoUrl = data.mainPhoto || 'assets/user_photo.jpg';
  document.querySelectorAll('.card-photo, #imgPassport, #imgStudent, #imgRights, #imgZagran').forEach(img => {
    img.src = photoUrl;
  });

  // Підпис
  if (data.sigPhoto) {
    document.querySelectorAll('img[src*="sig.png"]').forEach(img => img.src = data.sigPhoto);
  }

  // Дата/час
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateFormatted = `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()}`;
  const dateTimeFormatted = `${pad(now.getHours())}:${pad(now.getMinutes())} | ${dateFormatted}`;
  document.querySelectorAll('#getCurrentDateTime').forEach(el => el.textContent = dateTimeFormatted);
  document.querySelectorAll('.dataNow').forEach(el => el.textContent = dateFormatted);

  // Оновлюємо картки
  _refreshAllCards(data);
}

// ═══════════════════════════════════════════════════════════════
// 3. БУДОВА / ОНОВЛЕННЯ КАРТОК
// ═══════════════════════════════════════════════════════════════

const CARD_CONFIGS = {
  eDoc: {
    label: 'єДокумент',
    hasPhoto: true,
    fields: [
      { label: 'Дані народження', key: 'birthDate' },
      { label: 'РНОКПП',         key: 'rnokpp' },
    ],
    marquee: '...за рік військового стану. Ой у лузі червона калина г...',
    nameKey: 'name',
    dotsIndex: 'eDoc',
  },
  podatki: {
    label: 'Картка платника<br>податків',
    chip: 'РНОКПП',
    hasPhoto: false,
    fields: [
      { label: 'Дата народження', key: 'birthDate' },
      { label: 'РНОКПП',         key: 'rnokpp' },
    ],
    verifyStrip: '15.09.2026 • Перевірено Державною податковою',
    nameKey: 'name',
    dotsIndex: 'podatki',
  },
  pasport: {
    label: 'Паспорт громадянина<br>України',
    hasPhoto: true,
    fields: [
      { label: 'Дата народження', key: 'birthDate' },
      { label: 'Стать',           key: 'sex' },
      { label: '№ паспорта',      key: 'nomerPasport' },
      { label: 'Дійсний до',      key: 'dateOut' },
    ],
    nameKey: 'name',
    dotsIndex: 'pasport',
  },
  zagran: {
    label: 'Закордонний паспорт',
    hasPhoto: true,
    fields: [
      { label: 'Дата народження', key: 'birthDate' },
      { label: 'Стать',           key: 'sex' },
      { label: '№ закордонного',  key: 'zagran_number' },
      { label: 'Дійсний до',      key: 'dateOut' },
    ],
    nameKey: 'nameEn',
    dotsIndex: 'zagran',
  },
  dip: {
    label: 'Диплом бакалавра',
    hasPhoto: true,
    fields: [
      { label: 'Спеціальність',   key: 'special_dip' },
      { label: '№ диплома',       key: 'number_dip' },
      { label: 'Дата видачі',     key: 'dayout_dip' },
    ],
    nameKey: 'name',
    dotsIndex: 'dip',
  },
  study: {
    label: 'Студентський квиток',
    hasPhoto: true,
    fields: [
      { label: 'Форма навчання',  key: 'formaStudy' },
      { label: '№ студентського', key: 'nomerStudy' },
      { label: 'Дійсний до',      key: 'diusnuyDoStudy' },
    ],
    nameKey: 'name',
    dotsIndex: 'study',
  },
  prava: {
    label: 'Посвідчення водія',
    hasPhoto: true,
    fields: [
      { label: 'Категорії',       key: 'rightsCategories' },
      { label: '№ посвідчення',   key: 'pravaNnumber' },
      { label: 'Дійсне до',       key: 'srokPrav' },
    ],
    nameKey: 'name',
    dotsIndex: 'prava',
  },
  zbroya: {
    label: 'Дозвіл на зброю',
    hasPhoto: false,
    fields: [
      { label: 'Вид зброї',       key: 'zbroyaType' },
      { label: '№ дозволу',       key: 'zbroyaNumber' },
      { label: 'Дата видачі',     key: 'dateGivePrava' },
    ],
    nameKey: 'name',
    dotsIndex: 'zbroya',
  },
};

function _buildCardSkeletonHTML(cfg) {
  const photoSk = cfg.hasPhoto ? `<div class="skeleton-box sk-photo"></div>` : '';
  const fieldsSk = cfg.fields.map(() => `
    <div class="skeleton-field">
      <div class="skeleton-box sk-field-label"></div>
      <div class="skeleton-box sk-field-value"></div>
    </div>`).join('');
  const marqueeSk = cfg.marquee ? `<div class="skeleton-box sk-marquee"></div>` : '';

  return `
    <div class="card-skeleton" id="skeleton-${cfg.dotsIndex}">
      <div class="skeleton-header">
        <div class="skeleton-box sk-label"></div>
        <div class="skeleton-box sk-chip"></div>
      </div>
      <div class="skeleton-body">
        ${photoSk}
        <div class="skeleton-fields">${fieldsSk}</div>
      </div>
      ${marqueeSk}
      <div class="skeleton-footer">
        <div class="skeleton-box sk-name"></div>
        <div class="skeleton-box sk-dots"></div>
      </div>
    </div>`;
}

// Допоміжна функція для рендерингу ПІБ у 3 рядки
function _renderFio3Lines(nameStr, id) {
  const parts = (nameStr || '').trim().split(/\s+/);
  const l1 = parts[0] || 'КАСЬЯН';
  const l2 = parts[1] || 'ДМИТРО';
  const l3 = parts.slice(2).join(' ') || (parts.length > 2 ? parts[2] : 'ВАЛЕРІЙОВИЧ');
  return `
    <div class="card-fio-3lines" id="${id}">
      <div>${l1}</div>
      <div>${l2}</div>
      <div>${l3}</div>
    </div>`;
}

// Генерація фронту картки з урахуванням оригінального дизайну Дії
function _buildCardFrontHTML(cfg, data) {
  const skeleton = _buildCardSkeletonHTML(cfg);
  const nameVal = data[cfg.nameKey] || '—';

  // 1. Картка №1: «єДокумент» (Скріншот ...401.jpg)
  if (cfg.dotsIndex === 'eDoc') {
    const birthVal = data['birthDate'] || '11.06.2009';
    const rnokppVal = data['rnokpp'] || '3997406358';
    const photoUrl = data.mainPhoto || 'assets/user_photo.jpg';
    return `
      ${skeleton}
      <div class="card-sync-badge" id="sync-${cfg.dotsIndex}" title="Синхронізовано"></div>
      <div class="card-header">
        <h1 class="card-title-bold">єДокумент</h1>
      </div>
      <div class="card-body">
        <div class="card-photo-box">
          <img class="card-photo" src="${photoUrl}" alt="Фото">
        </div>
        <div class="card-fields">
          <div class="card-field">
            <span class="card-field-label">Дані народження:</span>
            <span id="birthDate" class="card-field-value">${birthVal}</span>
          </div>
          <div class="card-field">
            <span class="card-field-label">РНОКПП:</span>
            <span id="rnokpp" class="card-field-value">${rnokppVal}</span>
          </div>
        </div>
      </div>
      <div class="card-marquee-strip">
        <div class="card-marquee-inner">
          <span>...за рік військового стану. Ой у лузі червона калина г...&nbsp;&nbsp;&nbsp;...за рік військового стану. Ой у лузі червона калина г...</span>
        </div>
      </div>
      <div class="card-footer">
        ${_renderFio3Lines(nameVal, 'name-eDoc')}
        <div class="card-dots moreInfo" data-index="eDoc" title="Дії">
          <div class="card-dot-circle"></div>
          <div class="card-dot-circle"></div>
          <div class="card-dot-circle"></div>
        </div>
      </div>`;
  }

  // 2. Картка №2: «Картка платника податків» (Скріншот ...400.jpg)
  if (cfg.dotsIndex === 'podatki') {
    const rnokppVal = data['rnokpp'] || '3997406358';
    const birthVal = data['birthDate'] || '11.06.2009';
    return `
      ${skeleton}
      <div class="card-sync-badge" id="sync-${cfg.dotsIndex}" title="Синхронізовано"></div>
      <div class="card-header">
        <div class="card-header-podatki">
          <h1 class="card-title-two-lines">${cfg.label}</h1>
          <div class="card-chip-sub">${cfg.chip}</div>
        </div>
      </div>
      <div class="card-podatki-content">
        <div class="card-podatki-fio" id="name-${cfg.dotsIndex}">${nameVal}</div>
        <div class="card-podatki-birth">
          <span class="card-field-label">Дата народження:</span>
          <span id="birthDate" class="card-field-value">${birthVal}</span>
        </div>
      </div>
      <div class="card-verify-strip">
        <span class="card-verify-text">${cfg.verifyStrip || '15.09.2026 • Перевірено Державною податковою'}</span>
      </div>
      <div class="card-footer">
        <div class="card-rnokpp-group">
          <span class="card-big-rnokpp" id="rnokpp">${rnokppVal}</span>
          <button class="card-copy-btn copyPng" title="Скопіювати РНОКПП" data-copy="${rnokppVal}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        <div class="card-dots moreInfo" data-index="${cfg.dotsIndex}" title="Дії">
          <div class="card-dot-circle"></div>
          <div class="card-dot-circle"></div>
          <div class="card-dot-circle"></div>
        </div>
      </div>`;
  }

  // 3. Стандартний дизайн з фото для інших карток в оригінальному стилі Дії
  const photo = cfg.hasPhoto
    ? `<div class="card-photo-box"><img class="card-photo" src="${data.mainPhoto || 'assets/user_photo.jpg'}" alt="Фото"></div>`
    : '';

  const fields = cfg.fields.map(f => {
    const val = data[f.key] || '—';
    return `
      <div class="card-field">
        <span class="card-field-label">${f.label}:</span>
        <span id="${f.key}" class="card-field-value">${val}</span>
      </div>`;
  }).join('');

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const verifyText = cfg.verifyStrip || `• Документ оновлено о ${timeStr} • Перевірено`;

  return `
    ${skeleton}
    <div class="card-sync-badge" id="sync-${cfg.dotsIndex}" title="Синхронізовано"></div>
    <div class="card-header">
      <h1 class="card-title-bold">${cfg.label}</h1>
      ${cfg.chip ? `<div class="card-chip"><span>${cfg.chip}</span></div>` : ''}
    </div>
    <div class="card-body">
      ${photo}
      <div class="card-fields">${fields}</div>
    </div>
    <div class="card-verify-strip">
      <span class="card-verify-text">${verifyText}</span>
    </div>
    <div class="card-footer">
      ${_renderFio3Lines(nameVal, `name-${cfg.dotsIndex}`)}
      <div class="card-dots moreInfo" data-index="${cfg.dotsIndex}" title="Дії">
        <div class="card-dot-circle"></div>
        <div class="card-dot-circle"></div>
        <div class="card-dot-circle"></div>
      </div>
    </div>`;
}

function _buildCardBackHTML() {
  return `
    <div class="card-back-inner">
      <div class="card-timer">
        Код діятиме ще
        <span class="card-timer-val" data-time="2:59">2:59</span>
        хв
      </div>
      <div class="card-qr-area">
        <div class="qrcode changeCode"></div>
        <div class="shText" style="display:none">
          <span>1977</span><span>3411</span><span>48475</span>
        </div>
      </div>
      <div class="card-qr-toggle qrChange">
        <div data-index="1">
          <div class="active"><img src="assets/qr-code.png" alt=""></div>
          <span>QR-код</span>
        </div>
        <div data-index="2">
          <div><img src="assets/free-icon-barcode-7797192.png" alt=""></div>
          <span>Штрихкод</span>
        </div>
      </div>
    </div>`;
}

function buildAllCards() {
  Object.keys(CARD_CONFIGS).forEach(docId => {
    const slider = document.querySelector(`.slider.${docId}`);
    if (!slider) return;
    const cfg = CARD_CONFIGS[docId];

    let front = slider.querySelector('.content.front');
    let back  = slider.querySelector('.content.back');

    if (!front) { front = document.createElement('div'); front.className = 'content front'; slider.appendChild(front); }
    if (!back)  { back  = document.createElement('div'); back.className  = 'content back';  slider.appendChild(back);  }

    if (!front.children || front.children.length === 0) {
      front.innerHTML = _buildCardFrontHTML(cfg, APP_DATA);
    }
    if (!back.children || back.children.length === 0) {
      back.innerHTML  = _buildCardBackHTML();
    }
  });

  _rebindCardHandlers();
}

function _refreshAllCards(data) {
  Object.keys(CARD_CONFIGS).forEach(docId => {
    const slider = document.querySelector(`.slider.${docId}`);
    if (!slider) return;
    const cfg = CARD_CONFIGS[docId];

    cfg.fields.forEach(f => {
      slider.querySelectorAll(`#${f.key}, [data-db-field="${f.key}"]`).forEach(el => {
        if (data[f.key]) el.textContent = data[f.key];
      });
    });

    const nameEl = slider.querySelector(`#${cfg.nameKey}-${docId}, #name-${docId}`);
    if (nameEl && data[cfg.nameKey]) {
      const parts = data[cfg.nameKey].trim().split(/\s+/);
      const divs = nameEl.querySelectorAll('div');
      if (divs.length === 3) {
        divs[0].textContent = parts[0] || '';
        divs[1].textContent = parts[1] || '';
        divs[2].textContent = parts.slice(2).join(' ') || '';
      } else {
        nameEl.textContent = data[cfg.nameKey];
      }
    }

    if (cfg.hasPhoto && data.mainPhoto) {
      slider.querySelectorAll('.card-photo').forEach(img => img.src = data.mainPhoto);
    }
  });
}

function _rebindCardHandlers() {
  document.querySelectorAll('.slider').forEach(slider => {
    slider.removeEventListener('click', _cardClickHandler);
    slider.addEventListener('click', _cardClickHandler);
  });

  document.querySelectorAll('.moreInfo, .card-dots').forEach(btn => {
    btn.removeEventListener('click', _dotsClickHandler);
    btn.addEventListener('click', _dotsClickHandler);
  });

  setupCardActionSheets();

  document.querySelectorAll('.copyPng, .card-copy-btn').forEach(btn => {
    btn.removeEventListener('click', _copyHandler);
    btn.addEventListener('click', _copyHandler);
  });
}

function _cardClickHandler(e) {
  if (this.classList.contains('add-swap-card-container')) return;
  if (e.target.closest('.card-dots, .qrChange, .copyPng, .moreInfo, .card-copy-btn, button, .action-card-circle, .add-doc-card, .swap-doc-card')) return;
  flipCard(this);
}

function _dotsClickHandler(e) {
  e.stopPropagation();
  const index = this.getAttribute('data-index');
  const sheet = document.querySelector(`.${index}_block_div`);
  if (sheet) sheet.classList.add('active');
}

function _copyHandler(e) {
  e.stopPropagation();
  const rnokppText = this.getAttribute('data-copy') || document.getElementById('rnokpp')?.textContent || APP_DATA.rnokpp || '3997406358';
  if (rnokppText && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(rnokppText).catch(() => {});
  }
  showNotification('Номер скопійовано в буфер обміну ✓');
}

// ═══════════════════════════════════════════════════════════════
// 4. SKELEtons & SYNC
// ═══════════════════════════════════════════════════════════════
function hideCardSkeleton(docId) {
  const sk = document.getElementById('skeleton-' + docId);
  if (sk) sk.classList.add('hidden');
}

function showCardSkeleton(docId) {
  const sk = document.getElementById('skeleton-' + docId);
  if (sk) sk.classList.remove('hidden');
}

function hideAllSkeletons() {
  document.querySelectorAll('.card-skeleton').forEach(sk => sk.classList.add('hidden'));
}

function showAllSkeletons() {
  document.querySelectorAll('.card-skeleton').forEach(sk => sk.classList.remove('hidden'));
}

function setSyncState(docId, state) {
  const badge = document.getElementById('sync-' + docId);
  if (!badge) return;
  badge.classList.remove('syncing', 'error');
  if (state === 'syncing') badge.classList.add('syncing');
  if (state === 'error')   badge.classList.add('error');
}

function setAllSyncing(state) {
  Object.keys(CARD_CONFIGS).forEach(id => setSyncState(id, state));
}

window.setSyncState = setSyncState;
window.setAllSyncing = setAllSyncing;

function setOfflineBanner(show) {
  let banner = document.getElementById('offline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.className = 'offline-banner';
    banner.innerHTML = '<span class="offline-banner-dot"></span><span>Офлайн режим — дані можуть бути застарілими</span>';
    document.body.prepend(banner);
  }
  if (show) banner.classList.add('visible');
  else banner.classList.remove('visible');
}

function initOfflineWatcher() {
  window.addEventListener('online', () => setOfflineBanner(false));
  window.addEventListener('offline', () => setOfflineBanner(true));
  if (!navigator.onLine) setOfflineBanner(true);
}

// ═══════════════════════════════════════════════════════════════
// 5. ІНІЦІАЛІЗАЦІЯ З БД
// ═══════════════════════════════════════════════════════════════
async function initFromDB() {
  if (typeof DiyaDB === 'undefined') {
    console.warn('[App] DiyaDB не підключено. Використовуємо localStorage.');
    mergeData({});
    buildAllCards();
    applyDataToDOM();
    setTimeout(hideAllSkeletons, 300);
    return;
  }

  showAllSkeletons();
  setAllSyncing('syncing');

  try {
    const dbData = await DiyaDB.load();
    mergeData(dbData);
    buildAllCards();
    applyDataToDOM();
    setAllSyncing('ok');
    if (navigator.onLine) setOfflineBanner(false);
    setTimeout(hideAllSkeletons, 350);

    try { localStorage.setItem(LS_KEY, JSON.stringify(dbData || {})); } catch (e) {}

    const onUpdate = (fresh) => {
      mergeData(fresh);
      buildAllCards();
      applyDataToDOM(fresh);
      setAllSyncing('ok');
      hideAllSkeletons();
      showNotification('✓ Дані оновлено ботом', true);
    };

    DiyaDB.connectSSE(onUpdate);

  } catch (err) {
    console.error('[App] DB init error:', err);
    mergeData({});
    buildAllCards();
    applyDataToDOM();
    setAllSyncing('error');
    setOfflineBanner(true);
    setTimeout(hideAllSkeletons, 300);
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. СПЛЕШ + ПІН
// ═══════════════════════════════════════════════════════════════
function initSplash() {
  const loadpage = document.querySelector('.loadpage');
  const startDiv = document.querySelector('.start-div');
  setTimeout(() => {
    if (loadpage) {
      loadpage.classList.add('hidden');
      setTimeout(() => {
        loadpage.style.display = 'none';
        if (startDiv) startDiv.classList.add('active');
      }, 600);
    }
  }, 1500);
}

let enteredPin = '';
const correctPin = typeof entryPin !== 'undefined' ? entryPin : '1234';

function updatePinDots() {
  document.querySelectorAll('.start-vhod > div').forEach((dot, idx) => {
    dot.classList.toggle('active', idx < enteredPin.length);
  });
}

function triggerCardEntranceAnimation() {
  const cards = document.querySelectorAll('.documentSlider .slider');
  cards.forEach((card, idx) => {
    card.classList.remove('animate-card-entrance');
    card.style.animationDelay = `${idx * 80}ms`;
    void card.offsetWidth;
    card.classList.add('animate-card-entrance');
  });
}

window.triggerCardEntranceAnimation = triggerCardEntranceAnimation;

function unlockApp() {
  const startDiv = document.querySelector('.start-div');
  const main = document.querySelector('.main');
  if (startDiv) {
    startDiv.style.opacity = '0';
    startDiv.style.transform = 'scale(0.96)';
    setTimeout(() => { startDiv.classList.remove('active'); startDiv.style.display = 'none'; }, 350);
  }
  if (main) {
    main.classList.add('active');
    switchTab(2);
    setTimeout(triggerCardEntranceAnimation, 120);
  }
}

function shakePin() {
  const block = document.querySelector('.start-block');
  if (!block) return;
  [[-12,0],[12,80],[-8,160],[8,240],[0,320]].forEach(([x,t]) =>
    setTimeout(() => block.style.transform = `translateX(${x}px)`, t)
  );
  if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
}

function handlePinDigit(digit) {
  if (digit === 'del') { enteredPin = enteredPin.slice(0, -1); updatePinDots(); return; }
  if (enteredPin.length >= 4) return;
  enteredPin += digit;
  updatePinDots();
  if (enteredPin.length === 4) {
    if (enteredPin === correctPin) {
      setTimeout(unlockApp, 150);
    } else {
      setTimeout(() => { shakePin(); enteredPin = ''; updatePinDots(); }, 250);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. ВКЛАДКИ, TOAST, ТЕМИ, PULL-TO-REFRESH
// ═══════════════════════════════════════════════════════════════
let docSwiper = null;
let newsSwiper = null;

function switchTab(index) {
  document.querySelectorAll('.block').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.footer > div:not(.nav-btn--ai)').forEach(btn => btn.classList.remove('active'));
  const tabBlocks = [
    document.querySelector('.blockStart'),
    document.querySelector('.block2'),
    document.querySelectorAll('.block1')[1],
    document.querySelectorAll('.block1')[2]
  ];
  const activeBlock = tabBlocks[index - 1];
  if (activeBlock) activeBlock.classList.add('active');
  const activeFooterBtn = document.querySelector(`.footer > div[data-index="${index}"]`);
  if (activeFooterBtn) activeFooterBtn.classList.add('active');
  if (index === 2) {
    if (docSwiper) docSwiper.update();
    triggerCardEntranceAnimation();
  }
}

function showNotification(msg, isBotUpdate = false) {
  const notif = document.getElementById('notification');
  if (notif) {
    if (msg) notif.textContent = msg;
    if (isBotUpdate) notif.classList.add('toast-bot-update');
    else notif.classList.remove('toast-bot-update');
    notif.classList.add('show');
    setTimeout(() => {
      notif.classList.remove('show');
      notif.classList.remove('toast-bot-update');
    }, 3000);
  }
}

// ═══════════════════════════════════════════════════════════════
// СИСТЕМА ІН-АПП ПУШ-СПОВІЩЕНЬ (Імітація надходження послуг/документів)
// ═══════════════════════════════════════════════════════════════
const NOTIF_STORAGE_KEY = 'diia_push_notifications_v1';
let _notificationHistory = [];
try {
  _notificationHistory = JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY) || '[]');
} catch (e) {
  _notificationHistory = [];
}

function updateNotificationBadge() {
  const badge = document.getElementById('menuNotifBadge');
  if (!badge) return;
  const count = _notificationHistory.length;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function renderNotificationHistory() {
  const list = document.getElementById('notifHistoryList');
  if (!list) return;
  if (_notificationHistory.length === 0) {
    list.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 30px 10px; font-size: 14px;">Немає нових повідомлень</div>`;
    return;
  }
  list.innerHTML = _notificationHistory.map(item => `
    <div class="notif-history-item">
      <div class="notif-history-item-top">
        <span class="notif-history-title">${item.title}</span>
        <span class="notif-history-time">${item.time}</span>
      </div>
      <div class="notif-history-desc">${item.body}</div>
    </div>
  `).join('');
}

function triggerInAppPush({ title, body, iconType = 'diia', autoDismissMs = 5000 }) {
  const container = document.getElementById('inAppPushContainer');
  if (!container) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const notifObj = {
    id: Date.now() + Math.random().toString(36).substr(2, 4),
    title,
    body,
    time: timeStr,
    timestamp: Date.now()
  };

  _notificationHistory.unshift(notifObj);
  if (_notificationHistory.length > 30) _notificationHistory.pop();
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(_notificationHistory));
  } catch (e) {}

  updateNotificationBadge();
  renderNotificationHistory();

  // Звуковий / тактильний відгук
  if (navigator.vibrate) {
    navigator.vibrate([40, 60, 40]);
  }

  const card = document.createElement('div');
  card.className = 'inapp-push-card';
  card.innerHTML = `
    <div class="inapp-push-icon-wrap">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
    <div class="inapp-push-content">
      <div class="inapp-push-top">
        <span class="inapp-push-appname">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg>
          Дія • Зараз
        </span>
        <button class="inapp-push-close" aria-label="Закрити">&times;</button>
      </div>
      <div class="inapp-push-title">${title}</div>
      <div class="inapp-push-desc">${body}</div>
    </div>
  `;

  let dismissTimeout = null;

  function dismiss() {
    clearTimeout(dismissTimeout);
    card.classList.remove('visible');
    setTimeout(() => {
      if (card.parentNode) card.parentNode.removeChild(card);
    }, 400);
  }

  card.querySelector('.inapp-push-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dismiss();
  });

  card.addEventListener('click', () => {
    dismiss();
    openNotificationSheet();
  });

  container.appendChild(card);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      card.classList.add('visible');
    });
  });

  dismissTimeout = setTimeout(dismiss, autoDismissMs);
}

function openNotificationSheet() {
  const modal = document.getElementById('notifSheetModal');
  if (modal) {
    renderNotificationHistory();
    modal.classList.add('active');
  }
}

function closeNotificationSheet() {
  const modal = document.getElementById('notifSheetModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function initPushNotificationSystem() {
  updateNotificationBadge();
  renderNotificationHistory();

  document.getElementById('btnOpenNotifications')?.addEventListener('click', openNotificationSheet);
  document.getElementById('btnCloseNotifSheet')?.addEventListener('click', closeNotificationSheet);
  document.getElementById('notifSheetModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'notifSheetModal') closeNotificationSheet();
  });

  document.getElementById('btnClearNotifs')?.addEventListener('click', () => {
    _notificationHistory = [];
    try {
      localStorage.removeItem(NOTIF_STORAGE_KEY);
    } catch (e) {}
    updateNotificationBadge();
    renderNotificationHistory();
    showNotification('Список повідомлень очищено');
  });

  // Імітація надходження сповіщень про нові документи та послуги
  const sampleNotifications = [
    {
      title: 'Сертифікат про вакцинацію',
      body: 'Ваш сертифікат про вакцинацію успішно завантажено в застосунок'
    },
    {
      title: 'єОселя: Статус заявки оновлено',
      body: 'Банк погодив попередній розгляд вашої заявки на пільгову іпотеку'
    },
    {
      title: 'Оновлення реєстру документів',
      body: 'Дані ID-картки та РНОКПП успішно синхронізовано з ДРАЦС'
    },
    {
      title: 'Нова послуга в Дії',
      body: 'Доступна перереєстрація авто онлайн у кілька кліків'
    },
    {
      title: 'Військові облігації',
      body: 'Виплату за облігацією «Ялта» успішно зараховано на картку єПідтримка'
    }
  ];

  // Якщо історія порожня, додати початкове повідомлення
  if (_notificationHistory.length === 0) {
    _notificationHistory.push({
      id: 'init-1',
      title: 'Ласкаво просимо в Дію',
      body: 'Усі ваші цифрові документи завжди під рукою та надійно захищені',
      time: '10:00',
      timestamp: Date.now() - 3600000
    });
    updateNotificationBadge();
    renderNotificationHistory();
  }

  // Запуск імітаційного пуша через 5 секунд після запуску для наочності
  setTimeout(() => {
    triggerInAppPush(sampleNotifications[0]);
  }, 5000);

  // Періодичне надходження сповіщень про послуги / оновлення документів (кожні 45 секунд)
  let notifIndex = 1;
  setInterval(() => {
    const nextNotif = sampleNotifications[notifIndex % sampleNotifications.length];
    notifIndex++;
    triggerInAppPush(nextNotif);
  }, 45000);
}

// ═══════════════════════════════════════════════════════════════
// СЕКЦІЯ «БЕЗПЕКА» В НАЛАШТУВАННЯХ (Security & Biometrics Toggle)
// ═══════════════════════════════════════════════════════════════
const BIOMETRIC_PREF_KEY = 'biometricsEnabled';

function isBiometricsEnabled() {
  if (APP_DATA[BIOMETRIC_PREF_KEY] !== undefined) {
    return APP_DATA[BIOMETRIC_PREF_KEY] === true || APP_DATA[BIOMETRIC_PREF_KEY] === 'true';
  }
  if (_localState[BIOMETRIC_PREF_KEY] !== undefined) {
    return _localState[BIOMETRIC_PREF_KEY] === true || _localState[BIOMETRIC_PREF_KEY] === 'true';
  }
  return true; // За замовчуванням увімкнено
}

function updateBiometricUIState(enabled) {
  const bioBtn = document.getElementById('btn-biometrics');
  if (bioBtn) {
    bioBtn.style.display = enabled ? 'block' : 'none';
    bioBtn.style.pointerEvents = enabled ? 'all' : 'none';
  }
  const bioToggle = document.getElementById('toggleBiometrics');
  if (bioToggle) {
    bioToggle.checked = enabled;
  }
}

async function setBiometricsPreference(enabled) {
  APP_DATA[BIOMETRIC_PREF_KEY] = enabled;
  _localState[BIOMETRIC_PREF_KEY] = enabled;

  try {
    localStorage.setItem(LS_KEY, JSON.stringify(_localState));
  } catch (e) {}

  // Збереження в локальний кеш DiyaDB
  if (typeof DiyaDB !== 'undefined' && DiyaDB) {
    try {
      const uid = (typeof DiyaDB.getTelegramUserId === 'function')
        ? DiyaDB.getTelegramUserId()
        : 'demo_user';
      const dbKey = 'diya_db_cache_' + uid;
      let cached = {};
      try { cached = JSON.parse(localStorage.getItem(dbKey) || '{}'); } catch (err) {}
      cached[BIOMETRIC_PREF_KEY] = enabled;
      localStorage.setItem(dbKey, JSON.stringify(cached));

      // Спроба відправити в API, якщо підтримується
      await DiyaDB.saveField(BIOMETRIC_PREF_KEY, enabled);
    } catch (err) {
      console.warn('[DiyaDB] Error saving biometric preference:', err);
    }
  }

  updateBiometricUIState(enabled);

  showNotification(
    enabled
      ? 'Біометрію (FaceID/TouchID) увімкнено'
      : 'Біометрію вимкнено — вхід лише за PIN',
    false
  );
}

function openSettingsSheet() {
  const modal = document.getElementById('settingsSheetModal');
  if (modal) {
    updateBiometricUIState(isBiometricsEnabled());
    modal.classList.add('active');
  }
}

function closeSettingsSheet() {
  const modal = document.getElementById('settingsSheetModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function initSecuritySettings() {
  updateBiometricUIState(isBiometricsEnabled());

  document.getElementById('btnOpenSettings')?.addEventListener('click', openSettingsSheet);
  document.getElementById('btnCloseSettingsSheet')?.addEventListener('click', closeSettingsSheet);
  document.getElementById('settingsSheetModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'settingsSheetModal') closeSettingsSheet();
  });

  const toggle = document.getElementById('toggleBiometrics');
  if (toggle) {
    toggle.checked = isBiometricsEnabled();
    toggle.addEventListener('change', (e) => {
      setBiometricsPreference(e.target.checked);
    });
  }
}

function initTelegramTheme() {

  try {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready?.();
      tg.expand?.();
      const applyTheme = () => {
        if (tg.colorScheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      };
      applyTheme();
      tg.onEvent?.('themeChanged', applyTheme);
    }
  } catch (e) {
    console.warn('[Telegram Theme] Init error:', e);
  }
}

function initPullToRefresh() {
  const container = document.querySelector('.block2');
  if (!container) return;

  let ptr = document.getElementById('ptr-indicator');
  if (!ptr) {
    ptr = document.createElement('div');
    ptr.id = 'ptr-indicator';
    ptr.className = 'ptr-indicator';
    ptr.innerHTML = '<div class="ptr-spinner"></div>';
    const sliderContainer = container.querySelector('.documentSlider');
    if (sliderContainer) {
      container.insertBefore(ptr, sliderContainer);
    } else {
      container.prepend(ptr);
    }
  }

  let startY = 0;
  let currentY = 0;
  let isPulling = false;
  let isRefreshing = false;

  container.addEventListener('touchstart', (e) => {
    if (container.scrollTop > 5 || isRefreshing) return;
    startY = e.touches[0].pageY;
    isPulling = true;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!isPulling || isRefreshing) return;
    currentY = e.touches[0].pageY;
    const diff = currentY - startY;
    if (diff > 35) {
      ptr.classList.add('active');
    } else if (diff <= 0) {
      ptr.classList.remove('active');
    }
  }, { passive: true });

  container.addEventListener('touchend', async () => {
    if (!isPulling || isRefreshing) return;
    isPulling = false;
    const diff = currentY - startY;
    if (diff > 50) {
      isRefreshing = true;
      ptr.classList.add('active');
      setAllSyncing('syncing');
      try {
        if (typeof DiyaDB !== 'undefined') {
          DiyaDB.clearCache();
          const fresh = await DiyaDB.load();
          mergeData(fresh);
          buildAllCards();
          applyDataToDOM(fresh);
          setAllSyncing('ok');
        }
        showNotification('✓ Дані оновлено');
      } catch (err) {
        console.warn('Pull-to-refresh error:', err);
        setAllSyncing('error');
      } finally {
        setTimeout(() => {
          ptr.classList.remove('active');
          isRefreshing = false;
        }, 500);
      }
    } else {
      ptr.classList.remove('active');
    }
  });
}

const cardTimers = new Map();

function startCardCountdown(sliderEl) {
  if (cardTimers.has(sliderEl)) clearInterval(cardTimers.get(sliderEl));
  const timerText = sliderEl.querySelector('.card-timer-val');
  if (!timerText) return;
  let totalSeconds = 179;
  const interval = setInterval(() => {
    totalSeconds--;
    if (totalSeconds < 0) { clearInterval(interval); timerText.textContent = '0:00'; return; }
    const m = Math.floor(totalSeconds / 60);
    const s = String(totalSeconds % 60).padStart(2, '0');
    timerText.textContent = `${m}:${s}`;
  }, 1000);
  cardTimers.set(sliderEl, interval);
}

function flipCard(sliderEl) {
  const isFlipped = sliderEl.classList.toggle('is-flipped');
  if (isFlipped) { startCardCountdown(sliderEl); }
  else {
    if (cardTimers.has(sliderEl)) { clearInterval(cardTimers.get(sliderEl)); cardTimers.delete(sliderEl); }
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. МОДАЛКИ ТА ДІЇ
// ═══════════════════════════════════════════════════════════════
function setupModals() {
  const overlay = document.getElementById('overlay');

  function bindModal(triggerId, modalId, blockDivClass) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    document.querySelectorAll(triggerId).forEach(trig => {
      trig.addEventListener('click', (e) => {
        e.stopPropagation();
        modal.classList.add('open');
        if (overlay) overlay.classList.remove('hidden');
        if (blockDivClass) {
          const bd = document.querySelector('.' + blockDivClass);
          if (bd) bd.classList.remove('active');
        }
      });
    });
  }

  bindModal('#fullInfoPasport', 'pasport-modal', 'pasport_block_div');
  bindModal('#fullInfoZagran', 'zagran-modal', 'zagran_block_div');
  bindModal('#fullInfoStudy', 'study-modal', 'study_block_div');
  bindModal('#fullInfoeDoc', 'eDoc-modal', 'eDoc_block_div');
  bindModal('#fullInfoPrava', 'prava-modal', 'prava_block_div');
  bindModal('#fullInfoZbroya', 'zbroya-modal', 'zbroya_block_div');

  if (overlay) {
    overlay.addEventListener('click', () => {
      document.querySelectorAll('.modal.open').forEach(m => { m.classList.remove('open'); m.style.top = ''; });
      overlay.classList.add('hidden');
    });
  }
}

function setupAddDocAndChangeOrder() {
  const btnOpenAddDoc = document.getElementById('btnOpenAddDoc');
  const addDocModal = document.getElementById('addDocModal');
  const btnCloseAddDoc = document.getElementById('btnCloseAddDoc');

  if (btnOpenAddDoc && addDocModal) {
    btnOpenAddDoc.addEventListener('click', (e) => {
      e.stopPropagation();
      addDocModal.classList.add('active');
    });
  }

  if (btnCloseAddDoc && addDocModal) {
    btnCloseAddDoc.addEventListener('click', (e) => {
      e.stopPropagation();
      addDocModal.classList.remove('active');
    });
  }

  if (addDocModal) {
    addDocModal.addEventListener('click', (e) => {
      if (e.target === addDocModal) {
        addDocModal.classList.remove('active');
      }
    });

    addDocModal.querySelectorAll('.add-doc-item').forEach(item => {
      item.addEventListener('click', () => {
        const title = item.querySelector('span')?.textContent || 'Документ';
        showNotification(`Запит «${title}» надіслано в реєстр ✓`);
        addDocModal.classList.remove('active');
      });
    });
  }

  const btnOpenChangeOrder = document.getElementById('btnOpenChangeOrder');
  const changeOrderScreen = document.getElementById('changeOrderScreen');
  const btnBackFromChangeOrder = document.getElementById('btnBackFromChangeOrder');
  const changeOrderList = document.getElementById('changeOrderList');

  if (btnOpenChangeOrder && changeOrderScreen) {
    btnOpenChangeOrder.addEventListener('click', (e) => {
      e.stopPropagation();
      changeOrderScreen.classList.add('active');
    });
  }

  if (btnBackFromChangeOrder && changeOrderScreen) {
    btnBackFromChangeOrder.addEventListener('click', (e) => {
      e.stopPropagation();
      changeOrderScreen.classList.remove('active');
    });
  }

  if (changeOrderList) {
    let dragged = null;

    changeOrderList.querySelectorAll('.order-item-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        dragged = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        dragged = null;
        _applyNewOrderFromList();
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!dragged || dragged === card) return;
        const rect = card.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        changeOrderList.insertBefore(dragged, next && card.nextSibling || card);
      });

      // Touch drag підтримка
      let startY = 0;
      const handle = card.querySelector('.order-item-handle') || card;
      handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        dragged = card;
        card.classList.add('dragging');
      }, { passive: true });

      handle.addEventListener('touchmove', (e) => {
        if (!dragged) return;
        const touchY = e.touches[0].clientY;
        const elem = document.elementFromPoint(e.touches[0].clientX, touchY);
        const targetCard = elem?.closest('.order-item-card');
        if (targetCard && targetCard !== dragged && targetCard.parentNode === changeOrderList) {
          const rect = targetCard.getBoundingClientRect();
          const next = touchY > rect.top + rect.height / 2;
          changeOrderList.insertBefore(dragged, next && targetCard.nextSibling || targetCard);
        }
      }, { passive: true });

      handle.addEventListener('touchend', () => {
        if (!dragged) return;
        dragged.classList.remove('dragging');
        dragged = null;
        _applyNewOrderFromList();
      });
    });

    function _applyNewOrderFromList() {
      const keys = Array.from(changeOrderList.querySelectorAll('.order-item-card'))
        .map(c => c.getAttribute('data-doc'))
        .filter(Boolean);

      const wrapper = document.querySelector('.documentSlider .swiper-wrapper');
      if (!wrapper) return;

      const lastSlide = wrapper.querySelector('.add-swap-card-container')?.closest('.swiper-slide');

      keys.forEach(k => {
        const slide = wrapper.querySelector(`.slider.${k}`)?.closest('.swiper-slide');
        if (slide) {
          if (lastSlide) wrapper.insertBefore(slide, lastSlide);
          else wrapper.appendChild(slide);
        }
      });

      if (docSwiper) {
        docSwiper.update();
      }
      showNotification('Порядок документів оновлено ✓');
    }
  }
}

function setupCardActionSheets() {
  document.querySelectorAll('.document_block_div').forEach(sheet => {
    sheet.addEventListener('click', e => {
      if (e.target === sheet) sheet.classList.remove('active');
    });
  });
  document.querySelectorAll('.close_block').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-index');
      document.querySelector(`.${idx}_block_div`)?.classList.remove('active');
    });
  });

  document.querySelectorAll('.qrChange, .card-qr-toggle').forEach(container => {
    const slider = container.closest('.slider');
    if (!slider) return;
    const qrBtn = container.querySelector('[data-index="1"]');
    const shBtn = container.querySelector('[data-index="2"]');
    const codeDiv = slider.querySelector('.changeCode');
    const shText = slider.querySelector('.shText');
    if (!qrBtn || !shBtn || !codeDiv) return;

    function setActive(active) {
      const qrDot = qrBtn.querySelector('div');
      const shDot = shBtn.querySelector('div');
      if (active === 'qr') {
        codeDiv.className = 'qrcode changeCode';
        if (shText) shText.style.display = 'none';
        if (qrDot) { qrDot.style.background = '#000'; qrDot.classList.add('active'); }
        if (shDot) { shDot.style.background = ''; shDot.classList.remove('active'); }
        qrBtn.querySelector('img').style.filter = 'brightness(0) invert(1)';
        shBtn.querySelector('img').style.filter = '';
      } else {
        codeDiv.className = 'shcode changeCode';
        if (shText) shText.style.display = 'flex';
        if (shDot) { shDot.style.background = '#000'; shDot.classList.add('active'); }
        if (qrDot) { qrDot.style.background = ''; qrDot.classList.remove('active'); }
        shBtn.querySelector('img').style.filter = 'brightness(0) invert(1)';
        qrBtn.querySelector('img').style.filter = '';
      }
    }

    qrBtn.addEventListener('click', e => { e.stopPropagation(); setActive('qr'); });
    shBtn.addEventListener('click', e => { e.stopPropagation(); setActive('sh'); });
  });
}

// ═══════════════════════════════════════════════════════════════
// 9. AI ДІЯ
// ═══════════════════════════════════════════════════════════════
function openAiDiia() {
  const overlay = document.getElementById('aiOverlay');
  const sheet = document.getElementById('aiSheet');
  if (overlay && sheet) {
    overlay.classList.add('open'); sheet.classList.add('open');
    setTimeout(() => { const i = document.getElementById('aiInput'); if (i) i.focus(); }, 300);
  }
}
function closeAiDiia() {
  document.getElementById('aiOverlay')?.classList.remove('open');
  document.getElementById('aiSheet')?.classList.remove('open');
}

const AI_RESPONSES = {
  'паспорт': '📋 Паспорт громадянина України є дійсним цифровим документом.',
  'права':   '🚗 Ваше водійське посвідчення діє на території України.',
  'загран':  '🌍 Закордонний паспорт у Дії можна використовувати для ідентифікації.',
  'диплом':  '🎓 Диплом внесено в Реєстр документів про освіту ЄДЕБО.',
  'підтримк':'📞 Служба турботи Дії: 0 800 700 500.',
  'документи':'📋 Всі електронні документи мають юридичну силу.',
};

function sendAiMsg() {
  const input = document.getElementById('aiInput');
  if (!input) return;
  const text = (input.value || '').trim();
  if (!text) return;
  input.value = '';
  const area = document.getElementById('aiChatArea');
  if (!area) return;
  const uDiv = document.createElement('div');
  uDiv.className = 'ai-msg user'; uDiv.textContent = text;
  area.appendChild(uDiv);
  setTimeout(() => {
    let answer = '🤖 Дякую за звернення! Скористайтеся розділом «Послуги».';
    const lc = text.toLowerCase();
    for (const [k, v] of Object.entries(AI_RESPONSES)) { if (lc.includes(k)) { answer = v; break; } }
    const bDiv = document.createElement('div');
    bDiv.className = 'ai-msg bot'; bDiv.textContent = answer;
    area.appendChild(bDiv);
    area.scrollTop = area.scrollHeight;
  }, 600);
  area.scrollTop = area.scrollHeight;
}

function aiQuick(el) {
  const text = el.textContent.replace(/^[\S]+\s/, '');
  const input = document.getElementById('aiInput');
  if (input) { input.value = text; sendAiMsg(); }
}

// ═══════════════════════════════════════════════════════════════
// 10. АДМІН ПАНЕЛЬ
// ═══════════════════════════════════════════════════════════════
function setupAdminPanel() {
  const panel = document.getElementById('admin-panel');
  const container = document.getElementById('admin-inputs-container');
  const saveBtn = document.getElementById('admin-save-btn');
  const closeBtn = document.getElementById('admin-close-btn');
  if (!panel || !container) return;

  const fields = [
    { id: "textName",       label: "Ім'я (Привіт, ...)" },
    { id: "name",           label: "ПІБ (Укр)" },
    { id: "nameEn",         label: "ПІБ (Англ)" },
    { id: "birthDate",      label: "Дата народження" },
    { id: "rnokpp",         label: "РНОКПП" },
    { id: "nomerPasport",   label: "Номер паспорта" },
    { id: "sex",            label: "Стать" },
    { id: "dateGive",       label: "Дата видачі (Паспорт)" },
    { id: "dateOut",        label: "Дійсний до" },
    { id: "organ",          label: "Орган що видав" },
    { id: "uznr",           label: "УНЗР" },
    { id: "placeBirth",     label: "Місце народження" },
    { id: "legalAdress",    label: "Місце проживання" },
    { id: "zagran_number",  label: "Номер закордонного" },
    { id: "pravaNnumber",   label: "Номер водійського" },
    { id: "rightsCategories",label: "Категорії водія" },
    { id: "nomerStudy",     label: "Номер студентського" },
    { id: "university",     label: "ВНЗ" },
    { id: "zbroyaNumber",   label: "Номер дозволу на зброю" },
  ];

  container.innerHTML = '';
  fields.forEach(f => {
    const div = document.createElement('div');
    div.className = 'admin-form-group';
    div.innerHTML = `<label>${f.label}</label><input type="text" data-field="${f.id}" value="${APP_DATA[f.id] || ''}">`;
    container.appendChild(div);
  });

  saveBtn?.addEventListener('click', async () => {
    const updated = {};
    container.querySelectorAll('input[data-field]').forEach(inp => {
      updated[inp.dataset.field] = inp.value;
      _localState[inp.dataset.field] = inp.value;
    });
    localStorage.setItem(LS_KEY, JSON.stringify(_localState));
    Object.assign(APP_DATA, updated);
    _refreshAllCards(APP_DATA);
    applyDataToDOM();

    if (typeof DiyaDB !== 'undefined' && DiyaDB) {
      setAllSyncing('syncing');
      for (const [k, v] of Object.entries(updated)) {
        await DiyaDB.saveField(k, v);
      }
      setAllSyncing('ok');
    }

    showNotification('Дані збережено ✓');
    panel.classList.remove('open');
  });

  closeBtn?.addEventListener('click', () => panel.classList.remove('open'));

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyX') { e.preventDefault(); panel.classList.toggle('open'); }
  });

  let clicks = 0, clickTimeout = null;
  document.querySelector('.logos-container')?.addEventListener('click', () => {
    if (++clicks === 3) { panel.classList.toggle('open'); clicks = 0; }
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => clicks = 0, 500);
  });

  document.getElementById('admin-main-photo')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    new FileReader().onload = ev => {
      APP_DATA.mainPhoto = ev.target.result;
      _localState.mainPhoto = ev.target.result;
      document.querySelectorAll('.card-photo, #imgPassport, #imgStudent, #imgRights, #imgZagran').forEach(img => img.src = ev.target.result);
    };
    new FileReader().readAsDataURL(file);
  });
}

// ═══════════════════════════════════════════════════════════════
// 11. ГОЛОВНА ІНІЦІАЛІЗАЦІЯ
// ═══════════════════════════════════════════════════════════════
async function initFromDB() {
  if (typeof DiyaDB === 'undefined' || !DiyaDB) return;

  try {
    const data = await DiyaDB.load();
    if (data) {
      mergeData(data);
      buildAllCards();
      applyDataToDOM(data);

      if (data[BIOMETRIC_PREF_KEY] !== undefined) {
        updateBiometricUIState(data[BIOMETRIC_PREF_KEY]);
      }
    }

    DiyaDB.startPolling(30000, (fresh) => {
      mergeData(fresh);
      buildAllCards();
      applyDataToDOM(fresh);
      if (fresh[BIOMETRIC_PREF_KEY] !== undefined) {
        updateBiometricUIState(fresh[BIOMETRIC_PREF_KEY]);
      }
      showNotification('✓ Дані оновлено з сервера', true);
    });
  } catch (e) {
    console.warn('[DiyaDB] Не вдалося завантажити дані при старті:', e);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  mergeData({});
  buildAllCards();
  applyDataToDOM();

  initSplash();
  setupModals();
  setupAddDocAndChangeOrder();
  setupAdminPanel();

  document.querySelectorAll('.start-block > button').forEach(btn => {
    btn.addEventListener('click', () => { if (btn.dataset.digit) handlePinDigit(btn.dataset.digit); });
  });
  document.querySelectorAll('.biometric-btn, #btn-biometrics').forEach(el => {
    el.addEventListener('click', () => {
      if (!isBiometricsEnabled()) {
        showNotification('Біометрію вимкнено у налаштуваннях');
        return;
      }
      if (typeof triggerBiometricAuth === 'function') {
        triggerBiometricAuth(false);
      } else {
        showNotification('Біометрична автентифікація успішна');
        unlockApp();
      }
    });
  });
  document.querySelector('.forgotPassword')?.addEventListener('click', () => {
    showNotification(`Код: ${correctPin}`);
    enteredPin = correctPin; updatePinDots(); setTimeout(unlockApp, 300);
  });

  document.querySelectorAll('.footer > div[data-index]').forEach(tab => {
    tab.addEventListener('click', () => { const idx = parseInt(tab.dataset.index); if (idx) switchTab(idx); });
  });

  document.querySelectorAll('.quick-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const map = { 'scan-qr': 'Сканер QR', 'bonds': 'Військові облігації', 'no-signal': 'Заява про відсутній звʼязок' };
      showNotification(map[btn.dataset.action] || 'Сервіс активовано');
    });
  });

  if (typeof Swiper !== 'undefined' && document.querySelector('.documentSlider')) {
    docSwiper = new Swiper('.documentSlider', {
      slidesPerView: 1.1,
      centeredSlides: true,
      spaceBetween: 16,
      speed: 380,
      grabCursor: true,
      pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
    });
  }
  if (typeof Swiper !== 'undefined' && document.querySelector('.sliderNews')) {
    newsSwiper = new Swiper('.sliderNews', {
      slidesPerView: 1, spaceBetween: 16,
      pagination: { el: '.swiper-pagination2', clickable: true }
    });
  }

  initTelegramTheme();
  initOfflineWatcher();
  initPullToRefresh();
  initPushNotificationSystem();
  initSecuritySettings();

  await initFromDB();
});

window.openAiDiia = openAiDiia;
window.closeAiDiia = closeAiDiia;
window.sendAiMsg = sendAiMsg;
window.aiQuick = aiQuick;
window.triggerInAppPush = triggerInAppPush;
window.openNotificationSheet = openNotificationSheet;
window.closeNotificationSheet = closeNotificationSheet;
window.openSettingsSheet = openSettingsSheet;
window.closeSettingsSheet = closeSettingsSheet;
window.isBiometricsEnabled = isBiometricsEnabled;
window.setBiometricsPreference = setBiometricsPreference;


