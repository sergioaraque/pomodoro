/**
 * pip.js — Picture-in-Picture mini-timer
 * Uses the Document Picture-in-Picture API (Chrome 116+).
 * Falls back gracefully on unsupported browsers.
 */

let _pipWin  = null;
let _rafId   = null;
let _getState = null;

const _SUPPORTED = 'documentPictureInPicture' in window;

/** Returns true if PiP is currently open. */
export function isPiPOpen() { return _pipWin !== null; }

/** Returns true if the browser supports Document PiP. */
export function isPiPSupported() { return _SUPPORTED; }

/**
 * Open the mini-timer PiP window.
 * @param {() => object} getStateFn — function that returns the current timer state
 */
export async function openPiP(getStateFn) {
  if (!_SUPPORTED) return false;
  _getState = getStateFn;

  // Close existing PiP if open
  if (_pipWin) { closePiP(); }

  try {
    _pipWin = await window.documentPictureInPicture.requestWindow({
      width: 200, height: 200,
    });

    // Inject minimal HTML + styles
    _pipWin.document.head.innerHTML = `<style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: #071020; color: #e8f4f8;
        font-family: 'DM Sans', system-ui, sans-serif;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        height: 100vh; gap: 6px; overflow: hidden;
      }
      #pip-mode  { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #8ab4cc; }
      #pip-time  { font-size: 52px; font-weight: 700; letter-spacing: -1px;
                   font-variant-numeric: tabular-nums; }
      #pip-task  { font-size: 11px; color: #8ab4cc; max-width: 180px;
                   white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }
      svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      .ring-bg   { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 4; }
      .ring-prog { fill: none; stroke: #4ecdc4; stroke-width: 4; stroke-linecap: round;
                   transition: stroke-dashoffset .9s linear, stroke .4s; }
      #pip-btn   { margin-top: 8px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18);
                   color: #e8f4f8; border-radius: 20px; padding: 5px 16px; font-size: 12px;
                   cursor: pointer; font-family: inherit; transition: background .2s; }
      #pip-btn:hover { background: rgba(255,255,255,.18); }
    </style>`;

    _pipWin.document.body.innerHTML = `
      <svg viewBox="0 0 200 200">
        <circle class="ring-bg"   cx="100" cy="100" r="88"/>
        <circle class="ring-prog" id="prg" cx="100" cy="100" r="88"
          transform="rotate(-90 100 100)" stroke-dasharray="553" stroke-dashoffset="0"/>
      </svg>
      <div id="pip-mode">Enfoque</div>
      <div id="pip-time">25:00</div>
      <div id="pip-task"></div>
      <button id="pip-btn">▶ Iniciar</button>`;

    // Wire up the start/pause button (calls window.toggleTimer on the main page)
    _pipWin.document.getElementById('pip-btn').addEventListener('click', () => {
      window.toggleTimer();
    });

    _pipWin.addEventListener('pagehide', () => {
      cancelAnimationFrame(_rafId);
      _pipWin  = null;
      _rafId   = null;
      _updatePipBtn();
    });

    _startLoop();
    return true;
  } catch (e) {
    console.warn('[PiP] No se pudo abrir:', e);
    _pipWin = null;
    return false;
  }
}

export function closePiP() {
  if (_pipWin) {
    try { _pipWin.close(); } catch (_) {}
    _pipWin = null;
  }
  cancelAnimationFrame(_rafId);
  _rafId = null;
}

// ── Private helpers ────────────────────────────────────────────────────

function _startLoop() {
  const tick = () => {
    if (!_pipWin) return;
    _render();
    _rafId = _pipWin.requestAnimationFrame(tick);
  };
  _rafId = _pipWin.requestAnimationFrame(tick);
}

const _MODES = { focus: 'Enfoque', short: 'Pausa corta', long: 'Pausa larga' };

function _render() {
  if (!_getState || !_pipWin) return;
  const s = _getState();
  const doc = _pipWin.document;

  const mm = String(Math.floor(s.secondsLeft / 60)).padStart(2, '0');
  const ss = String(s.secondsLeft % 60).padStart(2, '0');

  const timeEl = doc.getElementById('pip-time');
  const modeEl = doc.getElementById('pip-mode');
  const taskEl = doc.getElementById('pip-task');
  const prg    = doc.getElementById('prg');
  const btn    = doc.getElementById('pip-btn');

  if (timeEl) timeEl.textContent = `${mm}:${ss}`;
  if (modeEl) modeEl.textContent = _MODES[s.mode] || s.mode;
  if (taskEl) taskEl.textContent = s.currentTaskName || '';

  const pct    = s.totalSeconds > 0 ? s.secondsLeft / s.totalSeconds : 1;
  const circum = 553; // 2 * PI * 88
  if (prg) {
    prg.style.strokeDashoffset = circum * (1 - pct);
    prg.style.stroke = s.mode === 'short' ? '#6bcf8a'
                     : s.mode === 'long'  ? '#ffa552'
                     : '#4ecdc4';
  }
  if (btn) {
    btn.textContent = s.running ? '⏸ Pausar' : (pct < 1 ? '▶ Reanudar' : '▶ Iniciar');
  }
}

// Update PiP button state in the main window (e.g., after PiP closes)
function _updatePipBtn() {
  const btn = document.getElementById('btn-pip');
  if (btn) btn.title = 'Mini ventana flotante';
}
