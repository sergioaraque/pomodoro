/**
 * auth.js — Autenticación, sesión y formularios de login/registro.
 */

import { cfg }                                       from './config.js';
import { state }                                     from './state.js';
import * as db                                       from './db.js';
import * as ui                                       from './ui.js';
import { stopAmbient, startAmbient }                 from './ambient.js';
import { setLang, applyToDOM, getLang }              from './i18n.js';
import { getNotificationPermission,
         requestNotificationPermission }              from './notifications.js';
import { spawnCreatures, drawStars }                 from './creatures.js';
import { getState, setMode }                         from './timer.js';
import { loadSettings, applyTheme }                  from './settings-handler.js';
import { loadTasks }                                 from './tasks-handler.js';
import { loadTodayCount }                            from './stats-handler.js';

// ── handleLogin ────────────────────────────────────────────────────────
export async function handleLogin(user) {
  try {
    state.user = user;
    ui.showApp(user);
    ui.resetUI();

    await new Promise(resolve => setTimeout(resolve, 50));

    await Promise.allSettled([
      loadSettings().catch(e => { console.warn('[auth] Settings:', e); return null; }),
      loadTasks().catch(e => { console.warn('[auth] Tasks:', e); }),
      loadTodayCount().catch(e => { console.warn('[auth] Today count:', e); }),
    ]);

    spawnCreatures(state.theme);
    drawStars();
    ui.renderTimer(getState());
    ui.renderSessionDots(getState().sessionsDone);
    ui.renderDailyGoalRing(state.todayCount, cfg.dailyGoal);
    ui.setStartButtonText('Iniciar');
    applyToDOM();

    const curLang = getLang();
    document.querySelectorAll('.lang-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.lang === curLang)
    );

    _updateNotifToggle(getNotificationPermission());
    _showWelcomeMessage(user.email);
  } catch (err) {
    console.error('[auth] Login error:', err);
    ui.showAuthError('Error al cargar la aplicación. Por favor, recarga la página.');
  }
}

export function handleLogout() {
  stopAmbient();
  state.user        = null;
  state.tasks       = [];
  state.activeTaskId = null;
  state.todayCount  = 0;
  ui.hideApp();
  applyTheme('ocean', false);
}

// ── Window functions ───────────────────────────────────────────────────

window.doLogout = async () => {
  if (state.todayCount > 0) {
    const mins = state.todayCount * cfg.focus;
    const hrs  = (mins / 60).toFixed(1);
    const goal = state.todayCount >= cfg.dailyGoal
      ? `🎯 ¡Objetivo del día conseguido! (${state.todayCount}/${cfg.dailyGoal})`
      : `🎯 ${state.todayCount} de ${cfg.dailyGoal} del objetivo diario`;
    const msg = `📊 Resumen del día\n\n🍅 Pomodoros: ${state.todayCount}\n⏱ Tiempo enfocado: ~${hrs}h\n${goal}\n\n¿Confirmas que quieres salir?`;
    if (!confirm(msg)) return;
  }
  try {
    stopAmbient();
    await db.auth.signOut();
    db.auth.broadcast('SIGNED_OUT');

    state.user         = null;
    state.tasks        = [];
    state.activeTaskId = null;
    state.todayCount   = 0;

    const guestCfg = localStorage.getItem('fn_guest_cfg');
    localStorage.clear();
    if (guestCfg) localStorage.setItem('fn_guest_cfg', guestCfg);
    sessionStorage.clear();

    window.location.replace('/');
  } catch (e) {
    console.warn('[auth] Logout error:', e);
    window.location.replace('/');
  }
};

