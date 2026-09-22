/**
 * Дія - Основний JavaScript додаток
 */

// 1. Стан додатка та локальне сховище
const LOCAL_STORAGE_KEY = 'diyaLocalState_v1';
let savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');

// Застосування початкових або збережених даних до DOM
function applyDataToDOM() {
    // Зливаємо значення за замовчуванням із збереженими
    const data = Object.assign({}, typeof defaultUserData !== 'undefined' ? defaultUserData : {}, savedState);

    Object.keys(data).forEach(id => {
        if (id.startsWith('doc_') || id === 'mainPhoto' || id === 'sigPhoto') return;
        const els = document.querySelectorAll('#' + id);
        els.forEach(el => {
            if (data[id] !== undefined && data[id] !== '') {
                el.textContent = data[id];
            }
        });
    });

    // Застосування фото
    const photoUrl = data.mainPhoto || 'assets/user_photo.jpg';
    document.querySelectorAll('#imgPassport, #imgStudent, #imgRights, #imgZagran').forEach(img => {
        img.src = photoUrl;
    });

    // Застосування підпису
    if (data.sigPhoto) {
        document.querySelectorAll('img[src*="sig.png"]').forEach(img => {
            img.src = data.sigPhoto;
        });
    }

    // Поточна дата
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateFormatted = `${day}.${month}.${year}`;
    const dateTimeFormatted = `${hours}:${minutes} | ${dateFormatted}`;

    document.querySelectorAll('#getCurrentDateTime').forEach(el => el.textContent = dateTimeFormatted);
    document.querySelectorAll('.dataNow').forEach(el => el.textContent = dateFormatted);
}

// 2. Сплеш-екран -> Екран пін-коду
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

// 3. Логіка ПІН-коду
let enteredPin = '';
const correctPin = typeof entryPin !== 'undefined' ? entryPin : '1234';

function updatePinDots() {
    const dots = document.querySelectorAll('.start-vhod > div');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx < enteredPin.length);
    });
}

function unlockApp() {
    const startDiv = document.querySelector('.start-div');
    const main = document.querySelector('.main');
    
    if (startDiv) {
        startDiv.style.opacity = '0';
        startDiv.style.transform = 'scale(0.96)';
        setTimeout(() => {
            startDiv.classList.remove('active');
            startDiv.style.display = 'none';
        }, 350);
    }
    
    if (main) {
        main.classList.add('active');
        // За замовчуванням відкриваємо розділ документів
        switchTab(2);
    }
}

function shakePin() {
    const block = document.querySelector('.start-block');
    if (block) {
        block.style.transform = 'translateX(-12px)';
        setTimeout(() => block.style.transform = 'translateX(12px)', 80);
        setTimeout(() => block.style.transform = 'translateX(-8px)', 160);
        setTimeout(() => block.style.transform = 'translateX(8px)', 240);
        setTimeout(() => block.style.transform = 'translateX(0)', 320);
    }
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
}

function handlePinDigit(digit) {
    if (digit === 'del') {
        enteredPin = enteredPin.slice(0, -1);
        updatePinDots();
        return;
    }

    if (enteredPin.length >= 4) return;
    enteredPin += digit;
    updatePinDots();

    if (enteredPin.length === 4) {
        if (enteredPin === correctPin) {
            setTimeout(unlockApp, 150);
        } else {
            setTimeout(() => {
                shakePin();
                enteredPin = '';
                updatePinDots();
            }, 250);
        }
    }
}

// 4. Перемикання вкладок
let docSwiper = null;
let newsSwiper = null;

function switchTab(index) {
    // index: 1 (Стрічка), 2 (Документи), 3 (Сервіси), 4 (Меню)
    document.querySelectorAll('.block').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.footer > div:not(.nav-btn--ai)').forEach(btn => btn.classList.remove('active'));

    const tabBlocks = [
        document.querySelector('.blockStart'), // Tab 1
        document.querySelector('.block2'),     // Tab 2 (Документи)
        document.querySelectorAll('.block1')[1], // Tab 3 (Сервіси)
        document.querySelectorAll('.block1')[2]  // Tab 4 (Меню)
    ];

    const activeBlock = tabBlocks[index - 1];
    if (activeBlock) activeBlock.classList.add('active');

    const activeFooterBtn = document.querySelector(`.footer > div[data-index="${index}"]`);
    if (activeFooterBtn) activeFooterBtn.classList.add('active');

    if (index === 2 && docSwiper) {
        docSwiper.update();
    }
}

