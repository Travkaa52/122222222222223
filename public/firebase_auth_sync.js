/**
 * ═══════════════════════════════════════════════════════════════
 * firebase_auth_sync.js — ES6+ модуль інтеграції Firebase Firestore
 * ═══════════════════════════════════════════════════════════════
 * • Підключення Firebase JS SDK (v9+ modular API)
 * • getDoc з колекції users/{userId}
 * • Кешування в localStorage та авто-підстановка в картки документів
 * • Перевірка оффлайн-режиму при старті (пропуск модалки, якщо дані вже є)
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

// Конфігурація Firebase (може братися з window або fallback)
export const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: "AIzaSyCKnnMebKAPmg8E2xXMjRgJAlq1so982v4",
  authDomain: "funssdiaa.firebaseapp.com",
  projectId: "funssdiaa",
  storageBucket: "funssdiaa.firebasestorage.app",
  messagingSenderId: "70157781830",
  appId: "1:70157781830:web:cc1ad2aeab378f72997347",
  measurementId: "G-EZRP8C031L"
};

// Ініціалізація Firebase App & Firestore
let app;
let db;

try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn('[Firebase] Помилка ініціалізації SDK:', err);
}

/**
 * Оновлює DOM елементи всіх карток документів новими даними користувача
 * Використовує querySelectorAll по класах та ідентифікаторах згідно з ТЗ.
 *
 * @param {Object} userData - Об'єкт користувача з Firestore (name, rnokpp, mainPhoto, birthDate, тощо)
 */
export function populateUIWithUserData(userData) {
  if (!userData || typeof userData !== 'object') return;

  const {
    name,
    rnokpp,
    mainPhoto,
    birthDate,
    nomerPasport,
    dateOut,
    sex,
    taxDepartment
  } = userData;

  // 1. Оновлення ПІБ (ФИО) у всіх картках
  if (name) {
    // Всі елементи ПІБ за селекторами класів та ID
    document.querySelectorAll('.card-name, .edoc-name, .podatki-name, .pasport-name, #name, #textName').forEach(el => {
      el.textContent = name;
    });

    // Оновлення окремих рядків, якщо ім'я розбито на рядки (наприклад, в єДокумент або картці платника податків)
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length >= 3) {
      document.querySelectorAll('.user-surname, #userSurname').forEach(el => el.textContent = nameParts[0]);
      document.querySelectorAll('.user-firstname, #userFirstName').forEach(el => el.textContent = nameParts[1]);
      document.querySelectorAll('.user-patronymic, #userPatronymic').forEach(el => el.textContent = nameParts[2]);
    }
  }

  // 2. Оновлення РНОКПП (ІПН) у всіх картках
  if (rnokpp) {
    document.querySelectorAll('.card-rnokpp, .podatki-rnokpp-val, .edoc-rnokpp-val, #rnokpp, #textRnokpp').forEach(el => {
      // Підтримка копіювання або текстових вузлів
      el.textContent = rnokpp;
    });
  }

  // 3. Оновлення фото користувача у всіх картках документів
  if (mainPhoto) {
    document.querySelectorAll('.card-photo, .edoc-photo-img, #imgPassport, #imgStudent, #imgRights, #imgZagran').forEach(img => {
      if (img instanceof HTMLImageElement) {
        img.src = mainPhoto;
      }
    });
  }

  // 4. Оновлення дати народження (якщо є в документі Firestore)
  if (birthDate) {
    document.querySelectorAll('.card-birthdate, #birthDate, #textBirthday').forEach(el => {
      el.textContent = birthDate;
    });
  }

  // 5. Оновлення паспорта (якщо передано)
  if (nomerPasport) {
    document.querySelectorAll('#nomerPasport').forEach(el => el.textContent = nomerPasport);
  }
  if (dateOut) {
    document.querySelectorAll('#dateOut').forEach(el => el.textContent = dateOut);
  }
  if (sex) {
    document.querySelectorAll('#sex').forEach(el => el.textContent = sex);
  }

  // Синхронізація з глобальним станом застосунку (якщо присутній app.js)
  if (window.APP_DATA) {
    Object.assign(window.APP_DATA, userData);
  }
  if (typeof window.applyDataToDOM === 'function') {
    window.applyDataToDOM(userData);
  }
}