window.doLogin = async () => {
  const email = document.getElementById('li-email').value.trim();
  const pass  = document.getElementById('li-pass').value;
  if (!email || !pass) return ui.showAuthError('Rellena todos los campos.');

  ui.setAuthButtonLoading('li-btn', true, 'Entrar');
  const { data, error } = await db.auth.signIn(email, pass);
  ui.setAuthButtonLoading('li-btn', false, 'Entrar');

  if (error) {
    ui.showAuthError(
      error?.message?.includes('Invalid') || error?.message?.includes('credentials')
        ? 'Correo o contraseña incorrectos.'
        : (error?.message || 'Error desconocido')
    );
  } else {
    await handleLogin(data.user);
  }
};

window.doRegister = async () => {
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  if (!email || !pass) return ui.showAuthError('Rellena todos los campos.');
  if (pass.length < 6) return ui.showAuthError('La contraseña debe tener al menos 6 caracteres.');

  ui.setAuthButtonLoading('reg-btn', true, 'Crear cuenta');
  const { error } = await db.auth.signUp(email, pass);
  if (error) {
    ui.setAuthButtonLoading('reg-btn', false, 'Crear cuenta');
    ui.showAuthError(error.message);
    return;
  }
  // Auto-login after registration
  const { data, error: loginErr } = await db.auth.signIn(email, pass);
  ui.setAuthButtonLoading('reg-btn', false, 'Crear cuenta');
  if (loginErr) {
    ui.showAuthSuccess('¡Cuenta creada! Inicia sesión para continuar.');
  } else {
    await handleLogin(data.user);
  }
};

window.doResetPassword = async () => {
  const email = (document.getElementById('reset-email')?.value || '').trim();
  if (!email) return ui.showAuthError('Introduce tu correo electrónico.');

  ui.setAuthButtonLoading('reset-btn', true, 'Enviar enlace');
  const { error } = await db.auth.resetPassword(email, window.location.origin + '/app');
  ui.setAuthButtonLoading('reset-btn', false, 'Enviar enlace');

  if (error) ui.showAuthError(error.message);
  else       ui.showAuthSuccess('¡Listo! Revisa tu correo para restablecer tu contraseña.');
};

