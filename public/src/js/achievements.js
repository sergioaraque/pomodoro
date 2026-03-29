/**
 * achievements.js — Sistema de logros de FocusNature.
 */

export const ACHIEVEMENTS = [
  { id: 'first',       icon: '🌱', name: 'Primer paso',        nameKey: 'ach_first_name',        desc: '1 pomodoro completado',            descKey: 'ach_first_desc',
    check: s => s.total >= 1,    progress: s => ({ current: Math.min(s.total, 1), total: 1 }) },
  { id: 'ten',         icon: '🍅', name: 'Tomate novato',      nameKey: 'ach_ten_name',          desc: '10 pomodoros completados',          descKey: 'ach_ten_desc',
    check: s => s.total >= 10,   progress: s => ({ current: Math.min(s.total, 10), total: 10 }) },
  { id: 'twenty_five', icon: '🌿', name: 'En marcha',          nameKey: 'ach_twenty_five_name',  desc: '25 pomodoros completados',          descKey: 'ach_twenty_five_desc',
    check: s => s.total >= 25,   progress: s => ({ current: Math.min(s.total, 25), total: 25 }) },
  { id: 'fifty',       icon: '🔥', name: 'En llamas',          nameKey: 'ach_fifty_name',        desc: '50 pomodoros completados',          descKey: 'ach_fifty_desc',
    check: s => s.total >= 50,   progress: s => ({ current: Math.min(s.total, 50), total: 50 }) },
  { id: 'seventy_five',icon: '🌟', name: 'Imparable',          nameKey: 'ach_seventy_five_name', desc: '75 pomodoros completados',          descKey: 'ach_seventy_five_desc',
    check: s => s.total >= 75,   progress: s => ({ current: Math.min(s.total, 75), total: 75 }) },
  { id: 'hundred',     icon: '💯', name: 'Centenario',         nameKey: 'ach_hundred_name',      desc: '100 pomodoros completados',         descKey: 'ach_hundred_desc',
    check: s => s.total >= 100,  progress: s => ({ current: Math.min(s.total, 100), total: 100 }) },
  { id: 'two_fifty',   icon: '🚀', name: 'Pro del foco',       nameKey: 'ach_two_fifty_name',    desc: '250 pomodoros completados',         descKey: 'ach_two_fifty_desc',
    check: s => s.total >= 250,  progress: s => ({ current: Math.min(s.total, 250), total: 250 }) },
  { id: 'fivehund',    icon: '🏆', name: 'Maestro del tiempo', nameKey: 'ach_fivehund_name',     desc: '500 pomodoros completados',         descKey: 'ach_fivehund_desc',
    check: s => s.total >= 500,  progress: s => ({ current: Math.min(s.total, 500), total: 500 }) },
  { id: 'streak3',     icon: '📅', name: 'Constante',          nameKey: 'ach_streak3_name',      desc: 'Racha de 3 días',                  descKey: 'ach_streak3_desc',
    check: s => s.bestStreak >= 3,  progress: s => ({ current: Math.min(s.bestStreak, 3), total: 3 }) },
  { id: 'streak7',     icon: '💪', name: 'Disciplinado',       nameKey: 'ach_streak7_name',      desc: 'Racha de 7 días',                  descKey: 'ach_streak7_desc',
    check: s => s.bestStreak >= 7,  progress: s => ({ current: Math.min(s.bestStreak, 7), total: 7 }) },
  { id: 'streak30',    icon: '🔮', name: 'Leyenda',            nameKey: 'ach_streak30_name',     desc: 'Racha de 30 días',                 descKey: 'ach_streak30_desc',
    check: s => s.bestStreak >= 30, progress: s => ({ current: Math.min(s.bestStreak, 30), total: 30 }) },
  { id: 'day5',        icon: '⚡', name: 'Sprint',             nameKey: 'ach_day5_name',         desc: '5 pomodoros en un día',             descKey: 'ach_day5_desc',
    check: s => s.bestDay >= 5,  progress: s => ({ current: Math.min(s.bestDay, 5), total: 5 }) },
  { id: 'day10',       icon: '🌊', name: 'Inmersión total',    nameKey: 'ach_day10_name',        desc: '10 pomodoros en un día',            descKey: 'ach_day10_desc',
    check: s => s.bestDay >= 10, progress: s => ({ current: Math.min(s.bestDay, 10), total: 10 }) },
  { id: 'goal',        icon: '🎯', name: 'Objetivo cumplido',  nameKey: 'ach_goal_name',         desc: 'Alcanzar el objetivo diario',       descKey: 'ach_goal_desc',
    check: s => s.today >= s.dailyGoal && s.dailyGoal > 0 },
  { id: 'earlybird',   icon: '🌅', name: 'Madrugador',         nameKey: 'ach_earlybird_name',    desc: 'Pomodoro antes de las 8:00',        descKey: 'ach_earlybird_desc',
    check: s => s.hasEarlySession },
  { id: 'nightowl',    icon: '🦉', name: 'Noctámbulo',         nameKey: 'ach_nightowl_name',     desc: 'Pomodoro después de las 22:00',     descKey: 'ach_nightowl_desc',
    check: s => s.hasLateSession },
  { id: 'perfect_week',icon: '🗓', name: 'Semana perfecta',    nameKey: 'ach_perfect_week_name', desc: 'Sesiones los 7 días de la semana',  descKey: 'ach_perfect_week_desc',
    check: s => (s.bestWeek || 0) >= 7, progress: s => ({ current: Math.min(s.bestWeek || 0, 7), total: 7 }) },
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
