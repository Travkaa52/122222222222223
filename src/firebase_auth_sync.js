/**
 * ═══════════════════════════════════════════════════════════════
 * firebase_auth_sync.js — ES6+ модуль інтеграції Firebase Firestore
 * ═══════════════════════════════════════════════════════════════
 * • Підключення Firebase JS SDK (v9+ modular API)
 * • getDoc з колекції users/{userId}
 * • Кэшування в localStorage та заповнення UI карток документів
 * • Перевірка оффлайн-режиму при старті (якщо дані є в localStorage — заповнює UI і не показує модалку)
 * ═══════════════════════════════════════════════════════════════
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Ключі для localStorage
export const STORAGE_KEYS = {
  USER_DATA: 'diia_firestore_user_data',
  USER_ID: 'diia_firestore_user_id',
  AUTH_VERIFIED: 'diia_firestore_verified'
};

// Колекція для пошуку
export const FIRESTORE_COLLECTION = 'orders';

// Конфігурація Firebase
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

/**
 * Заповнює UI карток документів даними користувача з документа orders
 * Використовує querySelectorAll за класами згідно з ТЗ
 *
 * @param {Object} orderData - Дані з документа orders (fio, dob, address, photo, rnokpp тощо)
 */
export function populateUIWithUserData(orderData) {
  if (!orderData || typeof orderData !== 'object') return;

  // Парсинг полів зі структури orders з скріншоту:
  // fio: "Лалаоа по ат влалалала"
  // dob: "11.12.2000"
  // address: "м. Харків, вул. Сумська, 5, кв. 12"
  // rnokpp / inn: податковий номер
  // photo / mainPhoto: фото
  const name = orderData.fio || orderData.name || orderData.fullName || orderData.PIB || orderData.textName;
  const birthDate = orderData.dob || orderData.birthDate || orderData.birthday || orderData.birth_date || orderData.textBirthday;
  const rnokpp = orderData.rnokpp || orderData.inn || orderData.ipn || orderData.taxId || orderData.textRnokpp;
  const mainPhoto = orderData.photo || orderData.mainPhoto || orderData.photo_url || orderData.avatar || orderData.photoUrl || orderData.imgUrl;
  const address = orderData.address;
  const nomerPasport = orderData.nomerPasport || orderData.passportNumber || orderData.passport_number;
  const dateOut = orderData.dateOut || orderData.expiryDate || orderData.passport_expiry;
  const sex = orderData.sex || orderData.gender;

  // 1. Заповнення ФИО (ПІБ) у всіх картках документів
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
  }

  // 2. Дата народження (dob)
  if (birthDate) {
    document.querySelectorAll('.card-birthdate, #birthDate, #textBirthday').forEach(el => {
      el.textContent = birthDate;
    });
  }

  // 3. Заповнення РНОКПП (ІПН) у всіх картках документів
  if (rnokpp) {
    document.querySelectorAll('.card-rnokpp, .podatki-rnokpp-val, .edoc-rnokpp-val, #rnokpp, #textRnokpp').forEach(el => {
      el.textContent = rnokpp;
    });
  }

  // 4. Заповнення фотографії у всіх картках документів
  if (mainPhoto) {
    document.querySelectorAll('.card-photo, .edoc-photo-img, #imgPassport, #imgStudent, #imgRights, #imgZagran').forEach(img => {
      if (img instanceof HTMLImageElement) {
        img.src = mainPhoto;
      }
    });
  }

  // 5. Адреса (якщо є в картці)
  if (address) {
    document.querySelectorAll('.card-address, #address, #userAddress').forEach(el => {
      el.textContent = address;
    });
  }

  // 6. Номер паспорта та стать
  if (nomerPasport) {
    document.querySelectorAll('#nomerPasport').forEach(el => el.textContent = nomerPasport);
  }
  if (dateOut) {
    document.querySelectorAll('#dateOut').forEach(el => el.textContent = dateOut);
  }
  if (sex) {
    document.querySelectorAll('#sex').forEach(el => el.textContent = sex);
  }

  // 7. Спеціальне опрацювання js_content (якщо документ містить автозгенерований скрипт налаштувань)
  if (orderData.js_content && typeof orderData.js_content === 'string') {
    try {
      // Якщо в js_content збережено додаткові змінні користувача
      console.log('[Firebase] Знайдено js_content у замовленні');
    } catch (e) {}
  }

  // Нормалізований об'єкт
  const normalizedData = {
    ...orderData,
    ...(name ? { name } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(rnokpp ? { rnokpp } : {}),
    ...(mainPhoto ? { mainPhoto } : {}),
    ...(address ? { address } : {})
  };

  // Синхронізація з глобальним станом застосунку (app.js)
  if (window.APP_DATA) {
    Object.assign(window.APP_DATA, normalizedData);
  }
  if (typeof window.applyDataToDOM === 'function') {
    window.applyDataToDOM(normalizedData);
  }
}