// 5. Сповіщення Toast
function showNotification(msg) {
    const notif = document.getElementById('notification');
    if (notif) {
        if (msg) notif.textContent = msg;
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 2500);
    }
}

// 6. Картки: 3D-перегортання та таймер
const cardTimers = new Map();

function startCardCountdown(sliderEl) {
    if (cardTimers.has(sliderEl)) {
        clearInterval(cardTimers.get(sliderEl));
    }

    const timerText = sliderEl.querySelector('.qrcodeBlock > span > span');
    if (!timerText) return;

    let totalSeconds = 179; // 2:59
    const interval = setInterval(() => {
        totalSeconds--;
        if (totalSeconds < 0) {
            clearInterval(interval);
            timerText.textContent = '0:00';
            return;
        }
        const m = Math.floor(totalSeconds / 60);
        const s = String(totalSeconds % 60).padStart(2, '0');
        timerText.textContent = `${m}:${s}`;
    }, 1000);

    cardTimers.set(sliderEl, interval);
}

function flipCard(sliderEl) {
    const isFlipped = sliderEl.classList.toggle('is-flipped');
    if (isFlipped) {
        startCardCountdown(sliderEl);
    } else {
        if (cardTimers.has(sliderEl)) {
            clearInterval(cardTimers.get(sliderEl));
            cardTimers.delete(sliderEl);
        }
    }
}

// 7. Дія. AI
function openAiDiia() {
    const overlay = document.getElementById('aiOverlay');
    const sheet = document.getElementById('aiSheet');
    if (overlay && sheet) {
        overlay.classList.add('open');
        sheet.classList.add('open');
        setTimeout(() => {
            const input = document.getElementById('aiInput');
            if (input) input.focus();
        }, 300);
    }
}

function closeAiDiia() {
    const overlay = document.getElementById('aiOverlay');
    const sheet = document.getElementById('aiSheet');
    if (overlay && sheet) {
        overlay.classList.remove('open');
        sheet.classList.remove('open');
    }
}

const AI_RESPONSES = {
    'паспорт': '📋 Паспорт громадянина України (ID-картка) є дійсним цифровим документом згідно із законодавством України. Його термін дії — 10 років.',
    'права': '🚗 Ваше водійське посвідчення діє на території України та автоматично підтверджено в базах МВС.',
    'загран': '🌍 Закордонний паспорт у Дії можна використовувати для ідентифікації в межах України, а також пред’являти на кордоні у передбачених випадках.',
    'диплом': '🎓 Диплом бакалавра внесено в Реєстр документів про освіту ЄДЕБО.',
    'підтримк': '📞 Служба турботи Дії працює 24/7. Гаряча лінія: 0 800 700 500.',
    'документи': '📋 Усі ваші електронні документи мають таку ж юридичну силу, як і їхні паперові аналоги.'
};

function sendAiMsg() {
    const input = document.getElementById('aiInput');
    if (!input) return;
    const text = (input.value || '').trim();
    if (!text) return;
    input.value = '';

    const area = document.getElementById('aiChatArea');
    if (!area) return;

    // User msg
    const uDiv = document.createElement('div');
    uDiv.className = 'ai-msg user';
    uDiv.textContent = text;
    area.appendChild(uDiv);

    // Bot response
    setTimeout(() => {
        let answer = '🤖 Дякую за ваше звернення! Якщо у вас виникли додаткові питання, скористайтеся розділом «Послуги» або зверніться до служби турботи Дії.';
        const lc = text.toLowerCase();
        for (const [key, resp] of Object.entries(AI_RESPONSES)) {
            if (lc.includes(key)) {
                answer = resp;
                break;
            }
        }

        const bDiv = document.createElement('div');
        bDiv.className = 'ai-msg bot';
        bDiv.textContent = answer;
        area.appendChild(bDiv);
        area.scrollTop = area.scrollHeight;
    }, 600);

    area.scrollTop = area.scrollHeight;
}

