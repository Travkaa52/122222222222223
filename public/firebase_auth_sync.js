/**
 * ═══════════════════════════════════════════════════════════════
 * firebase_auth_sync.js — Модуль синхронізації Firebase Firestore
 * ═══════════════════════════════════════════════════════════════
 * 1. Якщо немає підключення до БД — дані беруться з values.js (defaultUserData)
 * 2. При підключенні до БД — вивантажує дані конкретного користувача (orders/users),
 *    зберігає у localStorage та заповнює інтерфейс карток
 * 3. Реалтайм-оновлення через onSnapshot: коли користувач змінює дані через бота
 *    в Telegram, клієнт миттєво отримує оновлення саме цього користувача
 * ═══════════════════════════════════════════════════════════════
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';

// Ключі для localStorage
export const STORAGE_KEYS = {
  USER_DATA: 'diia_firestore_user_data',
  USER_ID: 'diia_firestore_user_id',
  AUTH_VERIFIED: 'diia_firestore_verified'
};

// Колекція для пошуку
export const FIRESTORE_COLLECTION = 'orders';

// Конфігурація Firebase Firestore
export const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: "AIzaSyCKnnMebKAPmg8E2xXMjRgJAlq1so982v4",
  authDomain: "funssdiaa.firebaseapp.com",
  projectId: "funssdiaa",
  storageBucket: "funssdiaa.firebasestorage.app",
  messagingSenderId: "70157781830",
  appId: "1:70157781830:web:cc1ad2aeab378f72997347",
  measurementId: "G-EZRP8C031L"
};

// Ініціалізація Firebase App та Firestore
let app = null;
let db = null;

try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn('[Firebase] Помилка ініціалізації SDK:', err);
}

// Активний слухач реалтайм оновлень (onSnapshot)
let activeUnsubscribe = null;

/**
 * Заповнює всі картки документів та модальні вікна даними користувача.
 *
 * @param {Object} orderData - Об'єкт користувача (з Firestore або values.js)
 */
