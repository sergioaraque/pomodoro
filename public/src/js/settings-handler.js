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
import { startAmbient, stopAmbient,
         switchAmbient, setVolume }     from './ambient.js';
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
    cfg.customAccent = data.custom_accent || '';

    if (data.lang) setLang(data.lang);
    if (cfg.customAccent) _applyCustomAccent(cfg.customAccent);
    applyTheme(data.theme || 'ocean', false);
    if (cfg.ambient) startAmbient(state.theme);
    setVolume(cfg.ambientVol);

    const el = document.getElementById('quick-notes-area');
    if (el && data.quick_notes) el.value = data.quick_notes;
  }
  setMode('focus');
  ui.renderSettings();
  ui.renderSessionDots(getState().sessionsDone);
  return data;
}

// ── saveSettings ──────────────────────────────────────────────────────

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
    custom_accent: cfg.customAccent || '',
    lang:         getLang(),
    quick_notes:  document.getElementById('quick-notes-area')?.value || '',
  });
  ui.setSyncState(error ? 'error' : 'ok');
  return { error };
}

export function debounceSave() {
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
  if (cfg.customAccent) _applyCustomAccent(cfg.customAccent);
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

function _applyCustomAccent(hex) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return;
  cfg.customAccent = hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lighten = v => Math.min(255, v + 40);
  const accent2 = '#' + [lighten(r), lighten(g), lighten(b)]
    .map(v => v.toString(16).padStart(2, '0')).join('');
  let tag = document.getElementById('_custom-accent-style');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = '_custom-accent-style';
    document.head.appendChild(tag);
  }
  tag.textContent = `:root{--accent:${hex}!important;--accent2:${accent2}!important;}`;
  document.querySelectorAll('.ctheme-swatch').forEach(b =>
    b.classList.toggle('active', b.dataset.color?.toLowerCase() === hex.toLowerCase())
  );
  const colorInput = document.getElementById('custom-color-input');
  if (colorInput) colorInput.value = hex;
}

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
  if (cfg.ambient) startAmbient(state.theme);
  else             stopAmbient();
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

window.toggleAutoBreak = () => {
  cfg.autoBreak = !cfg.autoBreak;
  ui.renderSettings();
  debounceSave();
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

window.applyCustomAccent = (hex) => {
  _applyCustomAccent(hex);
  debounceSave();
  saveToLocalStorage();
};

window.clearCustomAccent = () => {
  cfg.customAccent = '';
  const tag = document.getElementById('_custom-accent-style');
  if (tag) tag.remove();
  document.querySelectorAll('.ctheme-swatch').forEach(b => b.classList.remove('active'));
  debounceSave();
  saveToLocalStorage();
  applyTheme(state.theme, false);
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

window.saveSettingsNow = async () => {
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

window.addEventListener('beforeunload', () => {
  if (state.user && state.saveTimer) {
    clearTimeout(state.saveTimer);
    saveSettings();
    saveToLocalStorage();
  }
});
