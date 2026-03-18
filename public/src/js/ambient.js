/**
 * ambient.js — Motor de audio ambiental generativo.
 *
 * Soporta escena única (por tema) o un mix de hasta 3 escenas simultáneas
 * con volumen individual por escena. Las 20 escenas están en ambient-scenes.js.
 */

import { buildScene } from './ambient-scenes.js';

let _ctx    = null;
let _master = null;
let _scenes = [];   // array de { theme, scene, gain }
let _volume = 0.4;
let _active = false;

// ─── API pública ──────────────────────────────────────────────────────

export function initAmbient() { /* AudioContext se crea en el primer gesto */ }

export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (_master && _ctx) _master.gain.setTargetAtTime(_volume, _ctx.currentTime, 0.1);
}

export function isPlaying() { return _active; }

/** Backward-compat: inicia una única escena de tema. */
export function startAmbient(theme) {
  startMix({ [theme]: 1.0 });
}

/** Inicia un mix de escenas. mixObj = { theme: relativeVol, ... } */
export function startMix(mixObj) {
  _ensureContext();
  if (_active) _stopAll();
  _master = _ctx.createGain();
  _master.gain.setValueAtTime(0, _ctx.currentTime);
  _master.gain.linearRampToValueAtTime(_volume, _ctx.currentTime + 2);
  _master.connect(_ctx.destination);
  _active = true;
  _scenes = Object.entries(mixObj)
    .filter(([, vol]) => vol > 0)
    .map(([theme, vol]) => {
      const gain = _ctx.createGain();
      gain.gain.setValueAtTime(vol, _ctx.currentTime);
      gain.connect(_master);
      const scene = buildScene(theme, _ctx, gain);
      return { theme, scene, gain };
    });
}

/** Ajusta el volumen de una escena individual dentro del mix activo. */
export function setSceneVolume(theme, vol) {
  const entry = _scenes.find(s => s.theme === theme);
  if (entry && _ctx) entry.gain.gain.setTargetAtTime(vol, _ctx.currentTime, 0.1);
}

/**
 * Cambia el tema con fade. Si hay un mix de varias escenas activo,
 * el cambio de tema NO modifica el mix (el usuario lo controla).
 */
export function switchAmbient(newTheme) {
  if (_scenes.length > 1) return;   // mix activo: el tema no lo controla
  if (!_active) { startAmbient(newTheme); return; }
  switchMix({ [newTheme]: 1.0 });
}

/** Cambia el mix completo con fade-out del anterior y fade-in del nuevo. */
export function switchMix(newMixObj) {
  if (!_active) { startMix(newMixObj); return; }
  _active = false;
  if (_master && _ctx) _master.gain.setTargetAtTime(0, _ctx.currentTime, 0.3);
  const oldScenes = _scenes;
  const oldMaster = _master;
  _scenes = []; _master = null;
  setTimeout(() => {
    oldScenes.forEach(s => {
      try { s.scene.stop(); }    catch(e) {}
      try { s.gain.disconnect(); } catch(e) {}
    });
    try { oldMaster?.disconnect(); } catch(e) {}
    startMix(newMixObj);
  }, 900);
}

/** Detiene todo el audio con fade-out suave. */
export function stopAmbient() {
  if (!_active) return;
  _active = false;
  const scenes = _scenes;
  const master = _master;
  _scenes = []; _master = null;
  if (master && _ctx) {
    master.gain.setTargetAtTime(0, _ctx.currentTime, 0.4);
    setTimeout(() => {
      scenes.forEach(s => {
        try { s.scene.stop(); }    catch(e) {}
        try { s.gain.disconnect(); } catch(e) {}
      });
      try { master.disconnect(); } catch(e) {}
    }, 1500);
  }
}

// ─── Privado ──────────────────────────────────────────────────────────

function _stopAll() {
  _active = false;
  _scenes.forEach(s => {
    try { s.scene.stop(); }    catch(e) {}
    try { s.gain.disconnect(); } catch(e) {}
  });
  if (_master) { try { _master.disconnect(); } catch(e) {} }
  _scenes = []; _master = null;
}

function _ensureContext() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
}
