/**
 * notifications.js — Notificaciones nativas del navegador
 *
 * Muestra una notificación del sistema cuando termina una sesión,
 * incluso si la pestaña está en segundo plano.
 */

let _permission = 'default';

const MESSAGES = {
  focus_to_short: {
    title: '🌿 ¡Pomodoro completado!',
    body:  'Tómate una pausa corta. Te la has ganado.',
    icon:  null,
  },
  focus_to_long: {
    title: '🌊 ¡Ciclo completado!',
    body:  'Pausa larga — desconecta un rato.',
    icon:  null,
  },
  break_to_focus: {
    title: '🍅 Pausa terminada',
    body:  'Es hora de volver al trabajo. ¡Ánimo!',
    icon:  null,
  },
};

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

/**
 * Muestra una notificación de fin de sesión.
 * @param {'focus'|'short'|'long'} finishedMode  — modo que acaba de terminar
 * @param {'focus'|'short'|'long'} nextMode       — modo que empieza a continuación
 * @param {string|null}            taskName
 */
export function notifySessionEnd(finishedMode, nextMode, taskName) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  // No notificar si la pestaña está visible
  if (!document.hidden) return;

  let key;
  if (finishedMode === 'focus' && nextMode === 'long')  key = 'focus_to_long';
  else if (finishedMode === 'focus')                    key = 'focus_to_short';
  else                                                  key = 'break_to_focus';

  const { title, body } = MESSAGES[key];
  const fullBody = taskName ? `${body}\nTarea: ${taskName}` : body;

  try {
    const n = new Notification(title, {
      body:    fullBody,
      icon:    '/favicon.ico',
      badge:   '/favicon.ico',
      silent:  false,
      tag:     'focusnature-timer',   // reemplaza notificaciones anteriores
      renotify: true,
    });
    // Llevar al usuario a la pestaña al hacer clic
    n.onclick = () => { window.focus(); n.close(); };
    // Auto-cerrar tras 8s
    setTimeout(() => n.close(), 8000);
  } catch { /* Notification API no disponible en este contexto */ }
}
