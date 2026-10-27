// share.js - Compartir / reto / tarjeta / medición de "El Reto del 1%".
// Núcleo: una constante + tres funciones. Debajo, bloque de integración.
// El único dato usado es el NIVEL (variable global `score` del juego).

const BASE_URL = "https://www.elretodel1.xyz";

// Devuelve el número de ?r= (entero) o null.
function getRetoFromURL() {
    const v = new URLSearchParams(location.search).get('r');
    return v !== null && /^\d+$/.test(v) ? parseInt(v, 10) : null;
}

// Devuelve el mensaje exacto de WhatsApp.
function buildShareText(level) {
    return "Me lo han pasado y ahora estoy picado.\n" +
        "El Reto del 1%: solo el 1% pasa del nivel 10.\n" +
        "Fallé por un píxel en el " + level + ".\n" +
        "¿Tú hasta dónde llegas? 👉 " + BASE_URL + "/?r=" + level;
}

// navigator.share({text}); si no existe: abre wa.me y copia al portapapeles + aviso.
function shareText(text) {
    if (navigator.share) {
        navigator.share({ text }).catch(() => {});
        return;
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    const done = () => showToast('¡Enlace copiado! Pégalo a tus amigos');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => legacyCopy(text, done));
    } else {
        legacyCopy(text, done);
    }
}

// ---------------------------------------------------------------------
// Integración (helpers cortos, sin clases)
// ---------------------------------------------------------------------

function legacyCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (_) {}
    document.body.removeChild(ta);
}

// Umami Cloud: pega aquí tu Website ID real. Mientras esté vacío, el script NO se carga.
const UMAMI_WEBSITE_ID = "e0d8ba28-43d5-47ae-aac7-eed2e520dd65";
if (UMAMI_WEBSITE_ID) {
    const u = document.createElement('script');
    u.async = true;
    u.src = 'https://cloud.umami.is/script.js';
    u.setAttribute('data-website-id', UMAMI_WEBSITE_ID);
    document.head.appendChild(u);
}

// Evento Umami con solo dos propiedades: nivel y reto ('sí'/'no').
function track(name, nivel) {
    window.umami?.track(name, { nivel, reto: getRetoFromURL() !== null ? 'sí' : 'no' });
}

// Hook: se llama desde startGame() del juego.
function retoOnStart() {
    if (score !== 0) return; // no cuenta el "seguir" tras revivir
    const banner = document.getElementById('retoBanner');
    track('partida_iniciada', 0);
    if (banner) {
        track('reto_aceptado', 0);
        banner.remove();
    }
}

// Hook: se llama desde gameOver() del juego, con el nivel donde falló.
function retoOnGameOver(level) {
    const beat = getRetoFromURL();
    document.getElementById('retoWin').style.display = (beat !== null && level > beat) ? 'block' : 'none';
    track('game_over_visto', level);
}

// Tarjeta 1080x1920 en canvas.
async function makeCard(level) {
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1920;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, 1080, 1920);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const font = (px) => 'bold ' + px + 'px Inter, Arial, Helvetica, sans-serif';
    try { await document.fonts.load(font(100)); } catch (_) {}
    g.fillStyle = '#39ff14';
    g.shadowColor = '#39ff14';
    // Ajusta el tamaño al ancho: lo más grande posible (máx. 300px) sin pasar de 920px.
    const MAX_W = 920;
    const title = 'NIVEL ' + level;
    let px = 300;
    g.font = font(px);
    const w0 = g.measureText(title).width;
    if (w0 > MAX_W) px = Math.floor(px * MAX_W / w0);
    g.font = font(px);
    while (px > 20 && g.measureText(title).width > MAX_W) { px--; g.font = font(px); }
    g.shadowBlur = Math.round(60 * px / 300);
    g.fillText(title, 540, 800);
    g.shadowBlur = 30;
    g.font = font(90);
    g.fillText('Por un píxel', 540, 1050);
    g.shadowBlur = 0;
    g.fillStyle = '#39ff14';
    g.globalAlpha = 0.8;
    g.font = font(44);
    g.fillText('elretodel1.xyz', 540, 1780);
    return new Promise((res) => c.toBlob(res, 'image/png'));
}

async function shareCard(level) {
    const blob = await makeCard(level);
    if (!blob) return;
    const file = new File([blob], 'reto-nivel-' + level + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Banner de retado (solo si hay ?r=).
function showRetoBanner(r) {
    const b = document.createElement('div');
    b.id = 'retoBanner';
    b.innerHTML = '<div class="reto-msg"></div><button id="retoPlayBtn">Jugar</button>';
    b.firstChild.textContent = 'Tu amigo llegó al nivel ' + r + '. Supéralo.';
    document.body.appendChild(b);
    const btn = document.getElementById('retoPlayBtn');
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('touchstart', (e) => e.stopPropagation());
    btn.addEventListener('click', () => {
        if (gameState === 'START') startGame();
    });
}

(function initShare() {
    const bind = (id, fn) => {
        const el = document.getElementById(id);
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation());
        el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
    };
    bind('shareBtn', () => { track('share_click', score); shareText(buildShareText(score)); });
    bind('cardBtn', () => { track('card_click', score); shareCard(score); });
    bind('retoReturnBtn', () => shareText(buildShareText(score)));
    const r = getRetoFromURL();
    if (r !== null) showRetoBanner(r);
})();
