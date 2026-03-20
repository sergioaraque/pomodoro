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
  typingSounds: false,  // clicks suaves al escribir durante la sesión de foco
  labels: [             // etiquetas con colores personalizables
    { key: 'trabajo',  name: '💼 Trabajo',  color: '#60a8f0' },
    { key: 'personal', name: '🏠 Personal', color: '#f093fb' },
    { key: 'estudio',  name: '📚 Estudio',  color: '#7ecf3e' },
    { key: 'salud',    name: '💪 Salud',    color: '#ff6b9d' },
    { key: 'otro',     name: '📌 Otro',     color: '#ffa552' },
  ],
};