export function populateUIWithUserData(orderData) {
  if (!orderData || typeof orderData !== 'object') return;

  // Вилучення полів (підтримка як схеми orders/users з Firestore, так і values.js)
  const name = orderData.fio || orderData.name || orderData.fullName || orderData.PIB || orderData.textName;
  const nameEn = orderData.nameEn;
  const birthDate = orderData.dob || orderData.birthDate || orderData.birthday || orderData.birth_date || orderData.textBirthday;
  const rnokpp = orderData.rnokpp || orderData.inn || orderData.ipn || orderData.taxId || orderData.textRnokpp;
  const mainPhoto = orderData.photo || orderData.mainPhoto || orderData.photo_url || orderData.avatar || orderData.photoUrl || orderData.imgUrl;
  const address = orderData.address || orderData.legalAdress;
  const nomerPasport = orderData.nomerPasport || orderData.passportNumber || orderData.passport_number;
  const dateOut = orderData.dateOut || orderData.expiryDate || orderData.passport_expiry;
  const dateGive = orderData.dateGive;
  const sex = orderData.sex || orderData.gender;
  const organ = orderData.organ;
  const uznr = orderData.uznr;
  const placeBirth = orderData.placeBirth;
  const registeredOn = orderData.registeredOn;

  const zagran_number = orderData.zagran_number || orderData.zagranNumber;
  const dateGiveZ = orderData.dateGiveZ;
  const dateOutZ = orderData.dateOutZ;

  const pravaNnumber = orderData.pravaNnumber || orderData.driverLicense;
  const rightsCategories = orderData.rightsCategories || orderData.categories;
  const dateGivePrava = orderData.dateGivePrava;
  const srokPrav = orderData.srokPrav;
  const pravaOrgan = orderData.pravaOrgan;

  const nomerStudy = orderData.nomerStudy || orderData.studentId;
  const vidanoStudy = orderData.vidanoStudy;
  const diusnuyDoStudy = orderData.diusnuyDoStudy;
  const formaStudy = orderData.formaStudy;
  const university = orderData.university;
  const fakultat = orderData.fakultat;

  const zbroyaType = orderData.zbroyaType;
  const zbroyaNumber = orderData.zbroyaNumber;

  const stepen_dip = orderData.stepen_dip;
  const univer_dip = orderData.univer_dip;
  const dayout_dip = orderData.dayout_dip;
  const special_dip = orderData.special_dip;
  const number_dip = orderData.number_dip;

  // 1. ПІБ (ФИО)
  if (name) {
    document.querySelectorAll('.card-name, .edoc-name, .podatki-name, .pasport-name, #name, #textName').forEach(el => {
      el.textContent = name;
    });

    const parts = name.trim().split(/\s+/);
    if (parts.length >= 3) {
      document.querySelectorAll('.user-surname, #userSurname').forEach(el => el.textContent = parts[0]);
      document.querySelectorAll('.user-firstname, #userFirstName').forEach(el => el.textContent = parts[1]);
      document.querySelectorAll('.user-patronymic, #userPatronymic').forEach(el => el.textContent = parts[2]);
    } else if (parts.length === 2) {
      document.querySelectorAll('.user-surname, #userSurname').forEach(el => el.textContent = parts[0]);
      document.querySelectorAll('.user-firstname, #userFirstName').forEach(el => el.textContent = parts[1]);
    }

    // Оновлення багаторядкового імені (fio-3lines)
    document.querySelectorAll('.card-fio-3lines').forEach(fioContainer => {
      const divs = fioContainer.querySelectorAll('div');
      if (divs.length === 3) {
        divs[0].textContent = parts[0] || '';
        divs[1].textContent = parts[1] || '';
        divs[2].textContent = parts.slice(2).join(' ') || (parts[2] || '');
      }
    });
  }

  // 2. Англійське ім'я
  if (nameEn) {
    document.querySelectorAll('#nameEn, .card-name-en').forEach(el => el.textContent = nameEn);
  }

  // 3. Дата народження
  if (birthDate) {
    document.querySelectorAll('.card-birthdate, #birthDate, #textBirthday').forEach(el => {
      el.textContent = birthDate;
    });
  }

  // 4. РНОКПП (ІПН)
  if (rnokpp) {
    document.querySelectorAll('.card-rnokpp, .card-big-rnokpp, .podatki-rnokpp-val, .edoc-rnokpp-val, #rnokpp, #textRnokpp').forEach(el => {
      el.textContent = rnokpp;
    });
    document.querySelectorAll('[data-copy]').forEach(el => {
      el.setAttribute('data-copy', rnokpp);
    });
  }

  // 5. Фотографія
  if (mainPhoto) {
    document.querySelectorAll('.card-photo, .edoc-photo-img, #imgPassport, #imgStudent, #imgRights, #imgZagran').forEach(img => {
      if (img instanceof HTMLImageElement) {
        img.src = mainPhoto;
      }
    });
  }

  // 6. Адреса та місце народження
  if (address) {
    document.querySelectorAll('.card-address, #address, #userAddress, #legalAdress').forEach(el => {
      el.textContent = address;
    });
  }
  if (placeBirth) {
    document.querySelectorAll('#placeBirth').forEach(el => el.textContent = placeBirth);
  }
  if (registeredOn) {
    document.querySelectorAll('#registeredOn').forEach(el => el.textContent = registeredOn);
  }

  // 7. Паспорт громадянина України
  if (nomerPasport) {
    document.querySelectorAll('#nomerPasport').forEach(el => el.textContent = nomerPasport);
  }
  if (dateOut) {
    document.querySelectorAll('#dateOut').forEach(el => el.textContent = dateOut);
  }
  if (dateGive) {
    document.querySelectorAll('#dateGive').forEach(el => el.textContent = dateGive);
  }
  if (sex) {
    document.querySelectorAll('#sex').forEach(el => el.textContent = sex);
  }
  if (organ) {
    document.querySelectorAll('#organ').forEach(el => el.textContent = organ);
  }
  if (uznr) {
    document.querySelectorAll('#uznr').forEach(el => el.textContent = uznr);
  }

  // 8. Закордонний паспорт
  if (zagran_number) {
    document.querySelectorAll('#zagran_number').forEach(el => el.textContent = zagran_number);
  }
  if (dateGiveZ) {
    document.querySelectorAll('#dateGiveZ').forEach(el => el.textContent = dateGiveZ);
  }
  if (dateOutZ) {
    document.querySelectorAll('#dateOutZ').forEach(el => el.textContent = dateOutZ);
  }

  // 9. Посвідчення водія
  if (pravaNnumber) {
    document.querySelectorAll('#pravaNnumber').forEach(el => el.textContent = pravaNnumber);
  }
  if (rightsCategories) {
    document.querySelectorAll('#rightsCategories').forEach(el => el.textContent = rightsCategories);
  }
  if (dateGivePrava) {
    document.querySelectorAll('#dateGivePrava').forEach(el => el.textContent = dateGivePrava);
  }
  if (srokPrav) {
    document.querySelectorAll('#srokPrav').forEach(el => el.textContent = srokPrav);
  }
  if (pravaOrgan) {
    document.querySelectorAll('#pravaOrgan').forEach(el => el.textContent = pravaOrgan);
  }

  // 10. Студентський квиток
  if (nomerStudy) {
    document.querySelectorAll('#nomerStudy').forEach(el => el.textContent = nomerStudy);
  }
  if (vidanoStudy) {
    document.querySelectorAll('#vidanoStudy').forEach(el => el.textContent = vidanoStudy);
  }
  if (diusnuyDoStudy) {
    document.querySelectorAll('#diusnuyDoStudy').forEach(el => el.textContent = diusnuyDoStudy);
  }
  if (formaStudy) {
    document.querySelectorAll('#formaStudy').forEach(el => el.textContent = formaStudy);
  }
  if (university) {
    document.querySelectorAll('#university').forEach(el => el.textContent = university);
  }
  if (fakultat) {
    document.querySelectorAll('#fakultat').forEach(el => el.textContent = fakultat);
  }

  // 11. Дозвіл на зброю
  if (zbroyaType) {
    document.querySelectorAll('#zbroyaType').forEach(el => el.textContent = zbroyaType);
  }
  if (zbroyaNumber) {
    document.querySelectorAll('#zbroyaNumber').forEach(el => el.textContent = zbroyaNumber);
  }

  // 12. Диплом
  if (stepen_dip) {
    document.querySelectorAll('#stepen_dip').forEach(el => el.textContent = stepen_dip);
  }
  if (univer_dip) {
    document.querySelectorAll('#univer_dip').forEach(el => el.textContent = univer_dip);
  }
  if (dayout_dip) {
    document.querySelectorAll('#dayout_dip').forEach(el => el.textContent = dayout_dip);
  }
  if (special_dip) {
    document.querySelectorAll('#special_dip').forEach(el => el.textContent = special_dip);
  }
  if (number_dip) {
    document.querySelectorAll('#number_dip').forEach(el => el.textContent = number_dip);
  }

  // Синхронізація з глобальним станом
  if (window.APP_DATA) {
    Object.assign(window.APP_DATA, orderData);
  }
  if (typeof window.applyDataToDOM === 'function') {
    window.applyDataToDOM(orderData);
  }
}

