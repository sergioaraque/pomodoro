/**
 * config.js — Configuración compartida (tiempos, preferencias)
 * Se muta directamente; todos los módulos leen del mismo objeto.
 */
export const cfg = {
  focus:      25,
  short:      5,
  long:       15,
  sessions:   4,
  sound:      true,
  dailyGoal:  8,      // objetivo de pomodoros por día
  ambient:    false,  // música ambiental activa
  ambientVol: 0.4,    // volumen 0–1
  deepFocus:  false,  // modo foco profundo
};
