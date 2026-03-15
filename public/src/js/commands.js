/**
 * commands.js — Paleta de comandos (Cmd/Ctrl+K)
 * Sin dependencias externas. Registro de comandos desde app.js.
 */

import { t } from './i18n.js';

const _commands = [];
let _overlay = null;
let _input   = null;
let _list    = null;
let _active  = -1;

/** Registra un comando en la paleta. */
export function registerCommand({ id, label, icon = '', section = '', action }) {
  _commands.push({ id, label, icon, section, action });
}

/** Abre la paleta. */
export function openPalette() {
  _ensureDOM();
  _overlay.style.display = 'flex';
  requestAnimationFrame(() => _overlay.classList.add('cp-open'));
  _input.value = '';
  _active = -1;
  _render('');
  setTimeout(() => _input.focus(), 50);
}

/** Cierra la paleta. */
export function closePalette() {
  if (!_overlay) return;
  _overlay.classList.remove('cp-open');
  setTimeout(() => { if (_overlay) _overlay.style.display = 'none'; }, 180);
}

export function isPaletteOpen() {
  return _overlay?.classList.contains('cp-open') ?? false;
}

// ── Private ──────────────────────────────────────────────────────────

function _ensureDOM() {
  if (_overlay) return;

  _overlay = document.createElement('div');
  _overlay.className = 'cp-overlay';
  _overlay.innerHTML = `
    <div class="cp-modal" role="dialog" aria-modal="true">
      <div class="cp-search-wrap">
        <span class="cp-search-icon">⌕</span>
        <input class="cp-input" type="text" autocomplete="off" spellcheck="false">
      </div>
      <div class="cp-list"></div>
      <div class="cp-footer">
        <span>↑↓ Navegar</span>
        <span>↵ Ejecutar</span>
        <span>Esc Cerrar</span>
      </div>
    </div>`;

  document.body.appendChild(_overlay);
  _input = _overlay.querySelector('.cp-input');
  _list  = _overlay.querySelector('.cp-list');

  _input.addEventListener('input', () => { _active = -1; _render(_input.value); });
  _input.addEventListener('keydown', _onKey);
  _overlay.addEventListener('mousedown', e => { if (e.target === _overlay) closePalette(); });
}

function _render(query) {
  const q = query.toLowerCase().trim();
  const filtered = q
    ? _commands.filter(c => c.label.toLowerCase().includes(q) || c.section.toLowerCase().includes(q))
    : _commands;

  if (!filtered.length) {
    _list.innerHTML = `<div class="cp-empty">${t('cmd_no_results')}</div>`;
    return;
  }

  // Group by section
  const sections = {};
  filtered.forEach(c => {
    const s = c.section || '';
    if (!sections[s]) sections[s] = [];
    sections[s].push(c);
  });

  let html = '';
  let idx = 0;
  Object.entries(sections).forEach(([section, cmds]) => {
    if (section) html += `<div class="cp-section">${section}</div>`;
    cmds.forEach(c => {
      html += `<button class="cp-item${idx === _active ? ' cp-active' : ''}" data-idx="${idx}">
        <span class="cp-item-icon">${c.icon}</span>
        <span class="cp-item-label">${c.label}</span>
      </button>`;
      idx++;
    });
  });

  _list.innerHTML = html;
  _list.querySelectorAll('.cp-item').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      _active = parseInt(btn.dataset.idx);
      _highlight();
    });
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      _execute(filtered[i]);
    });
  });

  _filteredCache = filtered;
}

let _filteredCache = [];

function _highlight() {
  _list.querySelectorAll('.cp-item').forEach((b, i) => {
    b.classList.toggle('cp-active', i === _active);
    if (i === _active) b.scrollIntoView({ block: 'nearest' });
  });
}

function _onKey(e) {
  const items = _list.querySelectorAll('.cp-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _active = Math.min(_active + 1, items.length - 1);
    _highlight();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _active = Math.max(_active - 1, 0);
    _highlight();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const cmd = _filteredCache[_active >= 0 ? _active : 0];
    if (cmd) _execute(cmd);
  } else if (e.key === 'Escape') {
    closePalette();
  }
}

function _execute(cmd) {
  closePalette();
  setTimeout(() => cmd.action(), 50);
}
