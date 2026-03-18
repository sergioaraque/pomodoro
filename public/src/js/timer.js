/**
 * timer.js — Lógica del temporizador Pomodoro
 *
 * Precisión: usa Date.now() como referencia en lugar de solo contar ticks.
 * Esto evita que el timer se desincronice cuando el tab está en background
 * (los navegadores throttlean setInterval en tabs inactivos).
 */

import { cfg } from './config.js';

// ─── ESTADO INTERNO ───────────────────────────────────────────────────
const state = {
  mode:            'focus',
  secondsLeft:     25 * 60,
  totalSeconds:    25 * 60,
  running:         false,
  sessionsDone:    0,
  currentTaskId:   null,
  currentTaskName: null,
};

let _interval      = null;
let _targetEndTime = null;  // Date.now() cuando debe acabar la sesión actual
let _onEndCallback = null;  // async (mode, durationMin, taskId, taskName) => void
let _onTickCallback= null;  // (state) => void

// ─── API PÚBLICA ──────────────────────────────────────────────────────

export function initTimer({ onEnd, onTick }) {
  _onEndCallback  = onEnd;
  _onTickCallback = onTick;
}

export function getState() { return { ...state }; }

export function setTask(id, name) {
  state.currentTaskId   = id;
  state.currentTaskName = name;
}

export function clearTask() {
  state.currentTaskId   = null;
  state.currentTaskName = null;
}

export function toggleTimer() {
  if (state.running) _pause();
  else               _start();
  return state.running;
}

export function resetTimer() {
  _pause();
  _applyMode(state.mode);
}

export function skipSession() {
  _pause();
  // Avanza el modo sin disparar onEnd: no guarda en DB ni cuenta el pomodoro
  _advanceMode(state.mode);
}

export function setMode(mode) {
  _pause();
  _applyMode(mode);
}

// ─── PRIVADO ──────────────────────────────────────────────────────────

function _start() {
  if (state.running) return;
  state.running = true;
  _targetEndTime = Date.now() + state.secondsLeft * 1000;
  _interval = setInterval(_tick, 500); // 500ms para mayor precisión
}

function _pause() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  // Sincronizar secondsLeft con el tiempo real antes de pausar
  if (_targetEndTime) {
    state.secondsLeft = Math.max(0, Math.ceil((_targetEndTime - Date.now()) / 1000));
    _targetEndTime = null;
  }
  state.running = false;
}

function _tick() {
  if (!_targetEndTime) return;

  const remaining = Math.ceil((_targetEndTime - Date.now()) / 1000);
  state.secondsLeft = Math.max(0, remaining);

  if (state.secondsLeft <= 0) {
    _pause();
    _handleSessionEnd();
    return;
  }

  _onTickCallback?.(getState());
}

function _advanceMode(finished) {
  if (finished === 'focus') {
    state.sessionsDone++;
    _applyMode(state.sessionsDone % cfg.sessions === 0 ? 'long' : 'short');
  } else {
    _applyMode('focus');
  }
}

function _handleSessionEnd() {
  const finishedMode = state.mode;
  const durationMin  = _durationForMode(finishedMode);
  const taskId       = state.currentTaskId;
  const taskName     = state.currentTaskName;

  _advanceMode(finishedMode);

  if (_onEndCallback) {
    _onEndCallback(finishedMode, durationMin, taskId, taskName).catch(console.error);
  }
}

function _applyMode(mode) {
  state.mode         = mode;
  state.secondsLeft  = _durationForMode(mode) * 60;
  state.totalSeconds = state.secondsLeft;
  _targetEndTime     = null;
  _onTickCallback?.(getState());
}

function _durationForMode(mode) {
  if (mode === 'focus') return cfg.focus;
  if (mode === 'short') return cfg.short;
  return cfg.long;
}

// ─── PAGE VISIBILITY ─────────────────────────────────────────────────
// Cuando el tab vuelve a estar activo, recalculamos el tiempo real
// en caso de que el browser haya throttleado el setInterval.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Auto-pausa al ocultar tab si está activada
    if (cfg.autoPause && state.running) {
      _pause();
      _onTickCallback?.(getState());
    }
    return;
  }
  if (document.visibilityState === 'visible' && state.running && _targetEndTime) {
    const remaining = Math.ceil((_targetEndTime - Date.now()) / 1000);
    state.secondsLeft = Math.max(0, remaining);

    if (state.secondsLeft <= 0) {
      _pause();
      _handleSessionEnd();
    } else {
      _onTickCallback?.(getState());
    }
  }
});
