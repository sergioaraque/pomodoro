/**
 * config.js — Configuración compartida
 */
export const cfg = {
  focus:       25,
  short:       5,
  long:        15,
  sessions:    4,
  sound:       true,
  soundStyle:  'bells',
  autoBreak:   false,
  dailyGoal:   8,
  ambient:     false,
  ambientVol:  0.4,
  deepFocus:   false,
  autoTheme:   false,   // cambio automático de tema según hora
  autoPause:   false,   // pausar al ocultar la pestaña
  presetName:   '',      // nombre del preset activo (vacío = custom)
  ambientMix:  {},       // mix de escenas { theme: relativeVol } — vacío = escena del tema activo
  autoAmbient: false,   // cambio automático de escena ambiental según hora del día
};