/**
 * Отримує документ з колекції orders/{orderId} або users/{orderId} у Firestore
 *
 * @param {string} orderId - Ідентифікатор замовлення або користувача
 * @returns {Promise<Object|null>} Дані документа або null
 */
export async function fetchUserFromFirestore(orderId) {
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('Вкажіть коректний ID замовлення');
  }

  if (!db) {
    throw new Error('Firestore не ініціалізовано');
  }

  const cleanId = orderId.trim();

  // 1. Пошук у колекції orders
  try {
    const orderDocRef = doc(db, 'orders', cleanId);
    const orderSnap = await getDoc(orderDocRef);

    if (orderSnap.exists()) {
      return { id: orderSnap.id, ...orderSnap.data() };
    }
  } catch (err) {
    console.warn('[Firebase] Помилка getDoc orders:', err);
    throw err;
  }

  // 2. Fallback: пошук у колекції users
  try {
    const userDocRef = doc(db, 'users', cleanId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
  } catch (err) {
    console.warn('[Firebase] Fallback getDoc users помилка:', err);
  }

  return null;
}

/**
 * Запускає реалтайм-слухач (onSnapshot) для конкретного користувача/замовлення.
 * Коли користувач змінює дані в базі даних через бота в Telegram,
 * клієнт миттєво отримує оновлення, зберігає у localStorage та оновлює UI.
 *
 * @param {string} orderId - Ідентифікатор замовлення / користувача
 */
