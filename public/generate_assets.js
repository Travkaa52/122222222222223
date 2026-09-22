import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('public/assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Helper to create an SVG icon
function makeSvg(content, viewBox = '0 0 24 24', width = 24, height = 24) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" fill="none">${content}</svg>`;
}

// Diia Logo SVG
const diyaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#000"/>
  <path d="M30 65V35h12c10 0 16 6 16 15s-6 15-16 15H30zm8-6h4c6 0 10-4 10-9s-4-9-10-9h-4v18zm26 6V35h8v30h-8zm14-16a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0 16V47h8v18h-8z" fill="#fff"/>
</svg>`;

// UA Sign (Ministry)
const uasignSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60">
  <path d="M15 15h10v30H15zm5 0c5 0 10 3 10 10s-5 10-10 10m25-20h-8v30h8c8 0 12-5 12-15s-4-15-12-15z" fill="#000"/>
  <text x="60" y="28" font-family="sans-serif" font-size="12" font-weight="bold" fill="#000">МІНІСТЕРСТВО</text>
  <text x="60" y="42" font-family="sans-serif" font-size="10" fill="#333">ЦИФРОВОЇ ТРАНСФОРМАЦІЇ</text>
</svg>`;

// Trident (Gerb)
const gerbSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="46" fill="#000"/>
  <path d="M50 20v45m-15-32v20c0 10 7 14 15 17 8-3 15-7 15-17V33m-15 42v5" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M30 38c-3 5-3 12 0 18m40-18c3 5 3 12 0 18" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`;

// QR Code SVG
const qrcodeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="#fff" rx="12"/>
  <!-- Corner 1 -->
  <rect x="20" y="20" width="45" height="45" fill="#000" rx="6"/>
  <rect x="28" y="28" width="29" height="29" fill="#fff" rx="3"/>
  <rect x="34" y="34" width="17" height="17" fill="#000" rx="2"/>
  <!-- Corner 2 -->
  <rect x="135" y="20" width="45" height="45" fill="#000" rx="6"/>
  <rect x="143" y="28" width="29" height="29" fill="#fff" rx="3"/>
  <rect x="149" y="34" width="17" height="17" fill="#000" rx="2"/>
  <!-- Corner 3 -->
  <rect x="20" y="135" width="45" height="45" fill="#000" rx="6"/>
  <rect x="28" y="143" width="29" height="29" fill="#fff" rx="3"/>
  <rect x="34" y="149" width="17" height="17" fill="#000" rx="2"/>
  <!-- Data dots -->
  <rect x="80" y="25" width="10" height="10" fill="#000"/>
  <rect x="105" y="35" width="10" height="10" fill="#000"/>
  <rect x="75" y="55" width="10" height="10" fill="#000"/>
  <rect x="95" y="70" width="12" height="12" fill="#000"/>
  <rect x="115" y="75" width="10" height="10" fill="#000"/>
  <rect x="145" y="85" width="12" height="12" fill="#000"/>
  <rect x="40" y="85" width="10" height="10" fill="#000"/>
  <rect x="75" y="95" width="10" height="10" fill="#000"/>
  <rect x="95" y="115" width="12" height="12" fill="#000"/>
  <rect x="135" y="115" width="10" height="10" fill="#000"/>
  <rect x="160" y="135" width="15" height="15" fill="#000"/>
  <rect x="85" y="145" width="12" height="12" fill="#000"/>
  <rect x="110" y="155" width="10" height="10" fill="#000"/>
  <rect x="140" y="165" width="12" height="12" fill="#000"/>
