/**
 * youtube-player.js — Mini-player flotante de YouTube.
 * Exporta: loadYt(urlOrId), hideYt()
 */

let _wrap    = null;
let _isLarge = false;

function _extractId(input) {
  const s = (input || '').trim();
  const m = s.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  return null;
}

function _build() {
  if (_wrap) return _wrap;

  _wrap = document.createElement('div');
  _wrap.id        = 'yt-player';
  _wrap.className = 'yt-player';
  _wrap.style.cssText = 'display:none;opacity:0';
  _wrap.innerHTML = `
    <div class="yt-player-hdr" id="yt-player-hdr">
      <span style="font-size:12px;color:var(--muted);pointer-events:none;user-select:none">▶ YouTube</span>
      <div style="display:flex;gap:4px">
        <button class="yt-ctrl" id="yt-size-btn" title="Cambiar tamaño">⤢</button>
        <button class="yt-ctrl" id="yt-close-btn" title="Cerrar">✕</button>
      </div>
    </div>
    <div class="yt-frame-wrap" id="yt-frame-wrap"></div>`;

  document.body.appendChild(_wrap);

  document.getElementById('yt-close-btn').onclick = hideYt;
  document.getElementById('yt-size-btn').onclick  = () => {
    _isLarge = !_isLarge;
    _wrap.classList.toggle('yt-player-lg', _isLarge);
  };

  // Draggable via header
  const hdr = document.getElementById('yt-player-hdr');
  hdr.addEventListener('mousedown', e => {
    if (e.target.classList.contains('yt-ctrl')) return;
    const r  = _wrap.getBoundingClientRect();
    const ox = e.clientX - r.left;
    const oy = e.clientY - r.top;

    const onMove = ev => {
      _wrap.style.left   = (ev.clientX - ox) + 'px';
      _wrap.style.top    = (ev.clientY - oy) + 'px';
      _wrap.style.right  = 'auto';
      _wrap.style.bottom = 'auto';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      window.removeEventListener('blur', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    window.addEventListener('blur', onUp);
  });

  return _wrap;
}

export function loadYt(urlOrId) {
  const id = _extractId(urlOrId);
  if (!id) return false;

  const w = _build();
  const frameWrap = document.getElementById('yt-frame-wrap');
  if (!frameWrap) return false;

  // Clear previous iframe, if any
  frameWrap.textContent = '';

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
  );
  iframe.allowFullscreen = true;

  frameWrap.appendChild(iframe);

  w.style.display = 'flex';
  requestAnimationFrame(() => { w.style.opacity = '1'; });
  return true;
}

export function hideYt() {
  if (!_wrap) return;
  _wrap.style.opacity = '0';
  setTimeout(() => {
    _wrap.style.display = 'none';
    const fw = document.getElementById('yt-frame-wrap');
    if (fw) fw.innerHTML = ''; // detiene la reproducción
  }, 300);
}
