/**
 * settings-handler.js — Configuración, temas y ajustes del usuario.
 *
 * Exporta: loadSettings, saveSettings, debounceSave, applyTheme,
 *          saveToLocalStorage, PRESETS, THEME_META, LIMITS
 */

import { cfg }                          from './config.js';
import { state }                        from './state.js';
import * as db                          from './db.js';
import * as ui                          from './ui.js';
import { startAmbient, stopAmbient, startMix,
         switchAmbient, switchMix,
         setSceneVolume, setVolume }    from './ambient.js';
import { setLang, getLang, applyToDOM } from './i18n.js';
import { setMode, getState }            from './timer.js';
import { previewSound }                 from './sound.js';
import { spawnCreatures }               from './creatures.js';

// ── Constantes ────────────────────────────────────────────────────────

export const LIMITS = {
  focus:     [5,  90],
  short:     [1,  30],
  long:      [5,  60],
  sessions:  [2,   8],
  dailyGoal: [1,  20],
};

export const PRESETS = {
  standard:  { name: 'Estándar',      focus: 25, short:  5, long: 15, sessions: 4 },
  deep:      { name: 'Foco profundo', focus: 50, short: 10, long: 20, sessions: 3 },
  sprint:    { name: 'Sprint',        focus: 15, short:  3, long: 10, sessions: 6 },
  ultralong: { name: 'Ultra largo',   focus: 90, short: 15, long: 30, sessions: 2 },
};

export const THEME_META = {
  ocean:      { emoji: '🌊', name: 'Mar'         },
  meadow:     { emoji: '🌿', name: 'Prado'       },
  mountain:   { emoji: '🏔️', name: 'Montaña'     },
  forest:     { emoji: '🌲', name: 'Bosque'      },
  desert:     { emoji: '🏜️', name: 'Desierto'    },
  city:       { emoji: '🌃', name: 'Ciudad'      },
  arctic:     { emoji: '❄️', name: 'Ártico'      },
  space:      { emoji: '🚀', name: 'Espacio'     },
  deep:       { emoji: '🌑', name: 'Abisal'      },
  volcano:    { emoji: '🌋', name: 'Volcán'      },
  rain:       { emoji: '🌧️', name: 'Lluvia'      },
  japan:      { emoji: '🏯', name: 'Japón'       },
  swamp:      { emoji: '🌿', name: 'Ciénaga'     },
  cave:       { emoji: '🐉', name: 'Cueva'       },
  underarctic:{ emoji: '🐋', name: 'Ártico sub.' },
  savanna:    { emoji: '🌅', name: 'Sabana'      },
  alps:       { emoji: '🏔', name: 'Alpes'       },
  festival:   { emoji: '🎆', name: 'Festival'    },
  jungle:     { emoji: '🌺', name: 'Selva'       },
  mars:       { emoji: '🔭', name: 'Marte'       },
  sakura:     { emoji: '🌸', name: 'Sakura'      },
  sunset:     { emoji: '🌇', name: 'Atardecer'   },
  lofi:       { emoji: '📻', name: 'Lofi'        },
  highway:    { emoji: '🛣️', name: 'Autopista'   },
};

// ── loadSettings ──────────────────────────────────────────────────────

