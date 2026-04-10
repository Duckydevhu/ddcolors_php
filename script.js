let paletteData = [];
let currentContrastText = "Duckydev";
let draggedIndex = null;
let originalPaletteData = [];

let savedPalettesHistory = JSON.parse(localStorage.getItem('duckyColorsHistory')) || [];

function randomHex() { return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'); }
function hexToRgb(hex) { return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) }; }
function rgbToHex(r, g, b) { return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase(); }

function hexToHsl(hex) {
    let { r, g, b } = hexToRgb(hex); r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2;
    if (max == min) { h = s = 0; }
    else {
        let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
    let r, g, b; h /= 360; s /= 100; l /= 100;
    if (s === 0) r = g = b = l;
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s; let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function calculateAdjustedColor(hex, dh, ds, dl, dt) {
    let hsl = hexToHsl(hex);
    hsl.h = (hsl.h + dh) % 360; if (hsl.h < 0) hsl.h += 360;
    hsl.s = Math.max(0, Math.min(100, hsl.s + ds));
    hsl.l = Math.max(0, Math.min(100, hsl.l + dl));
    let rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    rgb.r = Math.min(255, Math.max(0, rgb.r + dt)); rgb.b = Math.min(255, Math.max(0, rgb.b - dt));
    return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function getLuminance(r, g, b) {
    let a = [r, g, b].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(rgb1, rgb2) {
    let lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b), lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    let brightest = Math.max(lum1, lum2), darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function getShades(hex) {
    let { r, g, b } = hexToRgb(hex); let shades = [];
    for (let i = 5; i >= 1; i--) { let f = i * 0.16; shades.push(rgbToHex(Math.round(r + (255 - r) * f), Math.round(g + (255 - g) * f), Math.round(b + (255 - b) * f))); }
    shades.push(hex.toUpperCase());
    for (let i = 1; i <= 5; i++) { let f = i * 0.16; shades.push(rgbToHex(Math.round(r * (1 - f)), Math.round(g * (1 - f)), Math.round(b * (1 - f)))); }
    return shades;
}

let pickerColors = [];
let activePickerIndex = 0;
let isDraggingPicker = false;
const canvas = document.getElementById('imageCanvas');
let ctx = null;

if (canvas) {
    ctx = canvas.getContext('2d', { willReadFrequently: true });
}

const pickerRing = document.getElementById('pickerRing');

function openImagePicker(file, phpPalette) {
    if (!canvas || !ctx) {
        alert("Hiba: A kép-pipetta felület nem található a HTML-ben!");
        return;
    }

    pickerColors = [];
    for (let i = 0; i < paletteData.length; i++) {
        pickerColors.push(phpPalette[i] ? phpPalette[i] : paletteData[i].color);
    }
    activePickerIndex = 0;
    renderPickerUI();

    createImageBitmap(file).then(function (bitmap) {
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        ctx.drawImage(bitmap, 0, 0);

        document.getElementById('imagePickerModal').classList.add('show');
        if (pickerRing) {
            pickerRing.style.display = 'block';
            pickerRing.style.left = '50%';
            pickerRing.style.top = '50%';
        }
    }).catch(function (err) {
        console.error("Kép dekódolási hiba:", err);
        alert("Nem sikerült beolvasni a képet a rajzvászonra.");
    });
}

function closeImagePicker() {
    const modal = document.getElementById('imagePickerModal');
    if (modal) modal.classList.remove('show');
    if (pickerRing) pickerRing.style.display = 'none';
}

function applyImagePicker() {
    for (let i = 0; i < pickerColors.length; i++) {
        if (paletteData[i] && !paletteData[i].locked) {
            paletteData[i].color = pickerColors[i];
        }
    }
    renderPalette();
    closeImagePicker();
}

function renderPickerUI() {
    const ui = document.getElementById('pickerPaletteUI');
    if (!ui) return;
    ui.innerHTML = '';
    pickerColors.forEach((color, i) => {
        const slot = document.createElement('div');
        slot.className = 'picker-slot' + (i === activePickerIndex ? ' active' : '');
        slot.style.backgroundColor = color;
        slot.onclick = () => {
            activePickerIndex = i;
            renderPickerUI();
        };
        ui.appendChild(slot);
    });
}

function pickColorFromCanvas(e) {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;

    x = Math.max(0, Math.min(x, canvas.width - 1));
    y = Math.max(0, Math.min(y, canvas.height - 1));

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    pickerColors[activePickerIndex] = hex;
    renderPickerUI();

    const wrapperRect = document.getElementById('canvasWrapper').getBoundingClientRect();
    let cssX = e.clientX - wrapperRect.left;
    let cssY = e.clientY - wrapperRect.top;
    pickerRing.style.left = cssX + 'px';
    pickerRing.style.top = cssY + 'px';
}

if (canvas) {
    canvas.addEventListener('mousedown', (e) => { isDraggingPicker = true; pickColorFromCanvas(e); });
    canvas.addEventListener('mousemove', (e) => { if (isDraggingPicker) pickColorFromCanvas(e); });
    window.addEventListener('mouseup', () => { isDraggingPicker = false; });
    canvas.addEventListener('touchstart', (e) => { isDraggingPicker = true; pickColorFromCanvas(e.touches[0]); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { if (isDraggingPicker) pickColorFromCanvas(e.touches[0]); e.preventDefault(); }, { passive: false });
    window.addEventListener('touchend', () => { isDraggingPicker = false; });
}

function liveUpdateColor(index, newColor) {
    document.documentElement.style.setProperty(`--color-${index}`, newColor);
    const col = document.querySelectorAll('.color-col')[index];
    if (col) {
        col.style.backgroundColor = newColor;
        col.querySelector('.hex-text').innerText = newColor.toUpperCase();
        const split = col.querySelector('.original-color-split');
        if (split && !document.body.classList.contains('adjusting-mode')) split.style.backgroundColor = newColor;
    }
}

function finalizeColor(index, newColor) { paletteData[index].color = newColor; renderPalette(); }

function updateContrastTexts() {
    currentContrastText = document.getElementById('contrastInput').value || "Teszt";
    document.querySelectorAll('.dynamic-text').forEach(el => { el.innerText = currentContrastText; });
}

function shuffleColors() {
    for (let i = paletteData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [paletteData[i], paletteData[j]] = [paletteData[j], paletteData[i]];
    }
    renderPalette();
}

function renderPalette() {
    const container = document.getElementById('palette');
    container.innerHTML = '';

    paletteData.forEach((slot, index) => {
        document.documentElement.style.setProperty(`--color-${index}`, slot.color);
        const shadesArray = getShades(slot.color);

        let bgRgb = hexToRgb(slot.color);
        let whiteRatio = getContrastRatio(bgRgb, { r: 255, g: 255, b: 255 }).toFixed(2); let whitePass = whiteRatio >= 4.5 ? '✅' : '❌';
        let blackRatio = getContrastRatio(bgRgb, { r: 0, g: 0, b: 0 }).toFixed(2); let blackPass = blackRatio >= 4.5 ? '✅' : '❌';

        const col = document.createElement('div');
        col.className = 'color-col'; col.style.backgroundColor = slot.color; col.setAttribute('draggable', 'true');

        col.addEventListener('dragstart', function (e) {
            if (document.body.classList.contains('adjusting-mode')) { e.preventDefault(); return; }
            draggedIndex = index; setTimeout(() => this.classList.add('dragging'), 0);
        });
        col.addEventListener('dragover', function (e) { e.preventDefault(); this.classList.add('drag-over'); });
        col.addEventListener('dragleave', function () { this.classList.remove('drag-over'); });
        col.addEventListener('drop', function (e) {
            e.preventDefault(); this.classList.remove('drag-over');
            const targetIndex = index;
            if (draggedIndex !== null && draggedIndex !== targetIndex) {
                const draggedItem = paletteData.splice(draggedIndex, 1)[0];
                paletteData.splice(targetIndex, 0, draggedItem);
                renderPalette();
            }
        });
        col.addEventListener('dragend', function () { this.classList.remove('dragging'); document.querySelectorAll('.color-col').forEach(c => c.classList.remove('drag-over')); draggedIndex = null; });

        col.innerHTML = `
            <div class="original-color-split" style="background-color: ${slot.color}"></div>
            <div class="shade-picker" id="shades-${index}">${shadesArray.map((shadeHex, sIdx) => `<div class="shade-box" style="background-color: ${shadeHex}" onclick="setSpecificColor(${index}, '${shadeHex}', event)">${sIdx === 5 ? '●' : ''}</div>`).join('')}</div>
            <div class="contrast-picker" id="contrast-${index}">
                <div class="contrast-item"><div class="c-text-white dynamic-text">${currentContrastText}</div><div class="contrast-score">${whiteRatio} : 1 ${whitePass}</div></div>
                <div class="contrast-item"><div class="c-text-black dynamic-text">${currentContrastText}</div><div class="contrast-score">${blackRatio} : 1 ${blackPass}</div></div>
            </div>
            
            <div class="hex-text" onclick="copyHex(${index})" title="Másolás vágólapra">${slot.color.toUpperCase()}</div>
            
            <input type="color" id="native-picker-${index}" value="${slot.color}" style="position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;" oninput="liveUpdateColor(${index}, this.value)" onchange="finalizeColor(${index}, this.value)">
            <div class="col-controls">
                <button class="icon-btn ${slot.locked ? 'locked' : ''}" onclick="toggleLock(${index})" title="Zárolás">${slot.locked ? '🔒' : '🔓'}</button>
                <button class="icon-btn" onclick="document.getElementById('native-picker-${index}').click()" title="Pontos szín kiválasztása (RGB/HEX)">🖌️</button>
                <button class="icon-btn" onclick="toggleShades(${index}, event)" title="Árnyalatok">🎨</button>
                <button class="icon-btn" onclick="toggleContrast(${index}, event)" title="Kontraszt Teszt">🔤</button>
            </div>
        `;
        container.appendChild(col);
    });
}

function openAdjustPanel() {
    closeAllOverlays(); originalPaletteData = JSON.parse(JSON.stringify(paletteData));
    document.getElementById('adjHue').value = 0; document.getElementById('adjSat').value = 0; document.getElementById('adjBri').value = 0; document.getElementById('adjTemp').value = 0;
    document.getElementById('valHue').innerText = '0°'; document.getElementById('valSat').innerText = '0%'; document.getElementById('valBri').innerText = '0%'; document.getElementById('valTemp').innerText = '0';
    document.body.classList.add('adjusting-mode'); document.getElementById('adjustPanel').classList.add('show');
}

function closeAdjustPanel() { document.body.classList.remove('adjusting-mode'); document.getElementById('adjustPanel').classList.remove('show'); }
function cancelAdjust() { paletteData = JSON.parse(JSON.stringify(originalPaletteData)); renderPalette(); closeAdjustPanel(); }
function applyAdjust() { renderPalette(); closeAdjustPanel(); }

function livePreviewAdjust() {
    let dh = parseInt(document.getElementById('adjHue').value), ds = parseInt(document.getElementById('adjSat').value);
    let dl = parseInt(document.getElementById('adjBri').value), dt = parseInt(document.getElementById('adjTemp').value);
    document.getElementById('valHue').innerText = dh + '°'; document.getElementById('valSat').innerText = ds + '%';
    document.getElementById('valBri').innerText = dl + '%'; document.getElementById('valTemp').innerText = dt;

    paletteData.forEach((slot, i) => {
        if (!slot.locked) {
            slot.color = calculateAdjustedColor(originalPaletteData[i].color, dh, ds, dl, dt);
            document.documentElement.style.setProperty(`--color-${i}`, slot.color);
            const col = document.querySelectorAll('.color-col')[i];
            if (col) {
                col.style.backgroundColor = slot.color;
                col.querySelector('.hex-text').innerText = slot.color.toUpperCase();
            }
        }
    });
}

function toggleShades(index, event) { event.stopPropagation(); closeAllOverlays(); document.getElementById(`shades-${index}`).classList.add('show'); }
function toggleContrast(index, event) { event.stopPropagation(); closeAllOverlays(); document.getElementById(`contrast-${index}`).classList.add('show'); }
function setSpecificColor(index, newColor, event) { event.stopPropagation(); paletteData[index].color = newColor; renderPalette(); }
function closeAllOverlays() { document.querySelectorAll('.shade-picker.show, .contrast-picker.show').forEach(el => el.classList.remove('show')); }

function openMockupModal(cardElement) {
    const svgElement = cardElement.querySelector('svg');
    const viewBox = svgElement.getAttribute('viewBox').split(' ');

    document.getElementById('mockupModalBody').innerHTML = svgElement.outerHTML;
    const clonedSvg = document.getElementById('mockupModalBody').querySelector('svg');

    clonedSvg.style.aspectRatio = `${viewBox[2]} / ${viewBox[3]}`;
    clonedSvg.style.width = '100vw';
    clonedSvg.style.height = 'auto';
    clonedSvg.style.maxWidth = '90vw';
    clonedSvg.style.maxHeight = '85vh';

    document.getElementById('mockupModal').classList.add('show');
}

function closeMockupModal() {
    const modal = document.getElementById('mockupModal');
    if (modal) modal.classList.remove('show');
    setTimeout(() => {
        const body = document.getElementById('mockupModalBody');
        if (body) body.innerHTML = '';
    }, 300);
}

function savePalette() {
    const currentColorsStr = paletteData.map(p => p.color).join(',');
    if (savedPalettesHistory.length > 0) {
        const lastSavedStr = savedPalettesHistory[savedPalettesHistory.length - 1].map(p => p.color).join(',');
        if (currentColorsStr === lastSavedStr) return;
    }

    savedPalettesHistory.push(JSON.parse(JSON.stringify(paletteData)));
    if (savedPalettesHistory.length > 10) savedPalettesHistory.shift();

    localStorage.setItem('duckyColorsHistory', JSON.stringify(savedPalettesHistory));
    renderHistoryList();

    const btn = document.getElementById('btnSave');
    btn.innerHTML = "✔️ Mentve!";
    btn.classList.add('saved');
    setTimeout(() => {
        btn.innerHTML = "💾 Mentés";
        btn.classList.remove('saved');
    }, 2000);
}

function toggleHistory() {
    document.getElementById('historyPanel').classList.toggle('show');
    renderHistoryList();
}

function renderHistoryList() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    if (savedPalettesHistory.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888; margin-top: 50px;">Még nincsenek mentett palettáid.</p>';
        return;
    }

    [...savedPalettesHistory].reverse().forEach((pal, revIndex) => {
        const originalIndex = savedPalettesHistory.length - 1 - revIndex;
        const item = document.createElement('div');
        item.className = 'history-item';
        const colorsHtml = pal.map(p => `<div class="history-color" style="background-color: ${p.color}"></div>`).join('');

        item.innerHTML = `
            <div class="history-colors" onclick="restoreHistory(${originalIndex})" title="Kattints a betöltéshez">
                ${colorsHtml}
            </div>
            <div class="history-actions">
                <span>${pal.length} Szín</span>
                <div>
                    <button class="btn-restore" onclick="restoreHistory(${originalIndex})">Betöltés</button>
                    <button class="btn-delete" onclick="deleteHistory(${originalIndex})">Törlés</button>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function restoreHistory(index) {
    paletteData = JSON.parse(JSON.stringify(savedPalettesHistory[index]));
    renderPalette();
    document.getElementById('historyPanel').classList.remove('show');
}

function deleteHistory(index) {
    savedPalettesHistory.splice(index, 1);
    localStorage.setItem('duckyColorsHistory', JSON.stringify(savedPalettesHistory));
    renderHistoryList();
}

function generateRandomPalette() { paletteData.forEach(slot => { if (!slot.locked) slot.color = randomHex(); }); renderPalette(); }
function ujSzin() { if (paletteData.length >= 10) return alert("Max 10 szín!"); paletteData.push({ color: randomHex(), locked: false }); renderPalette(); }
function torolSzin() { if (paletteData.length <= 2) return alert("Min 2 szín!"); paletteData.pop(); renderPalette(); }
function toggleLock(index) { paletteData[index].locked = !paletteData[index].locked; renderPalette(); }
function copyHex(index) { navigator.clipboard.writeText(paletteData[index].color).then(() => alert(`Kód másolva: ${paletteData[index].color}`)); }

document.getElementById('imageInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const btn = document.querySelector('.btn-upload');
    const originalText = btn.innerText;
    btn.innerText = "⏳ Elemzés...";

    const formData = new FormData();
    formData.append('image', file);

    fetch('extract.php', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            btn.innerText = originalText;
            if (data.error) {
                alert(data.error);
            } else if (data.palette) {
                openImagePicker(file, data.palette);
            }
        })
        .catch(err => {
            btn.innerText = originalText;
            alert("Hiba az elemzésnél! Biztos fut a PHP szervered?");
        })
        .finally(() => {
            e.target.value = '';
        });
});

document.addEventListener('click', function (e) {
    if (!e.target.closest('.icon-btn') && !e.target.closest('.adjust-panel') && !e.target.closest('.btn-adjust') && !e.target.closest('.history-panel')) {
        closeAllOverlays();
    }
    if (e.target.id === 'mockupModal') closeMockupModal();
    if (e.target.id === 'imagePickerModal') closeImagePicker();

    if (!e.target.closest('.history-panel') && !e.target.closest('[onclick="toggleHistory()"]')) {
        const historyPanel = document.getElementById('historyPanel');
        if (historyPanel) historyPanel.classList.remove('show');
    }
});

document.addEventListener('keydown', function (event) {
    if (event.code === 'Escape') {
        closeMockupModal(); closeAdjustPanel(); closeAllOverlays(); closeImagePicker();
        const historyPanel = document.getElementById('historyPanel');
        if (historyPanel) historyPanel.classList.remove('show');
    }

    const isAnyModalOpen = document.getElementById('adjustPanel')?.classList.contains('show') ||
        document.getElementById('imagePickerModal')?.classList.contains('show');

    if (event.code === 'Space' && document.activeElement.id !== 'contrastInput' && !isAnyModalOpen) {
        event.preventDefault();
        generateRandomPalette();
    }
});

function exportPalette() {
    let cssVars = `:root {\n`;
    let cardsHtml = '';

    paletteData.forEach((slot, i) => {
        let hex = slot.color.toUpperCase();
        let rgb = hexToRgb(hex);
        let hsl = hexToHsl(hex);
        let shades = getShades(hex);

        let whiteContrast = getContrastRatio(rgb, { r: 255, g: 255, b: 255 }).toFixed(2);
        let blackContrast = getContrastRatio(rgb, { r: 0, g: 0, b: 0 }).toFixed(2);

        
        cssVars += `    --color-${i}: ${hex};\n`;

        
        let shadesHtml = shades.map(s => `<div class="shade" style="background-color: ${s};" title="${s}"></div>`).join('');

        
        cardsHtml += `
        <div class="color-card">
            <div class="color-swatch" style="background-color: ${hex};"></div>
            <div class="color-info">
                <h2>${hex}</h2>
                <div class="data-row"><span>RGB</span> <span>${rgb.r}, ${rgb.g}, ${rgb.b}</span></div>
                <div class="data-row"><span>HSL</span> <span>${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%</span></div>
                
                <div class="contrast-info">
                    <div class="contrast-box" style="background: #ffffff; color: ${hex}; border: 1px solid #eee;">
                        Fehér: ${whiteContrast}:1
                    </div>
                    <div class="contrast-box" style="background: #000000; color: ${hex};">
                        Fekete: ${blackContrast}:1
                    </div>
                </div>
                
                <div class="shades-title">Árnyalatok</div>
                <div class="shades-grid">
                    ${shadesHtml}
                </div>
            </div>
        </div>`;
    });

    cssVars += `}`;

    
    let exportTemplate = `<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DuckyColors - Exportált Paletta</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; background-color: #f4f7f6; color: #333; padding: 40px 20px; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 50px; }
        h1 { color: #2c3e50; margin-bottom: 5px; font-size: 36px; }
        .date { color: #7f8c8d; font-size: 14px; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
        .color-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: transform 0.2s; }
        .color-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .color-swatch { height: 180px; width: 100%; }
        
        .color-info { padding: 25px; }
        .color-info h2 { margin: 0 0 15px 0; font-size: 28px; letter-spacing: 1px; color: #111; }
        
        .data-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        .data-row span:first-child { font-weight: bold; color: #888; }
        .data-row span:last-child { font-family: monospace; font-size: 15px; font-weight: bold;}
        
        .contrast-info { display: flex; gap: 10px; margin-top: 20px; margin-bottom: 20px; }
        .contrast-box { flex: 1; padding: 10px; border-radius: 8px; text-align: center; font-size: 13px; font-weight: bold; }
        
        .shades-title { font-size: 12px; font-weight: bold; color: #aaa; text-transform: uppercase; margin-bottom: 8px; }
        .shades-grid { display: flex; height: 35px; border-radius: 8px; overflow: hidden; }
        .shade { flex: 1; transition: filter 0.2s; cursor: crosshair; }
        .shade:hover { filter: brightness(1.2); }

        .code-section { background: #1e1e24; color: #a9b7c6; padding: 30px; border-radius: 16px; margin-top: 60px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .code-section h3 { margin-top: 0; color: #fff; border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px;}
        pre { margin: 0; font-family: 'Consolas', 'Courier New', monospace; font-size: 16px; overflow-x: auto; color: #50fa7b; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 DuckyColors Brand Palette</h1>
            <div class="date">Generálva: ${new Date().toLocaleString('hu-HU')}</div>
        </div>
        
        <div class="grid">
            ${cardsHtml}
        </div>

        <div class="code-section">
            <h3>🖥️ CSS Változók (Másoláshoz)</h3>
            <pre><code>${cssVars}</code></pre>
        </div>
    </div>
</body>
</html>`;

    
    const blob = new Blob([exportTemplate], { type: 'text/html' });

    
    const url = URL.createObjectURL(blob);

    
    const a = document.createElement('a');
    a.href = url;

    
    a.download = `duckycolors-paletta-${new Date().getTime()}.html`;

    
    document.body.appendChild(a);
    a.click();

    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

for (let i = 0; i < 5; i++) paletteData.push({ color: randomHex(), locked: false });
renderPalette();