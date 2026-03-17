/**
 * ambient.js — Motor de audio ambiental generativo.
 *
 * Gestiona el ciclo de vida del AudioContext, el master gain y los
 * fade-in / fade-out entre escenas. Las 20 escenas están en ambient-scenes.js.
 */

import { buildScene } from './ambient-scenes.js';

let _ctx    = null;
let _master = null;
let _scene  = null;
let _volume = 0.4;
let _active = false;

// ─── API pública ──────────────────────────────────────────────────────

export function initAmbient() { /* AudioContext se crea en el primer gesto */ }

export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (_master && _ctx) _master.gain.setTargetAtTime(_volume, _ctx.currentTime, 0.1);
}

export function isPlaying() { return _active; }

/** Inicia la escena de un tema. Para cambiar de tema usa switchAmbient(). */
export function startAmbient(theme) {
  _ensureContext();
  if (_active) stopAmbient();
  _active = true;
  _master = _ctx.createGain();
  _master.gain.setValueAtTime(0, _ctx.currentTime);
  _master.gain.linearRampToValueAtTime(_volume, _ctx.currentTime + 2);
  _master.connect(_ctx.destination);
  _scene = buildScene(theme, _ctx, _master);
}

/**
 * Cambia el tema con fade-out del anterior y fade-in del nuevo.
 * Evita nodos "zombie" al cambiar de tema.
 */
export function switchAmbient(newTheme) {
  if (!_active) {
    startAmbient(newTheme);
    return;
  }
  _active = false;
  if (_master && _ctx) {
    _master.gain.setTargetAtTime(0, _ctx.currentTime, 0.3);
  }
  const oldScene  = _scene;
  const oldMaster = _master;
  _scene  = null;
  _master = null;
  setTimeout(() => {
    try { oldScene?.stop(); }    catch(e) {}
    try { oldMaster?.disconnect(); } catch(e) {}
    startAmbient(newTheme);
  }, 900);
}

/** Detiene el audio con fade-out suave. */
export function stopAmbient() {
  if (!_active) return;
  _active = false;
  const scene  = _scene;
  const master = _master;
  _scene  = null;
  _master = null;
  if (master && _ctx) {
    master.gain.setTargetAtTime(0, _ctx.currentTime, 0.4);
    setTimeout(() => {
      try { scene?.stop(); }     catch(e) {}
      try { master.disconnect(); } catch(e) {}
    }, 1500);
  }
}

// ─── Privado ──────────────────────────────────────────────────────────

function _ensureContext() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
}
