/**
 * db.js — Capa de acceso a datos (Supabase)
 * Todas las operaciones con la base de datos están aquí.
 */

let _sb = null;

export function initDb(supabaseClient) {
  _sb = supabaseClient;
}

// ─── AUTH ─────────────────────────────────────
export const auth = {
  onStateChange:  (cb)               => _sb.auth.onAuthStateChange(cb),
  getSession:     ()                 => _sb.auth.getSession(),
  signIn:         (email, password)  => _sb.auth.signInWithPassword({ email, password }),
  signUp:         (email, password)  => _sb.auth.signUp({ email, password }),
  signOut:        ()                 => _sb.auth.signOut(),
  resetPassword:  (email, redirectTo)=> _sb.auth.resetPasswordForEmail(email, { redirectTo }),
  updatePassword: (newPass)          => _sb.auth.updateUser({ password: newPass }),
};

// ─── SETTINGS ─────────────────────────────────
export const settings = {
  load: async (userId) => {
    const { data, error } = await _sb
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return { data, error };
  },

  save: async (userId, values) => {
    const { error } = await _sb
      .from('user_settings')
      .upsert({ user_id: userId, ...values }, { onConflict: 'user_id' });
    return { error };
  },
  loadQuickNotes: async (userId) => {
    const { data } = await _sb
      .from('user_settings').select('quick_notes').eq('user_id', userId).maybeSingle();
    return data?.quick_notes || '';
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
      .update({ ...fields, updated_at: new Date().toISOString() })
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

  loadRecent: async (userId) => {
    const { data, error } = await _sb
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(50);
    return { data: data || [], error };
  },

  loadForTask: async (userId, taskId) => {
    const { data, error } = await _sb
      .from('pomodoro_sessions')
      .select('completed_at, duration')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .eq('mode', 'focus')
      .order('completed_at', { ascending: false })
      .limit(20);
    return { data: data || [], error };
  },
};

// ─── CACHE UTILITIES ──────────────────────────
export const cache = {
  clear: async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.includes('supabase') || key.includes('focusnature')) {
          await caches.delete(key);
        }
      }
    }
    
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases?.() || [];
      for (const db of databases) {
        if (db.name?.includes('supabase') || db.name?.includes('focusnature')) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    }
  },
  
  hasData: async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      return keys.some(k => k.includes('focusnature'));
    }
    return false;
  }
};