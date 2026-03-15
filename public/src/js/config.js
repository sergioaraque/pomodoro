/**
 * config.js — Configuración compartida
 * Se muta directamente; todos los módulos leen del mismo objeto.
 */
export const cfg = {
  focus:       25,
  short:       5,
  long:        15,
  sessions:    4,
  sound:       true,
  soundStyle:  'bells',   // 'bells' | 'bowl' | 'gong' | 'ding' | 'theme'
  autoBreak:   false,     // auto-iniciar pausa al terminar sesión de enfoque
  dailyGoal:   8,
  ambient:     false,
  ambientVol:  0.4,
  deepFocus:   false,
};