export async function loadSettings() {
  const { data } = await db.settings.load(state.user.id);
  if (data) {
    cfg.focus       = data.focus_min;
    cfg.short       = data.short_min;
    cfg.long        = data.long_min;
    cfg.sessions    = data.sessions;
    cfg.sound       = data.sound;
    cfg.dailyGoal   = data.daily_goal   ?? 8;
    cfg.ambient     = data.ambient      ?? false;
    cfg.ambientVol  = data.ambient_vol  ?? 0.4;
    cfg.deepFocus   = data.deep_focus   ?? false;
    cfg.autoBreak   = data.auto_break   ?? false;
    cfg.soundStyle  = data.sound_style  ?? 'bells';
    cfg.autoTheme   = data.auto_theme   ?? false;
    cfg.presetName  = data.preset_name  ?? '';
    // autoPause y autoAmbient no tienen columna en DB — se recuperan del backup local
    try {
      const bak = JSON.parse(localStorage.getItem('fn_backup_settings_' + state.user.id) || '{}');
      if (bak.autoPause  !== undefined) cfg.autoPause  = bak.autoPause;
      if (bak.autoAmbient  !== undefined) cfg.autoAmbient  = bak.autoAmbient;
      if (bak.typingSounds !== undefined) cfg.typingSounds = bak.typingSounds;
    } catch (_) {}
    _loadLabels(state.user.id);

    if (data.lang) setLang(data.lang);
    applyTheme(data.theme || 'ocean', false);
    if (cfg.ambient) {
      const mixKeys = Object.keys(cfg.ambientMix || {});
      if (mixKeys.length > 0) startMix(cfg.ambientMix);
      else if (cfg.autoAmbient) applyAutoAmbient();
      else startAmbient(state.theme);
    }
    setVolume(cfg.ambientVol);

    const el = document.getElementById('quick-notes-area');
    if (el && data.quick_notes) el.value = data.quick_notes;

    // Restaurar URL de YouTube guardada
    try {
      const ytUrl = localStorage.getItem('fn_yt_url_' + state.user.id);
      const ytInp = document.getElementById('yt-url-inp');
      if (ytInp && ytUrl) ytInp.value = ytUrl;
    } catch (_) {}
  } else {
    // Sin datos de DB — restaurar desde backup local para no quedarse con defaults
    try {
      const bak = JSON.parse(localStorage.getItem('fn_backup_settings_' + state.user.id) || 'null');
      if (bak) {
        if (bak.focus        != null) cfg.focus        = bak.focus;
        if (bak.short        != null) cfg.short        = bak.short;
        if (bak.long         != null) cfg.long         = bak.long;
        if (bak.sessions     != null) cfg.sessions     = bak.sessions;
        if (bak.sound        != null) cfg.sound        = bak.sound;
        if (bak.soundStyle)           cfg.soundStyle   = bak.soundStyle;
        if (bak.dailyGoal    != null) cfg.dailyGoal    = bak.dailyGoal;
        if (bak.ambient      != null) cfg.ambient      = bak.ambient;
        if (bak.ambientVol   != null) cfg.ambientVol   = bak.ambientVol;
        if (bak.deepFocus    != null) cfg.deepFocus    = bak.deepFocus;
        if (bak.autoBreak    != null) cfg.autoBreak    = bak.autoBreak;
        if (bak.autoTheme    != null) cfg.autoTheme    = bak.autoTheme;
        if (bak.autoPause    != null) cfg.autoPause    = bak.autoPause;
        if (bak.presetName)           cfg.presetName   = bak.presetName;
        if (bak.ambientMix   != null) cfg.ambientMix   = bak.ambientMix;
        if (bak.autoAmbient  != null) cfg.autoAmbient  = bak.autoAmbient;
        if (bak.typingSounds != null) cfg.typingSounds = bak.typingSounds;
        console.info('[settings] Restaurado desde backup local');
        if (cfg.ambient) {
          const mixKeys = Object.keys(cfg.ambientMix || {});
          if (mixKeys.length > 0) startMix(cfg.ambientMix);
          else startAmbient(state.theme);
        }
        setVolume(cfg.ambientVol);
      }
    } catch (_) {}
    _loadLabels(state.user.id);
    // Crear el documento de settings en DB con los valores actuales (primer login)
    saveSettings().catch(() => {});
  }
  setMode('focus');
  ui.renderSettings();
  ui.renderSessionDots(getState().sessionsDone);
  return data;
}

// ── saveSettings ──────────────────────────────────────────────────────

function _clearDirty() {
  const btn = document.getElementById('btn-save-settings');
  if (btn) btn.classList.remove('settings-dirty');
}

export async function saveSettings() {
  if (!state.user) return { error: null };
  ui.setSyncState('syncing');
  const { error } = await db.settings.save(state.user.id, {
    focus_min:    cfg.focus,
    short_min:    cfg.short,
    long_min:     cfg.long,
    sessions:     cfg.sessions,
    sound:        cfg.sound,
    theme:        state.theme,
    daily_goal:   cfg.dailyGoal,
    ambient:      cfg.ambient,
    ambient_vol:  cfg.ambientVol,
    deep_focus:   cfg.deepFocus,
    auto_break:   cfg.autoBreak,
    sound_style:  cfg.soundStyle,
    auto_theme:   cfg.autoTheme,
    preset_name:  cfg.presetName,
    lang:         getLang(),
    quick_notes:  document.getElementById('quick-notes-area')?.value || '',
  });
  ui.setSyncState(error ? 'error' : 'ok');
  if (!error) _clearDirty();
  return { error };
}