/**
 * Отримує документ користувача з колекції users/{userId} у Firestore
 *
 * @param {string} userId - Ідентифікатор користувача
 * @returns {Promise<Object|null>} Дані користувача або null, якщо не знайдено
 */
export async function fetchUserFromFirestore(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Не вказано коректний userId');
  }

  if (!db) {
    throw new Error('Firebase Firestore не ініціалізовано');
  }

  const cleanUserId = userId.trim();
  const userDocRef = doc(db, 'users', cleanUserId);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
}

/**
 * Керування модальним вікном верифікації
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

    this.initListeners();
  }

  initListeners() {
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
          window.showNotification('Використовуються локальні демо-документи');
        }
      });
    }
  }

  show() {
    if (this.overlay) {
      this.overlay.classList.add('active');
      if (this.input) {
        setTimeout(() => this.input.focus(), 200);
      }
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
  }

  showError(message) {
    if (this.errorEl) {
      this.errorEl.textContent = message || 'Користувача не знайдено в базі даних';
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
      this.showError('Будь ласка, введіть userId');
      return;
    }

    this.hideError();
    this.setLoading(true);

    try {
      let userData = null;

      // Спроба виконати реальний запит до Firestore getDoc
      try {
        userData = await fetchUserFromFirestore(rawVal);
      } catch (networkOrConfigErr) {
        console.warn('[Firebase] Помилка getDoc з Firestore:', networkOrConfigErr);
        // Якщо проект ще не зв'язаний з реальними креденшелами хмари,
        // перевіряємо також збережені в демо-базі записи або повертаємо помилку
        if (networkOrConfigErr.code === 'permission-denied' || networkOrConfigErr.message?.includes('offline') || networkOrConfigErr.message?.includes('API key')) {
          this.showError('Помилка підключення до Firestore або відхилено доступ');
          this.setLoading(false);
          return;
        }
        throw networkOrConfigErr;
      }

      if (userData) {
        // Успішно знайдено: збереження в localStorage
        localStorage.setItem(STORAGE_KEYS.USER_ID, rawVal);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.AUTH_VERIFIED, 'true');

        // Підстановка в UI карток документів
        populateUIWithUserData(userData);

        // Закриття модального вікна
        this.close();

        if (typeof window.showNotification === 'function') {
          window.showNotification(`Документи користувача ${userData.name || rawVal} завантажено ✓`);
        }
      } else {
        // Не знайдено: виведення помилки в модальному вікні
        this.showError(`Користувача з ID "${rawVal}" не знайдено`);
      }
    } catch (err) {
      console.error('[Firebase Verification]', err);
      this.showError('Помилка перевірки: ' + (err.message || 'Спробуйте пізніше'));
    } finally {
      this.setLoading(false);
    }
  }
}

/**
 * Ініціалізація та оффлайн-режим:
 * При старті застосунку перевіряємо localStorage.
 * Якщо дані вже є — одразу заповнюємо UI і НЕ показуємо вікно верифікації.
 */
export function initFirebaseAuthSync() {
  const ui = new FirebaseVerificationUI();

  // Експорт у window для можливості виклику з адмінки або консолі
  window.fbVerificationUI = ui;
  window.populateUIWithUserData = populateUIWithUserData;
  window.fetchUserFromFirestore = fetchUserFromFirestore;

  try {
    const cachedDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const isVerified = localStorage.getItem(STORAGE_KEYS.AUTH_VERIFIED);

    if (cachedDataStr && isVerified === 'true') {
      const cachedData = JSON.parse(cachedDataStr);
      if (cachedData && (cachedData.name || cachedData.rnokpp)) {
        console.log('[Firebase Sync] Знайдено кешовані дані в localStorage, застосовуємо до UI');
        // Одразу заповнюємо UI без показу модалки
        populateUIWithUserData(cachedData);
        return;
      }
    }
  } catch (err) {
    console.warn('[Firebase Sync] Помилка читання localStorage:', err);
  }

  // Якщо даних немає — відкриваємо модалку верифікації
  // Даємо 500мс для завершення рендеру DOM
  setTimeout(() => {
    ui.show();
  }, 500);
}

// Автоматичний запуск після завантаження сторінки
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirebaseAuthSync);
} else {
  initFirebaseAuthSync();
}