function aiQuick(el) {
    const text = el.textContent.replace(/^[\S]+\s/, '');
    const input = document.getElementById('aiInput');
    if (input) {
        input.value = text;
        sendAiMsg();
    }
}

// 8. Модальні вікна (Свайп вниз для закриття)
function setupModals() {
    const overlay = document.getElementById('overlay');

    function bindModal(triggerId, modalId, blockDivClass) {
        const triggers = document.querySelectorAll(triggerId);
        const modal = document.getElementById(modalId);
        if (!modal) return;

        triggers.forEach(trig => {
            trig.addEventListener('click', (e) => {
                e.stopPropagation();
                modal.classList.add('open');
                if (overlay) overlay.classList.remove('hidden');

                if (blockDivClass) {
                    const blockDiv = document.querySelector('.' + blockDivClass);
                    if (blockDiv) blockDiv.classList.remove('active');
                }
            });
        });

        // Свайп вниз для закриття
        let startY = 0;
        let isDragging = false;
        modal.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });

        modal.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const dy = e.touches[0].clientY - startY;
            if (dy > 0 && modal.scrollTop <= 0) {
                modal.style.top = `calc(6% + ${dy}px)`;
            }
        }, { passive: true });

        modal.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            const dy = e.changedTouches[0].clientY - startY;
            if (dy > 120) {
                modal.classList.remove('open');
                modal.style.top = '';
                if (overlay) overlay.classList.add('hidden');
            } else {
                modal.style.top = '';
            }
        }, { passive: true });
    }

    bindModal('#fullInfoPasport', 'pasport-modal', 'pasport_block_div');
    bindModal('#fullInfoZagran', 'zagran-modal', 'zagran_block_div');
    bindModal('#fullInfoStudy', 'study-modal', 'study_block_div');
    bindModal('#fullInfoeDoc', 'eDoc-modal', 'eDoc_block_div');
    bindModal('#fullInfoPrava', 'prava-modal', 'prava_block_div');
    bindModal('#fullInfoZbroya', 'zbroya-modal', 'zbroya_block_div');

    if (overlay) {
        overlay.addEventListener('click', () => {
            document.querySelectorAll('.modal.open').forEach(m => {
                m.classList.remove('open');
                m.style.top = '';
            });
            overlay.classList.add('hidden');
        });
    }
}

// 9. Меню дій картки ("...")
function setupCardActionSheets() {
    document.querySelectorAll('.moreInfo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = btn.getAttribute('data-index');
            const sheet = document.querySelector(`.${index}_block_div`);
            if (sheet) sheet.classList.add('active');
        });
    });

    document.querySelectorAll('.close_block').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.getAttribute('data-index');
            const sheet = document.querySelector(`.${index}_block_div`);
            if (sheet) sheet.classList.remove('active');
        });
    });

    // Перемикач QR / Barcode
    document.querySelectorAll('.qrChange').forEach(container => {
        const slider = container.closest('.slider');
        if (!slider) return;

        const qrBtn = container.querySelector('[data-index="1"]');
        const shBtn = container.querySelector('[data-index="2"]');
        const codeDiv = slider.querySelector('.changeCode');
        const shText = slider.querySelector('.shText');

        if (qrBtn && shBtn && codeDiv) {
            qrBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                codeDiv.className = 'qrcode changeCode';
                if (shText) shText.style.display = 'none';
                qrBtn.querySelector('div').style.background = '#000';
                qrBtn.querySelector('img').style.filter = 'brightness(0) invert(1)';
                shBtn.querySelector('div').style.background = '#eee';
                shBtn.querySelector('img').style.filter = '';
            });

            shBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                codeDiv.className = 'shcode changeCode';
                if (shText) shText.style.display = 'flex';
                shBtn.querySelector('div').style.background = '#000';
                shBtn.querySelector('img').style.filter = 'brightness(0) invert(1)';
                qrBtn.querySelector('div').style.background = '#eee';
                qrBtn.querySelector('img').style.filter = '';
            });
        }
    });
}