export function startRealtimeSync(orderId) {
  if (!orderId || typeof orderId !== 'string' || !db) return;

  const cleanId = orderId.trim();

  // Зупиняємо попередній слухач якщо був
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }

  console.log('[Firebase Realtime] Підключення слухача onSnapshot для:', cleanId);

  try {
    const orderRef = doc(db, 'orders', cleanId);

    activeUnsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const freshData = { id: docSnap.id, ...docSnap.data() };
        console.log('[Firebase Realtime] Отримано оновлення з orders:', freshData);

        // Зберігаємо свіжі дані в localStorage
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(freshData));
        localStorage.setItem(STORAGE_KEYS.USER_ID, cleanId);
        localStorage.setItem(STORAGE_KEYS.AUTH_VERIFIED, 'true');

        // Оновлюємо інтерфейс карток
        populateUIWithUserData(freshData);

        if (typeof window.showNotification === 'function') {
          window.showNotification('✓ Дані оновлено через бота');
        }
      } else {
        // Якщо в orders немає, перевіряємо users/{cleanId}
        const userRef = doc(db, 'users', cleanId);
        activeUnsubscribe = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            const freshUserData = { id: userSnap.id, ...userSnap.data() };
            console.log('[Firebase Realtime] Отримано оновлення з users:', freshUserData);

            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(freshUserData));
            localStorage.setItem(STORAGE_KEYS.USER_ID, cleanId);
            localStorage.setItem(STORAGE_KEYS.AUTH_VERIFIED, 'true');

            populateUIWithUserData(freshUserData);

            if (typeof window.showNotification === 'function') {
              window.showNotification('✓ Дані оновлено через бота');
            }
          }
        }, (err) => console.warn('[Firebase Realtime] User listener error:', err));
      }
    }, (err) => {
      console.warn('[Firebase Realtime] Orders listener error:', err);
    });
  } catch (err) {
    console.warn('[Firebase Realtime] Не вдалося запустити onSnapshot:', err);
  }
}

/**
 * Клас керування модальним вікном верифікації
 */
export class FirebaseVerificationUI {
  constructor() {
    this.overlay = document.getElementById('fbVerifyModal');
    this.input = document.getElementById('fbUserIdInput');
    this.confirmBtn = document.getElementById('btnFbVerifyConfirm');
    this.skipBtn = document.getElementById('btnFbVerifySkip');
    this.errorEl = document.getElementById('fbVerifyError');
    this.btnText = document.getElementById('fbVerifyBtnText');
    this.spinner = document.getElementById('fbVerifySpinner');

    this.bindEvents();
  }

  bindEvents() {
    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => this.handleConfirm());
    }

    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleConfirm();
        }
      });
      this.input.addEventListener('input', () => this.hideError());
    }

    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => {
        this.close();
        // Якщо користувач пропустив — залишаємо стандартні дані з values.js
        if (typeof window.defaultUserData !== 'undefined') {
          populateUIWithUserData(window.defaultUserData);
        }
        if (typeof window.showNotification === 'function') {
          window.showNotification('Використовуються стандартні дані з values.js');
        }
      });
    }
  }

  show() {
    if (this.overlay) {
      this.overlay.classList.add('active');
      if (this.input) {
        setTimeout(() => this.input.focus(), 250);
      }
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
  }

  showError(msg) {
    if (this.errorEl) {
      this.errorEl.textContent = msg || 'Користувача не знайдено в базі даних';
      this.errorEl.classList.add('active');
    }
  }

  hideError() {
    if (this.errorEl) {
      this.errorEl.classList.remove('active');
    }
  }

  setLoading(isLoading) {
    if (this.confirmBtn) this.confirmBtn.disabled = isLoading;
    if (this.input) this.input.disabled = isLoading;
    if (this.btnText) this.btnText.style.display = isLoading ? 'none' : 'inline';
    if (this.spinner) this.spinner.style.display = isLoading ? 'inline-block' : 'none';
  }

  async handleConfirm() {
    const rawVal = this.input ? this.input.value.trim() : '';
    if (!rawVal) {
      this.showError('Будь ласка, введіть ID замовлення (наприклад: ord_09b28e36)');
      return;
    }

    this.hideError();
    this.setLoading(true);

    try {
      let userData = null;

      try {
        userData = await fetchUserFromFirestore(rawVal);
      } catch (err) {
        console.warn('[Firebase] getDoc error:', err);
        this.showError(err.message || 'Помилка підключення до Firebase Firestore');
        this.setLoading(false);
        return;
      }

      if (userData) {
        // Успішно знайдено:
        // 1. Збереження в localStorage
        localStorage.setItem(STORAGE_KEYS.USER_ID, rawVal);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.AUTH_VERIFIED, 'true');

        // 2. Заповнення UI карток документів
        populateUIWithUserData(userData);

        // 3. Запуск реалтайм-слухача для цього користувача (Telegram bot updates)
        startRealtimeSync(rawVal);

        // 4. Закриття модалки
        this.close();

        if (typeof window.showNotification === 'function') {
          const displayName = userData.fio || userData.name || rawVal;
          window.showNotification(`Документи замовлення ${displayName} завантажено ✓`);
        }
      } else {
        // Не знайдено: виведення помилки у модальному вікні
        this.showError(`Замовлення з ID "${rawVal}" не знайдено в базі даних`);
      }
    } catch (err) {
      this.showError('Помилка: ' + (err.message || 'Не вдалося виконати запит'));
    } finally {
      this.setLoading(false);
    }
  }
}

