/**
 * db.js — Capa de acceso a datos (Supabase)
 * Todas las operaciones con la base de datos están aquí.
 * El resto de módulos importan funciones de este archivo.
 */

/** @type {import('@supabase/supabase-js').SupabaseClient} */
let _sb = null;

export function initDb(supabaseClient) {
  _sb = supabaseClient;
}

// ─── AUTH ─────────────────────────────────────
export const auth = {
  onStateChange: (cb) => _sb.auth.onAuthStateChange(cb),
  getSession:    ()   => _sb.auth.getSession(),
  signIn:  (email, password) => _sb.auth.signInWithPassword({ email, password }),
  signUp:  (email, password) => _sb.auth.signUp({ email, password }),
  signOut: ()               => _sb.auth.signOut(),
};

// ─── SETTINGS ─────────────────────────────────
export const settings = {
  load: async (userId) => {
    const { data, error } = await _sb
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  save: async (userId, values) => {
    const { error } = await _sb
      .from('user_settings')
      .upsert({ user_id: userId, ...values }, { onConflict: 'user_id' });
    return { error };
  },
};

// ─── TASKS ────────────────────────────────────
export const tasks = {
  loadAll: async (userId) => {
    const { data, error } = await _sb
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('position',    { ascending: true  })
      .order('created_at',  { ascending: false });
    return { data, error };
  },

  create: async (userId, name, estimate = 0, label = '') => {
    const { data, error } = await _sb
      .from('tasks')
      .insert({ user_id: userId, name, position: 0, notes: '', estimate, label })
      .select()
      .single();
    return { data, error };
  },

  update: async (id, fields) => {
    const { error } = await _sb
      .from('tasks')
      .update(fields)
      .eq('id', id);
    return { error };
  },

  remove: async (id) => {
    const { error } = await _sb
      .from('tasks')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// ─── POMODORO SESSIONS ────────────────────────
export const sessions = {
  /**
   * Registra una sesión completada.
   * @param {string} userId
   * @param {'focus'|'short'|'long'} mode
   * @param {number} durationMin
   * @param {string|null} taskId
   * @param {string|null} taskName
   */
  create: async (userId, mode, durationMin, taskId, taskName) => {
    const { error } = await _sb
      .from('pomodoro_sessions')
      .insert({
        user_id:   userId,
        mode,
        duration:  durationMin,
        task_id:   taskId   || null,
        task_name: taskName || null,
      });
    return { error };
  },

  remove: async (id) => {
    const { error } = await _sb
      .from('pomodoro_sessions')
      .delete()
      .eq('id', id);
    return { error };
  },

  /** Carga sesiones de enfoque para métricas (máx. 500) */
  loadFocus: async (userId) => {
    const { data, error } = await _sb
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('mode', 'focus')
      .order('completed_at', { ascending: false })
      .limit(500);
    return { data: data || [], error };
  },

  /** Carga las últimas 50 sesiones de todos los modos para el historial */
  loadRecent: async (userId) => {
    const { data, error } = await _sb
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(50);
    return { data: data || [], error };
  },
};
