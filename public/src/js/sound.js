/**
 * sound.js — Notificaciones sonoras al terminar sesión
 * 5 estilos: bells, bowl, gong, ding, theme (usa el acento del tema activo)
 */

import { cfg } from './config.js';

// Crea un contexto nuevo por llamada para evitar el "already closed" de Safari
function ctx() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

function ramp(gain, t, from, to, dur) {
  gain.gain.setValueAtTime(from, t);
  gain.gain.linearRampToValueAtTime(to, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
}

// Campanas cristalinas (original)
function playBells(c) {
  [528, 660, 792].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.value = f; o.type = 'sine';
    const t = c.currentTime + i * 0.4;
    ramp(g, t, 0, 0.2, 0.9);
    o.start(t); o.stop(t + 0.9);
  });
}

// Cuenco tibetano — fundamental + armónico sostenido
function playBowl(c) {
  [[220, 0.18, 2.5], [440, 0.09, 2.2], [660, 0.04, 1.8]].forEach(([f, vol, dur], i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime + i * 0.05;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.1);
  });
}

// Gong suave — grave + shimmer de alta frecuencia
function playGong(c) {
  const t = c.currentTime;
  // Cuerpo grave
  const o1 = c.createOscillator(), g1 = c.createGain();
  o1.type = 'sine'; o1.frequency.setValueAtTime(80, t);
  o1.frequency.exponentialRampToValueAtTime(55, t + 1.5);
  g1.gain.setValueAtTime(0, t);
  g1.gain.linearRampToValueAtTime(0.28, t + 0.02);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
  o1.connect(g1); g1.connect(c.destination);
  o1.start(t); o1.stop(t + 3.1);
  // Shimmer agudo
  const o2 = c.createOscillator(), g2 = c.createGain();
  o2.type = 'sine'; o2.frequency.value = 880;
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(0.07, t + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  o2.connect(g2); g2.connect(c.destination);
  o2.start(t); o2.stop(t + 1.3);
}

// Ding minimalista — una nota clara
function playDing(c) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'triangle'; o.frequency.value = 1047; // Do6
  o.connect(g); g.connect(c.destination);
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.22, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  o.start(t); o.stop(t + 1.5);
}

// Tema — acorde de 3 notas con el acento del tema activo (basado en la frecuencia del acento)
function playTheme(c, currentTheme) {
  // Cada tema tiene su propio carácter tonal
  const themeNotes = {
    ocean:    [440, 554, 659],  // La-Do#-Mi (mayor brillante)
    meadow:   [392, 494, 587],  // Sol-Si-Re (mayor luminoso)
    mountain: [349, 440, 523],  // Fa-La-Do (mayor suave)
    forest:   [330, 415, 494],  // Mi-Sol#-Si (mayor místico)
    desert:   [370, 466, 554],  // Fa#-Si♭-Do# (suspensión)
    city:     [466, 587, 698],  // Si♭-Re-Fa (jazzy)
    arctic:   [523, 659, 784],  // Do-Mi-Sol (claro y cristalino)
    space:    [220, 277, 330],  // La-Do#-Mi grave (épico)
    deep:     [196, 247, 294],  // Sol-Si-Re muy grave (abismal)
  };
  const notes = themeNotes[currentTheme] || themeNotes.ocean;
  notes.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime + i * 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    o.start(t); o.stop(t + 1.2);
  });
}

export function playSessionEnd(currentTheme = 'ocean') {
  if (!cfg.sound) return;
  try {
    const c = ctx();
    switch (cfg.soundStyle) {
      case 'bowl':  playBowl(c);             break;
      case 'gong':  playGong(c);             break;
      case 'ding':  playDing(c);             break;
      case 'theme': playTheme(c, currentTheme); break;
      default:      playBells(c);
    }
  } catch (e) { /* AudioContext not available */ }
}

/** Preview de un estilo (para el selector en ajustes) */
export function previewSound(style, currentTheme = 'ocean') {
  try {
    const c = ctx();
    const prev = cfg.soundStyle;
    cfg.soundStyle = style;
    playSessionEnd(currentTheme);
    cfg.soundStyle = prev;
  } catch (e) {}
}
