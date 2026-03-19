/**
 * typing-sounds.js — Clicks de teclado durante la sesión de enfoque.
 *
 * Síntesis de 2 capas:
 *   1. Cuerpo (thud): ruido blanco → lowpass  → decay exponencial  (~20–40ms)
 *   2. Transiente (click): ruido blanco → highpass → decay ultrarrápido (~5ms)
 *
 * Variación aleatoria por pulsación: volumen ±15%, frecuencia ±15%.
 * Space bar suena más grave y profundo.
 */

import { cfg } from './config.js';

let _ctx     = null;
let _active  = false;
let _handler = null;

function _getCtx() {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

/** Genera un buffer de ruido blanco con decay exponencial. */
function _noiseBuffer(c, durationSec, decayFactor = 0.25) {
  const len  = Math.floor(c.sampleRate * durationSec);
  const buf  = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * decayFactor));
  }
  return buf;
}

function _click(key) {
  try {
    const c   = _getCtx();
    const t   = c.currentTime;
    const v   = 0.85 + Math.random() * 0.3;   // variación de volumen 0.85–1.15
    const fv  = 0.88 + Math.random() * 0.24;   // variación de frecuencia 0.88–1.12
    const isSp = key === ' ';

    // ── Capa 1: Cuerpo (thud grave) ─────────────────────────────────
    // Space: más grave (250–400 Hz), más largo y ligeramente más fuerte
    const bodyFreq = isSp ? 300 * fv : 850 * fv;   // Hz lowpass
    const bodyDur  = isSp ? 0.042    : 0.026;        // segundos
    const bodyVol  = (isSp ? 0.13    : 0.10) * v;

    const bodyBuf  = _noiseBuffer(c, bodyDur, 0.22);
    const bodySrc  = c.createBufferSource();
    bodySrc.buffer = bodyBuf;

    const bodyLp   = c.createBiquadFilter();
    bodyLp.type    = 'lowpass';
    bodyLp.frequency.value = bodyFreq;
    bodyLp.Q.value = 0.7;

    const bodyG = c.createGain();
    bodyG.gain.setValueAtTime(bodyVol, t);
    bodyG.gain.exponentialRampToValueAtTime(0.0001, t + bodyDur * 1.4);

    bodySrc.connect(bodyLp); bodyLp.connect(bodyG); bodyG.connect(c.destination);
    bodySrc.start(t); bodySrc.stop(t + bodyDur * 1.5);

    // ── Capa 2: Transiente (click agudo) ────────────────────────────
    // Highpass a 4000–6500 Hz — muy corto, da el carácter "mecánico"
    const clickFreq = (4000 + Math.random() * 2500) * fv;
    const clickDur  = 0.004 + Math.random() * 0.004;  // 4–8ms
    const clickVol  = 0.05 * v;

    const clickBuf  = _noiseBuffer(c, clickDur + 0.002, 0.35);
    const clickSrc  = c.createBufferSource();
    clickSrc.buffer = clickBuf;

    const clickHp   = c.createBiquadFilter();
    clickHp.type    = 'highpass';
    clickHp.frequency.value = clickFreq;

    const clickG = c.createGain();
    clickG.gain.setValueAtTime(clickVol, t);
    clickG.gain.exponentialRampToValueAtTime(0.0001, t + clickDur);

    clickSrc.connect(clickHp); clickHp.connect(clickG); clickG.connect(c.destination);
    clickSrc.start(t); clickSrc.stop(t + clickDur + 0.003);

  } catch (_) {}
}

const _SKIP = new Set([
  'Tab','CapsLock','Shift','Control','Alt','Meta',
  'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
  'PageUp','PageDown','Home','End','Insert','PrintScreen',
]);

export function startTypingSounds() {
  if (_active) return;
  _active  = true;
  _handler = e => {
    if (!cfg.typingSounds) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (_SKIP.has(e.key)) return;
    _click(e.key);
  };
  document.addEventListener('keydown', _handler);
}

export function stopTypingSounds() {
  if (!_active) return;
  _active = false;
  if (_handler) {
    document.removeEventListener('keydown', _handler);
    _handler = null;
  }
}
