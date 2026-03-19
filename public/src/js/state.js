/**
 * state.js — Fuente única de verdad para el estado en runtime.
 * Módulos múltiples leen y mutan este objeto.
 */

export const state = {
  user:         null,    // Appwrite user object { id, email }
  tasks:        [],      // Task[] del usuario
  activeTaskId: null,    // ID de la tarea en foco
  theme:        'ocean', // Tema visual activo
  todayCount:   0,       // Pomodoros de enfoque completados hoy
  saveTimer:    null,    // Timer del debounce de settings
};