// 10. Редактор даних (Admin Panel)
function setupAdminPanel() {
    const panel = document.getElementById('admin-panel');
    const container = document.getElementById('admin-inputs-container');
    const saveBtn = document.getElementById('admin-save-btn');
    const closeBtn = document.getElementById('admin-close-btn');

    if (!panel || !container) return;

    const fields = [
        { id: "textName", label: "Ім'я (Головна: Привіт, ...)" },
        { id: "name", label: "ПІБ (Укр)" },
        { id: "nameEn", label: "ПІБ (Англ)" },
        { id: "birthDate", label: "Дата народження" },
        { id: "rnokpp", label: "РНОКПП" },
        { id: "nomerPasport", label: "Номер паспорта" },
        { id: "sex", label: "Стать (Укр)" },
        { id: "dateGive", label: "Дата видачі (Паспорт)" },
        { id: "dateOut", label: "Дійсний до (Паспорт)" },
        { id: "organ", label: "Орган що видав" },
        { id: "uznr", label: "Запис № (УНЗР)" },
        { id: "placeBirth", label: "Місце народження" },
        { id: "legalAdress", label: "Місце проживання" },
        { id: "zagran_number", label: "Номер закордонного" },
        { id: "pravaNnumber", label: "Номер водійського" },
        { id: "rightsCategories", label: "Категорії водія" },
        { id: "nomerStudy", label: "Номер студентського" },
        { id: "university", label: "Назва ВНЗ" },
        { id: "zbroyaNumber", label: "Номер дозволу на зброю" }
    ];

    container.innerHTML = '';
    const currentData = Object.assign({}, typeof defaultUserData !== 'undefined' ? defaultUserData : {}, savedState);

    fields.forEach(f => {
        const div = document.createElement('div');
        div.className = 'admin-form-group';
        div.innerHTML = `
            <label>${f.label}</label>
            <input type="text" data-field="${f.id}" value="${currentData[f.id] || ''}" />
        `;
        container.appendChild(div);
    });

    // Зберегти
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            container.querySelectorAll('input[data-field]').forEach(inp => {
                savedState[inp.dataset.field] = inp.value;
            });
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedState));
            applyDataToDOM();
            showNotification('Дані збережено успішно');
            panel.classList.remove('open');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    }

    // Відкриття комбінацією Ctrl+Shift+X
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyX') {
            e.preventDefault();
            panel.classList.toggle('open');
        }
    });

    // Потрійний клік на логотипи
    let clicks = 0;
    let clickTimeout = null;
    const logos = document.querySelector('.logos-container');
    if (logos) {
        logos.addEventListener('click', () => {
            clicks++;
            if (clicks === 3) {
                panel.classList.toggle('open');
                clicks = 0;
            }
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => clicks = 0, 500);
        });
    }

    // Фото завантаження
    const photoInput = document.getElementById('admin-main-photo');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    savedState.mainPhoto = ev.target.result;
                    document.querySelectorAll('#imgPassport, #imgStudent, #imgRights, #imgZagran').forEach(img => {
                        img.src = ev.target.result;
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Підпис канвас
    const sigCanvas = document.getElementById('signature-pad');
    if (sigCanvas) {
        const sCtx = sigCanvas.getContext('2d');
        let drawing = false;

        function setCanvasRes() {
            sigCanvas.width = sigCanvas.offsetWidth;
            sigCanvas.height = 120;
            sCtx.strokeStyle = '#002654';
            sCtx.lineWidth = 2.5;
            sCtx.lineCap = 'round';
            sCtx.lineJoin = 'round';
        }
        setTimeout(setCanvasRes, 200);

        function startD(e) {
            drawing = true;
            sCtx.beginPath();
            const r = sigCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            sCtx.moveTo(clientX - r.left, clientY - r.top);
        }

        function drawD(e) {
            if (!drawing) return;
            const r = sigCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            sCtx.lineTo(clientX - r.left, clientY - r.top);
            sCtx.stroke();
        }

        function stopD() { drawing = false; }

        sigCanvas.addEventListener('mousedown', startD);
        sigCanvas.addEventListener('mousemove', drawD);
        sigCanvas.addEventListener('mouseup', stopD);

        sigCanvas.addEventListener('touchstart', startD, { passive: true });
        sigCanvas.addEventListener('touchmove', drawD, { passive: true });
        sigCanvas.addEventListener('touchend', stopD, { passive: true });

        const btnClearSig = document.getElementById('btn-clear-sig-pad');
        if (btnClearSig) {
            btnClearSig.addEventListener('click', () => sCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height));
        }

        const btnSaveSig = document.getElementById('btn-save-sig-pad');
        if (btnSaveSig) {
            btnSaveSig.addEventListener('click', () => {
                const dataUrl = sigCanvas.toDataURL('image/png');
                savedState.sigPhoto = dataUrl;
                document.querySelectorAll('img[src*="sig.png"]').forEach(img => img.src = dataUrl);
                showNotification('Підпис застосовано');
            });
        }
    }
}