</svg>`;

// Barcode SVG
const barcodeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="#fff" rx="8"/>
  <g fill="#000">
    <rect x="15" y="8" width="4" height="44"/>
    <rect x="22" y="8" width="2" height="44"/>
    <rect x="28" y="8" width="6" height="44"/>
    <rect x="38" y="8" width="3" height="44"/>
    <rect x="45" y="8" width="5" height="44"/>
    <rect x="54" y="8" width="2" height="44"/>
    <rect x="60" y="8" width="7" height="44"/>
    <rect x="72" y="8" width="3" height="44"/>
    <rect x="80" y="8" width="5" height="44"/>
    <rect x="90" y="8" width="2" height="44"/>
    <rect x="96" y="8" width="8" height="44"/>
    <rect x="108" y="8" width="3" height="44"/>
    <rect x="115" y="8" width="6" height="44"/>
    <rect x="125" y="8" width="2" height="44"/>
    <rect x="132" y="8" width="4" height="44"/>
    <rect x="140" y="8" width="6" height="44"/>
    <rect x="150" y="8" width="3" height="44"/>
    <rect x="158" y="8" width="5" height="44"/>
    <rect x="168" y="8" width="2" height="44"/>
    <rect x="175" y="8" width="6" height="44"/>
    <rect x="185" y="8" width="3" height="44"/>
  </g>
</svg>`;

// Signature SVG
const signatureSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60" width="160" height="60">
  <path d="M15 42c12-25 22-28 28-20 6 8-2 22 14 18 18-4 28-25 35-15 5 7-5 20 10 16 12-3 24-20 32-10 6 8-4 18 12 12" fill="none" stroke="#002654" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Generic icons map
