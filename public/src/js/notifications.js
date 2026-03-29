/**
 * notifications.js — Notificaciones nativas del navegador
 *
 * Muestra notificaciones del sistema cuando la pestaña está en segundo plano.
 */

import { t } from './i18n.js';

let _permission = 'default';

/**
 * Solicita permiso de notificaciones al usuario.
 * Debe llamarse desde un gesto del usuario (p.ej. clic en toggle).
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  _permission = await Notification.requestPermission();
  return _permission;
}

/** @returns {'granted'|'denied'|'default'|'unsupported'} */
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function _fire(title, body, tag = 'focusnature-timer') {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body, icon: '/favicon.ico', badge: '/favicon.ico',
      silent: false, tag, renotify: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(() => n.close(), 8000);
  } catch { /* Notification API no disponible en este contexto */ }
}

/**
 * Muestra una notificación de fin de sesión.
 * @param {'focus'|'short'|'long'} finishedMode — modo que acaba de terminar
 * @param {'focus'|'short'|'long'} nextMode     — modo que empieza
 * @param {string|null}            taskName
 */
export function notifySessionEnd(finishedMode, nextMode, taskName) {
  if (!document.hidden) return;

  let title, body;
  if (finishedMode === 'focus' && nextMode === 'long') {
    title = t('notif_cycle_done');
    body  = t('notif_long_break_body');
  } else if (finishedMode === 'focus') {
    title = `🌿 ${t('notif_focus_done')}`;
    body  = t('notif_take_break');
  } else {
    title = `🍅 ${t('notif_break_done')}`;
    body  = t('notif_back_to_work');
  }

  if (taskName) body += `\n${taskName}`;
  _fire(title, body);
}

/**
 * Notificación de logro desbloqueado (solo si pestaña oculta).
 * @param {{ icon: string, nameKey?: string, name: string }} a — objeto logro
 */
export function notifyAchievement(a) {
  if (!document.hidden) return;
  const name = a.nameKey ? t(a.nameKey) : a.name;
  _fire(t('notif_achievement_title'), `${a.icon} ${name}`, 'focusnature-achievement');
}

/** Notificación de objetivo diario cumplido (solo si pestaña oculta). */
export function notifyDailyGoal() {
  if (!document.hidden) return;
  _fire(t('notif_daily_goal_title'), t('notif_daily_goal_body'), 'focusnature-goal');
}

/** Notificación de racha en riesgo (solo si pestaña oculta). */
export function notifyStreakRisk() {
  if (!document.hidden) return;
  _fire(t('notif_streak_risk_title'), t('notif_streak_risk_body'), 'focusnature-streak');
}