export function debounceSave() {
  const btn = document.getElementById('btn-save-settings');
  if (btn) btn.classList.add('settings-dirty');
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(saveSettings, 700);
}

export function saveToLocalStorage() {
  if (!state.user) return;
  try {
    localStorage.setItem('fn_backup_settings_' + state.user.id, JSON.stringify(cfg));
  } catch (_) {}
}

// ── applyTheme ────────────────────────────────────────────────────────

export function applyTheme(name, persist = true) {
  state.theme = name;
  ui.applyTheme(name);
  _updateThemePill(name);
  if (state.user) spawnCreatures(name);
  if (cfg.ambient && state.user) switchAmbient(name);
  if (persist && state.user) debounceSave();
}

// ── Privados ──────────────────────────────────────────────────────────

function _updateThemePill(name) {
  const meta = THEME_META[name];
  if (!meta) return;
  const emojiEl = document.getElementById('theme-pill-emoji');
  const labelEl = document.getElementById('theme-pill-name');
  if (emojiEl) emojiEl.textContent = meta.emoji;
  if (labelEl) labelEl.textContent = meta.name;
  document.querySelectorAll('.tpick').forEach(b => b.classList.remove('active'));
  const active = document.getElementById('tbtn-' + name);
  if (active) active.classList.add('active');
}

function _applyAutoTheme() {
  const h = new Date().getHours();
  let theme;
  if      (h >= 6  && h < 9)  theme = 'meadow';
  else if (h >= 9  && h < 14) theme = 'mountain';
  else if (h >= 14 && h < 17) theme = 'ocean';
  else if (h >= 17 && h < 20) theme = 'savanna';
  else if (h >= 20 && h < 23) theme = 'forest';
  else                         theme = 'space';
  applyTheme(theme, false);
}

// Escenas ambientales por franja horaria (independiente del tema visual)
const _AMBIENT_SCENES_BY_HOUR = [
  [6,  9,  'meadow'],    // mañana — pájaros, brisa
  [9,  14, 'mountain'],  // mañana-tarde — viento sereno
  [14, 17, 'ocean'],     // tarde — olas
  [17, 20, 'rain'],      // atardecer — lluvia suave
  [20, 23, 'forest'],    // noche — bosque nocturno
];

export function applyAutoAmbient() {
  if (!cfg.autoAmbient || !cfg.ambient) return;
  if (Object.keys(cfg.ambientMix || {}).length > 0) return; // mix manual activo
  const h = new Date().getHours();
  const entry = _AMBIENT_SCENES_BY_HOUR.find(([s, e]) => h >= s && h < e);
  const scene = entry ? entry[2] : 'space';
  switchAmbient(scene);
}

// Comprobación cada minuto: actualizar tema y/o escena si cambia la hora
setInterval(() => {
  if (!state.user) return;
  if (cfg.autoTheme)   _applyAutoTheme();
  if (cfg.autoAmbient) applyAutoAmbient();
}, 60_000);

function _updateSoundBtns(style) {
  document.querySelectorAll('.sound-style-btn').forEach(b => b.classList.remove('active'));
  const active = document.getElementById('ss-' + style);
  if (active) active.classList.add('active');
}

function _enterDeepFocus() {
  document.body.classList.add('deep-focus');
  ui.showDeepFocusOverlay(() => {
    cfg.deepFocus = false;
    _exitDeepFocus();
    ui.renderSettings();
    debounceSave();
    saveToLocalStorage();
  });
}

function _exitDeepFocus() {
  document.body.classList.remove('deep-focus');
  ui.hideDeepFocusOverlay();
}

// ── Window handlers ────────────────────────────────────────────────────