// 11. Головна ініціалізація
window.addEventListener('DOMContentLoaded', () => {
    applyDataToDOM();
    initSplash();
    setupModals();
    setupCardActionSheets();
    setupAdminPanel();

    // ПІН клавіатура
    document.querySelectorAll('.start-block > button').forEach(btn => {
        btn.addEventListener('click', () => {
            const digit = btn.dataset.digit;
            if (digit) handlePinDigit(digit);
        });
    });

    const biometricBtn = document.querySelector('.biometric-btn');
    if (biometricBtn) {
        biometricBtn.addEventListener('click', () => {
            showNotification('Біометрична автентифікація успішна');
            unlockApp();
        });
    }

    const forgotPass = document.querySelector('.forgotPassword');
    if (forgotPass) {
        forgotPass.addEventListener('click', () => {
            showNotification(`Код для входу за замовчуванням: ${correctPin}`);
            enteredPin = correctPin;
            updatePinDots();
            setTimeout(unlockApp, 300);
        });
    }

    // Футер перемикання вкладок
    document.querySelectorAll('.footer > div[data-index]').forEach(tab => {
        tab.addEventListener('click', () => {
            const idx = parseInt(tab.dataset.index, 10);
            if (idx) switchTab(idx);
        });
    });

    // Копіювання
    document.querySelectorAll('.copyPng').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNotification('Номер скопійовано в буфер обміну');
        });
    });

    // Клік по картці для 3D-перевороту
    document.querySelectorAll('.slider').forEach(slider => {
        slider.addEventListener('click', (e) => {
            if (e.target.closest('.qrChange, .copyPng, .moreInfo')) return;
            flipCard(slider);
        });
    });

    // Швидкі дії в стрічці
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', () => {
            const act = btn.dataset.action;
            const map = {
                'scan-qr': 'Сканер QR-кодів відкрито',
                'bonds': 'Військові облігації',
                'no-signal': 'Заява про відсутній звʼязок'
            };
            showNotification(map[act] || 'Сервіс активовано');
        });
    });

    // Ініціалізація Swiper для карток
    if (typeof Swiper !== 'undefined' && document.querySelector('.documentSlider')) {
        docSwiper = new Swiper('.documentSlider', {
            slidesPerView: 1.14,
            centeredSlides: true,
            spaceBetween: 14,
            speed: 400,
            grabCursor: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true,
            }
        });
    }

    // Swiper для новин
    if (typeof Swiper !== 'undefined' && document.querySelector('.sliderNews')) {
        newsSwiper = new Swiper('.sliderNews', {
            slidesPerView: 1,
            spaceBetween: 16,
            pagination: {
                el: '.swiper-pagination2',
                clickable: true
            }
        });
    }
});

// Глобальні експорти для інлайн онкліків
window.openAiDiia = openAiDiia;
window.closeAiDiia = closeAiDiia;
window.sendAiMsg = sendAiMsg;
window.aiQuick = aiQuick;
