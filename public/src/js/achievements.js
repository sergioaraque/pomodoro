/**
 * achievements.js — Sistema de logros de FocusNature.
 */

export const ACHIEVEMENTS = [
  { id: 'first',     icon: '🌱', name: 'Primer paso',        desc: '1 pomodoro completado',        check: s => s.total >= 1 },
  { id: 'ten',       icon: '🍅', name: 'Tomate novato',      desc: '10 pomodoros completados',      check: s => s.total >= 10 },
  { id: 'fifty',     icon: '🔥', name: 'En llamas',          desc: '50 pomodoros completados',      check: s => s.total >= 50 },
  { id: 'hundred',   icon: '💯', name: 'Centenario',         desc: '100 pomodoros completados',     check: s => s.total >= 100 },
  { id: 'fivehund',  icon: '🏆', name: 'Maestro del tiempo', desc: '500 pomodoros completados',     check: s => s.total >= 500 },
  { id: 'streak3',   icon: '📅', name: 'Constante',          desc: 'Racha de 3 días',               check: s => s.bestStreak >= 3 },
  { id: 'streak7',   icon: '💪', name: 'Disciplinado',       desc: 'Racha de 7 días',               check: s => s.bestStreak >= 7 },
  { id: 'streak30',  icon: '🔮', name: 'Leyenda',            desc: 'Racha de 30 días',              check: s => s.bestStreak >= 30 },
  { id: 'day5',      icon: '⚡', name: 'Sprint',             desc: '5 pomodoros en un día',         check: s => s.bestDay >= 5 },
  { id: 'day10',     icon: '🌊', name: 'Inmersión total',    desc: '10 pomodoros en un día',        check: s => s.bestDay >= 10 },
  { id: 'goal',      icon: '🎯', name: 'Objetivo cumplido',  desc: 'Alcanzar el objetivo diario',   check: s => s.today >= s.dailyGoal && s.dailyGoal > 0 },
  { id: 'earlybird', icon: '🌅', name: 'Madrugador',         desc: 'Pomodoro antes de las 8:00',    check: s => s.hasEarlySession },
  { id: 'nightowl',  icon: '🦉', name: 'Noctámbulo',         desc: 'Pomodoro después de las 22:00', check: s => s.hasLateSession },
];

const _key = (userId) => `fn_achievements_${userId}`;

export function loadAchievements(userId) {
  try { return new Set(JSON.parse(localStorage.getItem(_key(userId)) || '[]')); }
  catch { return new Set(); }
}

export function saveAchievements(userId, set) {
  try { localStorage.setItem(_key(userId), JSON.stringify([...set])); } catch (_) {}
}

/**
 * Comprueba qué logros se acaban de desbloquear.
 * Muta `unlocked`, lo guarda y devuelve los recién desbloqueados.
 */
export function checkNewAchievements(stats, userId, unlocked) {
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.has(a.id) && a.check(stats)) {
      unlocked.add(a.id);
      newly.push(a);
    }
  }
  if (newly.length) saveAchievements(userId, unlocked);
  return newly;
}
