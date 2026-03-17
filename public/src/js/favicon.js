/**
 * favicon.js — Dynamic favicon showing remaining time and progress ring.
 */

let _canvas = null;
let _ctx    = null;
let _link   = null;
let _orig   = null; // original favicon href

function _init() {
  if (_canvas) return;
  _canvas = document.createElement('canvas');
  _canvas.width  = 32;
  _canvas.height = 32;
  _ctx = _canvas.getContext('2d');

  _link = document.querySelector("link[rel*='icon']");
  if (!_link) {
    _link = document.createElement('link');
    _link.rel = 'icon';
    document.head.appendChild(_link);
  }
  _orig = _link.href;
}

/**
 * Update the favicon with the current timer state.
 * @param {number} secondsLeft
 * @param {number} totalSeconds
 * @param {string} mode  'focus' | 'short' | 'long'
 * @param {boolean} running
 */
export function updateFavicon(secondsLeft, totalSeconds, mode, running) {
  _init();
  const ctx = _ctx;
  ctx.clearRect(0, 0, 32, 32);

  const pct    = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const color  = mode === 'focus' ? '#4ecdc4'
               : mode === 'short' ? '#6bcf8a'
               : '#ffa552';
  const dim    = !running;

  // Dark background circle
  ctx.beginPath();
  ctx.arc(16, 16, 15, 0, Math.PI * 2);
  ctx.fillStyle = dim ? 'rgba(7,16,32,0.85)' : '#071020';
  ctx.fill();

  // Progress arc (clockwise from top)
  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(16, 16, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = dim ? color + '88' : color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Remaining minutes text
  const mins = Math.ceil(secondsLeft / 60);
  const txt  = mins < 100 ? String(mins) : '∞';
  ctx.fillStyle = dim ? 'rgba(255,255,255,0.5)' : '#ffffff';
  ctx.font      = txt.length > 1 ? 'bold 12px sans-serif' : 'bold 14px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, 16, 16.5);

  _link.href = _canvas.toDataURL('image/png');
}

/** Restore the original favicon. */
export function resetFavicon() {
  if (_link && _orig) _link.href = _orig;
}