window.doChangePassword = async () => {
  const oldPass  = (document.getElementById('cp-old')?.value  || '');
  const newPass  = (document.getElementById('cp-new')?.value  || '').trim();
  const confPass = (document.getElementById('cp-conf')?.value || '').trim();
  if (!oldPass)                  return _cpMsg('Introduce tu contraseña actual.', 'err');
  if (!newPass || !confPass)     return _cpMsg('Rellena los dos campos.', 'err');
  if (newPass.length < 6)        return _cpMsg('Mínimo 6 caracteres.', 'err');
  if (newPass !== confPass)      return _cpMsg('Las contraseñas no coinciden.', 'err');

  const btn = document.getElementById('cp-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }
  const { error } = await db.auth.updatePassword(newPass, oldPass);
  if (btn) { btn.disabled = false; btn.textContent = 'Cambiar contraseña'; }

  if (error) _cpMsg(error.message, 'err');
  else {
    _cpMsg('¡Contraseña actualizada!', 'ok');
    ['cp-old','cp-new','cp-conf'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
};

window.showAuthTab = (tab) => {
  ui.clearAuthMessages();
  const tabs     = document.getElementById('auth-tabs');
  const btnLogin = document.getElementById('at-login');
  const btnReg   = document.getElementById('at-register');
  const forms    = {
    login:    document.getElementById('auth-login-form'),
    register: document.getElementById('auth-register-form'),
    reset:    document.getElementById('auth-reset-form'),
    newpass:  document.getElementById('auth-newpass-form'),
  };
  const hideTabs = tab === 'reset' || tab === 'newpass';
  if (tabs)     tabs.style.display = hideTabs ? 'none' : '';
  if (btnLogin) btnLogin.classList.toggle('active', tab === 'login');
  if (btnReg)   btnReg.classList.toggle('active',   tab === 'register');
  Object.entries(forms).forEach(([key, el]) => {
    if (el) el.style.display = key === tab ? 'block' : 'none';
  });
};

window.doSetNewPassword = async () => {
  const newPass  = (document.getElementById('np-new')?.value  || '').trim();
  const confPass = (document.getElementById('np-conf')?.value || '').trim();
  const msgEl    = document.getElementById('np-msg');
  const showMsg  = (txt, type) => {
    if (!msgEl) return;
    msgEl.textContent   = txt;
    msgEl.className     = 'cp-msg ' + type;
    msgEl.style.display = 'block';
    setTimeout(() => { msgEl.style.display = 'none'; }, 5000);
  };
  if (!newPass || !confPass) return showMsg('Rellena los dos campos.', 'err');
  if (newPass.length < 6)    return showMsg('Mínimo 6 caracteres.', 'err');
  if (newPass !== confPass)  return showMsg('Las contraseñas no coinciden.', 'err');

  const userId = window.__RECOVERY_USER_ID__;
  const secret = window.__RECOVERY_SECRET__;
  if (!userId || !secret) return showMsg('Enlace de recuperación inválido o expirado.', 'err');

  const btn = document.getElementById('np-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }
  const { error } = await db.auth.updateRecovery(userId, secret, newPass);
  if (btn) { btn.disabled = false; btn.textContent = 'Guardar contraseña'; }

  if (error) {
    showMsg(error.message, 'err');
  } else {
    showMsg('¡Contraseña actualizada! Redirigiendo…', 'ok');
    setTimeout(() => window.location.replace('/'), 2000);
  }
};

window.checkPasswordStrength = (val) => {
  let score = 0;
  if (val.length >= 6)           score++;
  if (val.length >= 10)          score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w: '0%',   c: 'transparent', t: '' },
    { w: '20%',  c: '#ff6b6b',     t: 'Muy débil'  },
    { w: '40%',  c: '#ffa552',     t: 'Débil'      },
    { w: '60%',  c: '#ffd54f',     t: 'Aceptable'  },
    { w: '80%',  c: '#7ecf3e',     t: 'Fuerte'     },
    { w: '100%', c: '#4ecdc4',     t: 'Muy fuerte' },
  ];
  const lvl = levels[Math.min(score, 5)];
  // Aplica a todas las barras de contraseña presentes (registro y recovery)
  ['pw-bar', 'pw-bar2'].forEach(id => {
    const bar = document.getElementById(id);
    if (bar) { bar.style.width = lvl.w; bar.style.background = lvl.c; }
  });
  ['pw-hint', 'pw-hint2'].forEach(id => {
    const hint = document.getElementById(id);
    if (hint) { hint.textContent = lvl.t; hint.style.color = lvl.c; }
  });
};

window.toggleNotifications = async () => {
  const perm = getNotificationPermission();
  if (perm === 'granted') {
    alert('Para desactivar las notificaciones, usa la configuración de tu navegador.');
    return;
  }
  const result = await requestNotificationPermission();
  _updateNotifToggle(result);
};

// ── Privados ───────────────────────────────────────────────────────────

function _showWelcomeMessage(email) {
  const hour = new Date().getHours();
  const msg  = hour < 12 ? '¡Buenos días!' : hour < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';
  const banner = document.getElementById('break-banner');
  if (!banner) return;
  const userName = email.split('@')[0];
  const textNode = document.createTextNode(`${msg} Bienvenido/a de nuevo, ${userName}`);
  banner.innerHTML = '';
  banner.appendChild(textNode);
  banner.className = 'break-banner visible';
  setTimeout(() => banner.classList.remove('visible'), 4000);
}

function _updateNotifToggle(perm) {
  const sw = document.getElementById('sw-notifications');
  if (sw) sw.className = 'sw' + (perm === 'granted' ? ' on' : '');
}

function _cpMsg(msg, type) {
  const el = document.getElementById('cp-msg');
  if (!el) return;
  el.textContent   = msg;
  el.className     = 'cp-msg ' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