window.adjSetting = (key, delta) => {
  const [min, max] = LIMITS[key];
  cfg[key] = Math.max(min, Math.min(max, cfg[key] + delta));
  ui.renderSettings();
  if (key !== 'dailyGoal') setMode(getState().mode);
  ui.renderSessionDots(getState().sessionsDone);
  ui.renderDailyGoalRing(state.todayCount, cfg.dailyGoal);
  debounceSave();
  saveToLocalStorage();
};

window.toggleSound = () => {
  cfg.sound = !cfg.sound;
  ui.renderSettings();
  debounceSave();
  saveToLocalStorage();
};

window.setSoundStyle = (style) => {
  cfg.soundStyle = style;
  ui.renderSettings();
  _updateSoundBtns(style);
  debounceSave();
  saveToLocalStorage();
  previewSound(style, state.theme);
};

window.toggleAmbient = () => {
  cfg.ambient = !cfg.ambient;
  if (cfg.ambient) {
    const mixKeys = Object.keys(cfg.ambientMix || {});
    if (mixKeys.length > 0) startMix(cfg.ambientMix);
    else startAmbient(state.theme);
  } else {
    stopAmbient();
  }
  ui.renderSettings();
  debounceSave();
  saveToLocalStorage();
};

window.setAmbientVolume = (v) => {
  cfg.ambientVol = parseFloat(v);
  setVolume(cfg.ambientVol);
  debounceSave();
  saveToLocalStorage();
};

window.toggleAutoTheme = () => {
  cfg.autoTheme = !cfg.autoTheme;
  if (cfg.autoTheme) _applyAutoTheme();
  ui.renderSettings();
  debounceSave();
  saveToLocalStorage();
};

window.toggleAutoAmbient = () => {
  cfg.autoAmbient = !cfg.autoAmbient;
  if (cfg.autoAmbient) applyAutoAmbient();
  ui.renderSettings();
  saveToLocalStorage();
};

window.toggleAutoBreak = () => {
  cfg.autoBreak = !cfg.autoBreak;
  ui.renderSettings();
  debounceSave();
  saveToLocalStorage();
};

window.toggleAutoPause = () => {
  cfg.autoPause = !cfg.autoPause;
  ui.renderSettings();
  saveToLocalStorage();
};

window.toggleFullscreen = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else                              document.exitFullscreen();
};

document.addEventListener('fullscreenchange', () => {
  const btn = document.getElementById('btn-fullscreen');
  if (btn) btn.textContent = document.fullscreenElement ? '⊠' : '⛶';
});

window.toggleDeepFocus = () => {
  cfg.deepFocus = !cfg.deepFocus;
  if (cfg.deepFocus) _enterDeepFocus();
  else               _exitDeepFocus();
  ui.renderSettings();
  debounceSave();
  saveToLocalStorage();
};

window.applyPreset = (key) => {
  const p = PRESETS[key];
  if (!p) return;
  cfg.focus = p.focus; cfg.short = p.short; cfg.long = p.long; cfg.sessions = p.sessions;
  cfg.presetName = key;
  ui.renderSettings();
  setMode(getState().mode);
  ui.renderSessionDots(getState().sessionsDone);
  debounceSave();
  saveToLocalStorage();
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('preset-' + key);
  if (btn) btn.classList.add('active');
};

window.setTheme = applyTheme;

window.toggleThemePicker = () => {
  const grid = document.getElementById('theme-picker-grid');
  if (!grid) return;
  const open = grid.classList.toggle('open');
  if (open) {
    setTimeout(() => {
      document.addEventListener('click', () => grid.classList.remove('open'), { once: true });
    }, 10);
  }
};

window.pickTheme = (name) => {
  applyTheme(name);
  const grid = document.getElementById('theme-picker-grid');
  if (grid) grid.classList.remove('open');
};

window.switchLang = (code) => {
  setLang(code);
  applyToDOM();
  debounceSave();
  saveToLocalStorage();
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === code)
  );
};

// ── Guardar ajustes manualmente ────────────────────────────────────────

