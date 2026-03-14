/**
 * sound.js — Notificaciones sonoras
 */

import { cfg } from './config.js';

export function playSessionEnd() {
  if (!cfg.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [528, 660, 792].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.4;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  } catch (e) {
    // AudioContext not available — silently skip
  }
}