/**
 * Ініціалізація та оффлайн-режим:
 * 1. Якщо даних немає або немає підключення — спочатку застосовуємо values.js (defaultUserData).
 * 2. Якщо в localStorage вже є збережені дані верифікованого користувача — заповнюємо UI,
 *    підключаємо реалтайм слухач та не показуємо модалку.
 * 3. Перевіряємо URL параметри (?uid=... або ?orderId=...).
 */
export async function initFirebaseAuthSync() {
  const ui = new FirebaseVerificationUI();

  // Глобальний доступ
  window.fbVerificationUI = ui;
  window.populateUIWithUserData = populateUIWithUserData;
  window.fetchUserFromFirestore = fetchUserFromFirestore;
  window.startRealtimeSync = startRealtimeSync;

  // 1. Первинне заповнення даними з values.js (fallback за замовчуванням)
  if (typeof window.defaultUserData !== 'undefined' && window.defaultUserData) {
    populateUIWithUserData(window.defaultUserData);
  }

  // 2. Перевірка кешу localStorage
  try {
    const cachedDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const cachedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const isVerified = localStorage.getItem(STORAGE_KEYS.AUTH_VERIFIED);

    if (cachedDataStr && isVerified === 'true') {
      const cachedData = JSON.parse(cachedDataStr);
      if (cachedData && (cachedData.name || cachedData.fio || cachedData.rnokpp)) {
        console.log('[Firebase Sync] Завантажено дані користувача з localStorage');
        populateUIWithUserData(cachedData);

        // Запуск реалтайм-слухача для оновлень з бота в Telegram
        if (cachedUserId) {
          startRealtimeSync(cachedUserId);
        }
        return;
      }
    }
  } catch (err) {
    console.warn('[Firebase Sync] Помилка читання localStorage:', err);
  }

  // 3. Перевірка URL параметрів (?uid=..., ?orderId=..., ?order=...)
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = urlParams.get('uid') || urlParams.get('orderId') || urlParams.get('order');

  if (paramId) {
    console.log('[Firebase Sync] Знайдено ID в URL параметрах:', paramId);
    try {
      const remoteData = await fetchUserFromFirestore(paramId);
      if (remoteData) {
        localStorage.setItem(STORAGE_KEYS.USER_ID, paramId);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(remoteData));
        localStorage.setItem(STORAGE_KEYS.AUTH_VERIFIED, 'true');

        populateUIWithUserData(remoteData);
        startRealtimeSync(paramId);
        return;
      }
    } catch (e) {
      console.warn('[Firebase Sync] Автоматичне завантаження за URL параметром не вдалося:', e);
    }
  }

  // 4. Якщо даних у кеші немає — показуємо модальне вікно для вводу ID
  setTimeout(() => {
    ui.show();
  }, 450);
}

// Слухач видимості вкладки: коли користувач повертається з Telegram у PWA,
// ми перевіряємо актуальність даних конкретного користувача
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    const currentUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (currentUserId && db) {
      try {
        const fresh = await fetchUserFromFirestore(currentUserId);
        if (fresh) {
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(fresh));
          populateUIWithUserData(fresh);
        }
      } catch (e) {}
    }
  }
});

// Запуск
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirebaseAuthSync);
} else {
  initFirebaseAuthSync();
}