export async function saveSettingsNow() {
  if (!state.user) return;
  const btn = document.getElementById('btn-save-settings');
  clearTimeout(state.saveTimer);
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }
  const { error } = await saveSettings();
  saveToLocalStorage();
  if (btn) {
    btn.disabled = false;
    if (error) {
      btn.textContent = '⚠ Error — reintentar';
      btn.style.setProperty('color', '#ff6b9d');
      setTimeout(() => { btn.textContent = 'Guardar ajustes'; btn.style.removeProperty('color'); }, 3500);
    } else {
      btn.textContent = '✓ Guardado';
      btn.style.setProperty('color', 'var(--accent)');
      setTimeout(() => { btn.textContent = 'Guardar ajustes'; btn.style.removeProperty('color'); }, 2000);
    }
  }
};

// ── Mix ambiental ──────────────────────────────────────────────────────

window.addSceneToMix = (theme) => {
  if (!theme || !cfg.ambientMix || cfg.ambientMix[theme] !== undefined) return;
  if (Object.keys(cfg.ambientMix).length >= 3) {
    ui.showToast('Máximo 3 escenas en el mix');
    return;
  }
  cfg.ambientMix[theme] = 0.7;
  if (cfg.ambient) switchMix(cfg.ambientMix);
  ui.renderSettings();
  saveToLocalStorage();
};

window.removeSceneFromMix = (theme) => {
  delete cfg.ambientMix[theme];
  if (cfg.ambient) {
    const keys = Object.keys(cfg.ambientMix);
    if (keys.length > 0) switchMix(cfg.ambientMix);
    else startAmbient(state.theme);
  }
  ui.renderSettings();
  saveToLocalStorage();
};

window.setMixSceneVol = (theme, vol) => {
  cfg.ambientMix[theme] = parseFloat(vol);
  setSceneVolume(theme, parseFloat(vol));
  saveToLocalStorage();
};

window.toggleTypingSounds = () => {
  cfg.typingSounds = !cfg.typingSounds;
  ui.renderSettings();
  saveToLocalStorage();
};

// ── Etiquetas ──────────────────────────────────────────────────────────

const _LABELS_KEY = () => state.user ? 'fn_labels_' + state.user.id : 'fn_labels_guest';

function _loadLabels(userId) {
  try {
    const stored = JSON.parse(localStorage.getItem('fn_labels_' + userId) || 'null');
    if (Array.isArray(stored) && stored.length) cfg.labels = stored;
  } catch (_) {}
}

function _saveLabels() {
  try { localStorage.setItem(_LABELS_KEY(), JSON.stringify(cfg.labels)); } catch (_) {}
}

window.updateLabelColor = (key, color) => {
  const label = cfg.labels.find(l => l.key === key);
  if (label) label.color = color;
  _saveLabels();
  ui.renderTaskLabelSelect();
  // Refrescar el dot de la tarea activa si tiene esta etiqueta
  const list = document.getElementById('tasks-list');
  if (list) list.querySelectorAll(`[data-label="${key}"]`).forEach(el => { el.style.background = color; });
};

window.addLabel = () => {
  const inp   = document.getElementById('lm-add-name');
  const swatch = document.getElementById('lm-add-swatch');
  if (!inp) return;
  const name = inp.value.trim();
  if (!name) return;
  const color = swatch ? getComputedStyle(swatch).backgroundColor : '#a0a0f0';
  const colorHex = document.querySelector('#lm-add-swatch input[type=color]')?.value || '#a0a0f0';
  const key   = name.toLowerCase().replace(/[^\w\u00C0-\u024F]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 20) || ('label_' + Date.now());
  if (cfg.labels.some(l => l.key === key)) { ui.showToast('Ya existe una etiqueta con ese nombre'); return; }
  cfg.labels.push({ key, name, color: colorHex });
  _saveLabels();
  inp.value = '';
  ui.renderLabelManager();
  ui.renderTaskLabelSelect();
};

window.deleteLabel = (key) => {
  const idx = cfg.labels.findIndex(l => l.key === key);
  if (idx === -1) return;
  cfg.labels.splice(idx, 1);
  _saveLabels();
  ui.renderLabelManager();
  ui.renderTaskLabelSelect();
};

window.addEventListener('beforeunload', () => {
  if (state.user && state.saveTimer) {
    clearTimeout(state.saveTimer);
    saveSettings();
    saveToLocalStorage();
  }
});