/**
 * Виконує getDoc з колекції orders/{orderId} через Firebase JS SDK (v9+)
 * Також підтримує fallback на users/{orderId}, якщо не знайдено в orders
 *
 * @param {string} orderId - Ідентифікатор документа (наприклад: ord_09b28e36)
 * @returns {Promise<Object|null>} Дані замовлення або null, якщо не знайдено
 */
export async function fetchUserFromFirestore(orderId) {
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('Вкажіть коректний ID замовлення');
  }

  if (!db) {
    throw new Error('Firestore не ініціалізовано');
  }

  const cleanId = orderId.trim();

  // Спочатку шукаємо в колекції orders
  try {
    const orderDocRef = doc(db, 'orders', cleanId);
    const orderSnap = await getDoc(orderDocRef);

    if (orderSnap.exists()) {
      return { id: orderSnap.id, ...orderSnap.data() };
    }
  } catch (err) {
    console.warn('[Firebase] Помилка getDoc з orders:', err);
    throw err;
  }

  // Fallback: якщо не знайдено в orders, перевіряємо колекцію users
  try {
    const userDocRef = doc(db, 'users', cleanId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
  } catch (err) {
    console.warn('[Firebase] Fallback getDoc з users помилка:', err);
  }

  return null;
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
        if (typeof window.showNotification === 'function') {
          window.showNotification('Використовуються локальні документи');
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
        // Замовлення знайдено:
        // 1. Збереження в localStorage
        localStorage.setItem(STORAGE_KEYS.USER_ID, rawVal);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.AUTH_VERIFIED, 'true');

        // 2. Підстановка ФИО, РНОКПП, дати народження та фото у всі картки документів
        populateUIWithUserData(userData);

        // 3. Закриття модального вікна
        this.close();

        if (typeof window.showNotification === 'function') {
          const displayName = userData.fio || userData.name || rawVal;
          window.showNotification(`Документи замовлення ${displayName} завантажено ✓`);
        }
      } else {
        // Не знайдено: виведення помилки в модальному вікні
        this.showError(`Замовлення з ID "${rawVal}" не знайдено в колекції orders`);
      }
    } catch (err) {
      this.showError('Помилка: ' + (err.message || 'Не вдалося виконати запит'));
    } finally {
      this.setLoading(false);
    }
  }
}

/**
 * Оффлайн-режим та ініціалізація:
 * При старті перевіряє localStorage.
 * Якщо дані вже є — одразу заповнює UI і НЕ показує вікно верифікації.
 */
export function initFirebaseAuthSync() {
  const ui = new FirebaseVerificationUI();

  // Глобальний доступ
  window.fbVerificationUI = ui;
  window.populateUIWithUserData = populateUIWithUserData;
  window.fetchUserFromFirestore = fetchUserFromFirestore;

  // Оффлайн-перевірка
  try {
    const cachedDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const isVerified = localStorage.getItem(STORAGE_KEYS.AUTH_VERIFIED);

    if (cachedDataStr && isVerified === 'true') {
      const cachedData = JSON.parse(cachedDataStr);
      if (cachedData && (cachedData.name || cachedData.rnokpp)) {
        console.log('[Firebase Sync] Оффлайн-режим: дані знайдено в localStorage. UI оновлено без показу модалки.');
        populateUIWithUserData(cachedData);
        return;
      }
    }
  } catch (err) {
    console.warn('[Firebase Sync] Помилка читання localStorage:', err);
  }

  // Якщо даних немає — показати модальне вікно
  setTimeout(() => {
    ui.show();
  }, 400);
}

// Запуск
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirebaseAuthSync);
} else {
  initFirebaseAuthSync();
}