const icons = {
    'arrow.svg': makeSvg('<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'),
    'docin.svg': makeSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    'qr.svg': makeSvg('<rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" rx="1"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" rx="1"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" rx="1"/><path d="M14 14h3v3h-3zm4 4h3v3h-3zm-4 3h3v3h-3zm4-7h3v3h-3z" fill="currentColor"/>'),
    'document.png': makeSvg('<rect x="4" y="3" width="16" height="18" rx="2" stroke="#000" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'vitag.png': makeSvg('<path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" stroke="#000" stroke-width="2" fill="none"/><path d="M9 12l2 2 4-4" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'star.png': makeSvg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#000" stroke-width="2" fill="none"/>'),
    'exchange.png': makeSvg('<path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
    'question.png': makeSvg('<circle cx="12" cy="12" r="10" stroke="#000" stroke-width="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'copy.png': makeSvg('<rect x="9" y="9" width="13" height="13" rx="2" stroke="#000" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#000" stroke-width="2"/>'),
    'dots.png': makeSvg('<circle cx="12" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="18" r="2" fill="currentColor"/>'),
    'news.png': makeSvg('<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8m8-4h-8m8 8h-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    'circle.png': makeSvg('<rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor"/>'),
    'user.png': makeSvg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>'),
    'delete.png': makeSvg('<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM18 9l-6 6M12 9l6 6" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'light.png': makeSvg('<path d="M9 18h6m-4 4h2M12 2a7 7 0 0 0-4.5 12.3c.7.6 1.5 1.7 1.5 2.7h6c0-1 .8-2.1 1.5-2.7A7 7 0 0 0 12 2z" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'helmet.png': makeSvg('<path d="M3 13c0-5 4-9 9-9s9 4 9 9v2H3v-2zm-1 4h20v2H2z" fill="#fff"/>'),
    'thunder.png': makeSvg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#fff"/>'),
    'repair.png': makeSvg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="#fff"/>'),
    'car.png': makeSvg('<rect x="3" y="11" width="18" height="6" rx="2" fill="#fff"/><path d="M5 11l2-5h10l2 5" stroke="#fff" stroke-width="2"/><circle cx="7" cy="17" r="2" fill="#000"/><circle cx="17" cy="17" r="2" fill="#000"/>'),
    'house.png': makeSvg('<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z" fill="#fff"/>'),
    'idea.png': makeSvg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5v1.5h8v-1.5A6 6 0 0 0 12 3z" fill="#fff"/>'),
    'box.png': makeSvg('<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" fill="#fff"/>'),
    'case.png': makeSvg('<rect x="2" y="7" width="20" height="14" rx="2" fill="#fff"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#fff" stroke-width="2"/>'),
    'charity.png': makeSvg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#fff"/>'),
    'verdict.png': makeSvg('<path d="M14 13l-7.5 7.5a2.12 2.12 0 1 1-3-3L11 10m3 3l3-3m-3 3l-5-5m8 2l2-2a2.83 2.83 0 0 0-4-4l-2 2" stroke="#fff" stroke-width="2"/>'),
    'osela.png': makeSvg('<path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#fff"/><path d="M9 22V12h6v10" fill="#000"/>'),
    'alert.png': makeSvg('<circle cx="12" cy="12" r="10" fill="#fff"/><path d="M12 7v6m0 4h.01" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'dovidka.png': makeSvg('<rect x="4" y="3" width="16" height="18" rx="2" fill="#fff"/><path d="M8 8h8M8 12h8M8 16h4" stroke="#000" stroke-width="2"/>'),
    'controller.png': makeSvg('<rect x="2" y="6" width="20" height="12" rx="6" fill="#fff"/><path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" stroke="#000" stroke-width="2"/>'),
    'covid.png': makeSvg('<circle cx="12" cy="12" r="6" fill="#fff"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.5-6.5l-2.8 2.8m-7.4 7.4l-2.8 2.8m0-13l2.8 2.8m7.4 7.4l2.8 2.8" stroke="#fff" stroke-width="2"/>'),
    'email.png': makeSvg('<rect x="2" y="4" width="20" height="16" rx="2" stroke="#000" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="#000" stroke-width="2"/>'),
    'key.png': makeSvg('<path d="M21 2l-2 2m-1.5 1.5L14 9l-2-2-4 4 2 2-3 3-3-3-3 3 6 6 14-14z" fill="#000"/>'),
    'folders.png': makeSvg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="#000" stroke-width="2" fill="none"/>'),
    'settings.png': makeSvg('<circle cx="12" cy="12" r="3" stroke="#000" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#000" stroke-width="2"/>'),
    'refresh.png': makeSvg('<path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'smartphone.png': makeSvg('<rect x="5" y="2" width="14" height="20" rx="3" stroke="#000" stroke-width="2"/><path d="M12 18h.01" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'chat.png': makeSvg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#000" stroke-width="2"/>'),
    'ask.png': makeSvg('<circle cx="12" cy="12" r="10" stroke="#000" stroke-width="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#000" stroke-width="2" stroke-linecap="round"/>'),
    'addDocument.png': makeSvg('<circle cx="12" cy="12" r="9" stroke="#000" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="#000" stroke-width="2" stroke-linecap="round"/>', '0 0 24 24', 35, 35),
    'swapDocument.png': makeSvg('<path d="M7 16V4m0 0L3 8m4-4l4 4m10 4v12m0 0l4-4m-4 4l-4-4" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', '0 0 24 24', 35, 35),
    'search.png': makeSvg('<circle cx="11" cy="11" r="8" stroke="#a1a1a1" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="#a1a1a1" stroke-width="2" stroke-linecap="round"/>')
};

// Write SVGs
fs.writeFileSync(path.join(assetsDir, 'diya.svg'), diyaSvg);
fs.writeFileSync(path.join(assetsDir, 'uasign.svg'), uasignSvg);
fs.writeFileSync(path.join(assetsDir, 'gerb.png'), gerbSvg);
fs.writeFileSync(path.join(assetsDir, 'qr-code.png'), qrcodeSvg);
fs.writeFileSync(path.join(assetsDir, 'free-icon-barcode-7797192.png'), barcodeSvg);
fs.writeFileSync(path.join(assetsDir, 'q.png'), qrcodeSvg);

for (const [name, svgContent] of Object.entries(icons)) {
    fs.writeFileSync(path.join(assetsDir, name), svgContent);
}

// Biometrics icon in public and assets
const biometricsSvg = makeSvg('<path d="M12 10a2 2 0 0 0-2 2c0 2 4 4 4 6m-4-12a6 6 0 0 1 8 5.7c0 3.5-3 5.3-3 7.3m-8-9a9 9 0 0 1 14 7.6c0 4.5-4 7-4 9.4M2 13a11 11 0 0 1 20 0" stroke="#000" stroke-width="1.8" stroke-linecap="round"/>', '0 0 24 24', 50, 50);
fs.writeFileSync(path.resolve('public/biometrics.png'), biometricsSvg);
fs.writeFileSync(path.join(assetsDir, 'biometrics.png'), biometricsSvg);

// Signatures
fs.writeFileSync(path.resolve('public/sig.png'), signatureSvg);
fs.writeFileSync(path.join(assetsDir, 'sig.png'), signatureSvg);

// Default user photo avatar
const userPhotoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <defs>
    <linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#cfd9df"/><stop offset="100%" stop-color="#e2ebf0"/></linearGradient>
  </defs>
  <rect width="200" height="240" fill="url(#bgG)"/>
  <circle cx="100" cy="85" r="42" fill="#2d3748"/>
  <path d="M40 220c0-35 25-60 60-60s60 25 60 60z" fill="#2d3748"/>
  <circle cx="100" cy="82" r="32" fill="#fbd38d"/>
  <path d="M72 75c0-18 12-25 28-25s28 7 28 25c-8-6-20-8-28-6-8 0-18 4-28 6z" fill="#2d3748"/>
  <circle cx="90" cy="82" r="3" fill="#2d3748"/>
  <circle cx="110" cy="82" r="3" fill="#2d3748"/>
  <path d="M96 95c2 2 6 2 8 0" stroke="#2d3748" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`;
fs.writeFileSync(path.join(assetsDir, 'user_photo.svg'), userPhotoSvg);
fs.writeFileSync(path.join(assetsDir, 'user_photo.jpg'), userPhotoSvg);

// News placeholder images
const news1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <defs><linearGradient id="n1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0052D4"/><stop offset="100%" stop-color="#4364F7"/></linearGradient></defs>
  <rect width="400" height="200" fill="url(#n1)"/>
  <text x="30" y="80" fill="#fff" font-family="sans-serif" font-size="24" font-weight="bold">Дія для бізнесу</text>
  <text x="30" y="115" fill="#e0e7ff" font-family="sans-serif" font-size="14">Зручний сайт з сервісами</text>
  <rect x="30" y="140" width="100" height="30" rx="15" fill="#fff"/>
  <text x="50" y="160" fill="#0052D4" font-family="sans-serif" font-size="12" font-weight="bold">Дізнатися</text>
</svg>`;
const news2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <defs><linearGradient id="n2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#11998e"/><stop offset="100%" stop-color="#38ef7d"/></linearGradient></defs>
  <rect width="400" height="200" fill="url(#n2)"/>
  <text x="30" y="80" fill="#fff" font-family="sans-serif" font-size="24" font-weight="bold">е-Підприємець</text>
  <text x="30" y="115" fill="#e0f2fe" font-family="sans-serif" font-size="14">10 послуг в одній заяві</text>
  <rect x="30" y="140" width="90" height="30" rx="15" fill="#fff"/>
  <text x="45" y="160" fill="#11998e" font-family="sans-serif" font-size="12" font-weight="bold">Деталі</text>
</svg>`;
const news3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <defs><linearGradient id="n3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#3498db"/></linearGradient></defs>
  <rect width="400" height="200" fill="url(#n3)"/>
  <text x="30" y="80" fill="#fff" font-family="sans-serif" font-size="22" font-weight="bold">Сповіщення в Дії</text>
  <text x="30" y="115" fill="#ecf0f1" font-family="sans-serif" font-size="14">Для сімей полонених та зниклих</text>
</svg>`;
const aodSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
  <defs><linearGradient id="aodG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f6d365"/><stop offset="100%" stop-color="#fda085"/></linearGradient></defs>
  <rect width="400" height="120" rx="16" fill="url(#aodG)"/>
  <text x="25" y="55" fill="#2d3748" font-family="sans-serif" font-size="20" font-weight="bold">Військові облігації</text>
  <text x="25" y="80" fill="#4a5568" font-family="sans-serif" font-size="13">Підтримай економіку та ЗСУ</text>
</svg>`;

fs.writeFileSync(path.join(assetsDir, '1.jpg'), news1Svg);
fs.writeFileSync(path.join(assetsDir, '2.jpg'), news2Svg);
fs.writeFileSync(path.join(assetsDir, '3.jpg'), news3Svg);
fs.writeFileSync(path.join(assetsDir, 'aod.jpg'), aodSvg);
fs.writeFileSync(path.join(assetsDir, 'ing.jpg'), gerbSvg);

console.log('All assets generated successfully!');
