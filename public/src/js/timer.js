/**
 * timer.js — Lógica del temporizador Pomodoro
 *
 * BUG CORREGIDO: el antiguo onEnd() era async y se llamaba desde tick()
 * sin await, lo que causaba que el modo cambiara antes de que terminara
 * el guardado en Supabase, generando sesiones duplicadas o estados
 * inconsistentes. Ahora el tick detiene el intervalo inmediatamente y
 * delega toda la transición a onSessionComplete(), que es la única
 * función que puede cambiar el modo.
 */

import { cfg } from './config.js';

// ─── ESTADO INTERNO ───────────────────────────────────────────────────
const state = {
  mode:         'focus',   // 'focus' | 'short' | 'long'
  secondsLeft:  25 * 60,
  totalSeconds: 25 * 60,
  running:      false,
  sessionsDone: 0,
  currentTaskId:   null,
  currentTaskName: null,
};

let _interval       = null;
let _onEndCallback  = null;   // async (mode, durationMin, taskId, taskName) => void
let _onTickCallback = null;   // (state) => void

// ─── API PÚBLICA ──────────────────────────────────────────────────────

/**
 * Registra los callbacks externos.
 * @param {{ onEnd: Function, onTick: Function }} callbacks
 */
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

/** Inicia o pausa el temporizador. Devuelve el nuevo estado running. */
export function toggleTimer() {
  if (state.running) {
    _pause();
  } else {
    _start();
  }
  return state.running;
}

export function resetTimer() {
  _pause();
  _applyMode(state.mode);
}

/** Salta al siguiente modo sin esperar a que acabe el tiempo. */
export function skipSession() {
  _pause();
  // Tratamos el skip igual que un fin natural
  _handleSessionEnd();
}

/**
 * Cambia el modo manualmente (p.ej. desde ajustes).
 * @param {'focus'|'short'|'long'} mode
 */
export function setMode(mode) {
  _pause();
  _applyMode(mode);
}

// ─── PRIVADO ──────────────────────────────────────────────────────────

function _start() {
  if (state.running) return;
  state.running = true;
  _interval = setInterval(_tick, 1000);
}

function _pause() {
  clearInterval(_interval);
  _interval     = null;
  state.running = false;
}

function _tick() {
  if (state.secondsLeft <= 0) {
    // 1. Detener el intervalo ANTES de cualquier async
    _pause();
    // 2. Manejar el fin de sesión (guarda, cambia modo, notifica UI)
    _handleSessionEnd();
    return;
  }
  state.secondsLeft--;
  _onTickCallback?.(getState());
}

/**
 * Punto único de transición entre modos.
 * Se ejecuta de forma síncrona para la UI y lanza el guardado
 * en Supabase en background sin bloquear el siguiente ciclo.
 */
function _handleSessionEnd() {
  const finishedMode  = state.mode;
  const durationMin   = _durationForMode(finishedMode);
  const taskId        = state.currentTaskId;
  const taskName      = state.currentTaskName;

  // Determinar el siguiente modo ANTES de llamar al callback
  let nextMode;
  if (finishedMode === 'focus') {
    state.sessionsDone++;
    const longBreakEvery = cfg.sessions;
    nextMode = (state.sessionsDone % longBreakEvery === 0) ? 'long' : 'short';
  } else {
    // Cualquier pausa siempre vuelve a enfoque
    nextMode = 'focus';
  }

  // Cambiar el modo en el estado INMEDIATAMENTE (síncrono → UI responde al instante)
  _applyMode(nextMode);

  // Notificar a la capa de presentación (reproduce sonido, actualiza badge, etc.)
  // El callback puede ser async; lo lanzamos sin await para no bloquear
  if (_onEndCallback) {
    _onEndCallback(finishedMode, durationMin, taskId, taskName).catch(console.error);
  }
}

function _applyMode(mode) {
  state.mode        = mode;
  state.secondsLeft = _durationForMode(mode) * 60;
  state.totalSeconds = state.secondsLeft;
  _onTickCallback?.(getState());
}

function _durationForMode(mode) {
  if (mode === 'focus') return cfg.focus;
  if (mode === 'short') return cfg.short;
  return cfg.long;
}
