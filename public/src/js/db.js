/**
 * db.js — Capa de acceso a datos (Appwrite)
 */

let _account    = null;
let _databases  = null;
let _ID         = null;
let _Query      = null;
let _Permission = null;
let _Role       = null;
let _dbId       = null;

const _C_TASKS    = '69bc20c10031e420d2f1';
const _C_SESSIONS = '69bc21a0002cf2154afa';
const _C_SETTINGS = '69bc225f002e785f900a';

export function initDb({ account, databases, ID, Query, Permission, Role, databaseId }) {
  _account    = account;
  _databases  = databases;
  _ID         = ID;
  _Query      = Query;
  _Permission = Permission;
  _Role       = Role;
  _dbId       = databaseId;
}

// Normalize Appwrite exception → {message}
function _err(e) { return { message: e?.message || 'Error desconocido' }; }

// Normalize Appwrite document to plain task object
function _task(doc) {
  return {
    id:        doc.$id,
    name:      doc.name,
    done:      doc.done,
    pomodoros: doc.pomodoros,
    position:  doc.position,
    notes:     doc.notes || '',
    estimate:  doc.estimate || 0,
    label:     doc.label || '',
    recurring: doc.recurring ?? false,
  };
}

// Normalize Appwrite document to plain session object
function _session(doc) {
  return {
    id:           doc.$id,
    user_id:      doc.user_id,
    task_id:      doc.task_id   || null,
    task_name:    doc.task_name || null,
    duration:     doc.duration,
    mode:         doc.mode,
    completed_at: doc.completed_at || doc.$createdAt,
  };
}

// Normalize Appwrite document to settings object
function _settings(doc) {
  if (!doc) return null;
  return {
    focus_min:     doc.focus_min,
    short_min:     doc.short_min,
    long_min:      doc.long_min,
    sessions:      doc.sessions,
    sound:         doc.sound,
    theme:         doc.theme,
    daily_goal:    doc.daily_goal,
    ambient:       doc.ambient,
    ambient_vol:   doc.ambient_vol,
    deep_focus:    doc.deep_focus,
    auto_break:    doc.auto_break,
    sound_style:   doc.sound_style,
    auto_theme:    doc.auto_theme,
    preset_name:   doc.preset_name,
    quick_notes:   doc.quick_notes,
    custom_accent: doc.custom_accent,
    lang:          doc.lang,
  };
}

function _userPerms(userId) {
  return [
    _Permission.read(_Role.user(userId)),
    _Permission.update(_Role.user(userId)),
    _Permission.delete(_Role.user(userId)),
  ];
}

// ─── AUTH ─────────────────────────────────────
export const auth = {
  getSession: async () => {
    try {
      const user = await _account.get();
      return { data: { session: { user: { id: user.$id, email: user.email } } }, error: null };
    } catch (_) {
      return { data: { session: null }, error: null };
    }
  },

  signIn: async (email, password) => {
    try {
      await _account.createEmailPasswordSession(email, password);
      const user = await _account.get();
      return { data: { user: { id: user.$id, email: user.email } }, error: null };
    } catch (e) {
      return { data: null, error: _err(e) };
    }
  },

  signUp: async (email, password) => {
    try {
      await _account.create(_ID.unique(), email, password);
      return { error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },

  signOut: async () => {
    try {
      await _account.deleteSession('current');
      return { error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },

  resetPassword: async (email, redirectTo) => {
    try {
      await _account.createRecovery(email, redirectTo);
      return { error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },

  updateRecovery: async (userId, secret, password) => {
    try {
      await _account.updateRecovery(userId, secret, password);
      return { error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },

  updatePassword: async (newPass, oldPass) => {
    try {
      await _account.updatePassword(newPass, oldPass || '');
      return { error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },

  // Cross-tab auth sync via BroadcastChannel + localStorage
  onStateChange: (cb) => {
    try {
      const ch = new BroadcastChannel('fn_auth');
      ch.onmessage = (e) => cb(e.data?.event, e.data?.session ?? null);
    } catch (_) {}
    window.addEventListener('storage', (e) => {
      if (e.key !== '__fn_auth__') return;
      try { const d = JSON.parse(e.newValue || '{}'); cb(d.event, d.session ?? null); } catch (_) {}
    });
  },

  broadcast: (event, session = null) => {
    const data = { event, session };
    try { new BroadcastChannel('fn_auth').postMessage(data); } catch (_) {}
    try { localStorage.setItem('__fn_auth__', JSON.stringify(data)); } catch (_) {}
  },
};

// ─── SETTINGS ─────────────────────────────────
export const settings = {
  load: async (userId) => {
    try {
      const doc = await _databases.getDocument(_dbId, _C_SETTINGS, userId);
      return { data: _settings(doc), error: null };
    } catch (e) {
      if (e?.code === 404) return { data: null, error: null }; // no settings yet
      return { data: null, error: _err(e) };
    }
  },

  save: async (userId, values) => {
    try {
      await _databases.updateDocument(_dbId, _C_SETTINGS, userId, values);
      return { error: null };
    } catch (e) {
      if (e?.code === 404) {
        try {
          await _databases.createDocument(_dbId, _C_SETTINGS, userId,
            { user_id: userId, ...values },
            _userPerms(userId));
          return { error: null };
        } catch (e2) {
          return { error: _err(e2) };
        }
      }
      return { error: _err(e) };
    }
  },

  loadQuickNotes: async (userId) => {
    try {
      const doc = await _databases.getDocument(_dbId, _C_SETTINGS, userId);
      return doc?.quick_notes || '';
    } catch (_) {
      return '';
    }
  },
};

// ─── TASKS ────────────────────────────────────
export const tasks = {
  loadAll: async (userId) => {
    try {
      const res = await _databases.listDocuments(_dbId, _C_TASKS, [
        _Query.equal('user_id', userId),
        _Query.orderAsc('position'),
        _Query.orderDesc('$createdAt'),
        _Query.limit(500),
      ]);
      return { data: res.documents.map(_task), error: null };
    } catch (e) {
      return { data: [], error: _err(e) };
    }
  },

  create: async (userId, name, estimate = 0, label = '') => {
    try {
      const doc = await _databases.createDocument(_dbId, _C_TASKS, _ID.unique(),
        { user_id: userId, name, done: false, pomodoros: 0, position: 0, notes: '', estimate, label, recurring: false },
        _userPerms(userId));
      return { data: _task(doc), error: null };
    } catch (e) {
      return { data: null, error: _err(e) };
    }
  },

  update: async (id, fields) => {
    try {
      await _databases.updateDocument(_dbId, _C_TASKS, id, fields);
      return { error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },

  remove: async (id) => {
    try {
      await _databases.deleteDocument(_dbId, _C_TASKS, id);
      return { error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },
};

// ─── POMODORO SESSIONS ────────────────────────
export const sessions = {
  create: async (userId, mode, durationMin, taskId, taskName) => {
    try {
      const doc = await _databases.createDocument(_dbId, _C_SESSIONS, _ID.unique(),
        {
          user_id:      userId,
          mode,
          duration:     durationMin,
          task_id:      taskId   || null,
          task_name:    taskName || null,
          completed_at: new Date().toISOString(),
        },
        _userPerms(userId));
      return { data: { id: doc.$id }, error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },

  remove: async (id) => {
    try {
      await _databases.deleteDocument(_dbId, _C_SESSIONS, id);
      return { error: null };
    } catch (e) {
      return { error: _err(e) };
    }
  },

  loadAll: async (userId) => {
    try {
      const res = await _databases.listDocuments(_dbId, _C_SESSIONS, [
        _Query.equal('user_id', userId),
        _Query.orderDesc('completed_at'),
        _Query.limit(2000),
      ]);
      return { data: res.documents.map(_session), error: null };
    } catch (e) {
      return { data: [], error: _err(e) };
    }
  },

  loadFocus: async (userId) => {
    try {
      const res = await _databases.listDocuments(_dbId, _C_SESSIONS, [
        _Query.equal('user_id', userId),
        _Query.equal('mode', 'focus'),
        _Query.orderDesc('completed_at'),
        _Query.limit(500),
      ]);
      return { data: res.documents.map(_session), error: null };
    } catch (e) {
      return { data: [], error: _err(e) };
    }
  },

  loadRecent: async (userId) => {
    try {
      const res = await _databases.listDocuments(_dbId, _C_SESSIONS, [
        _Query.equal('user_id', userId),
        _Query.orderDesc('completed_at'),
        _Query.limit(50),
      ]);
      return { data: res.documents.map(_session), error: null };
    } catch (e) {
      return { data: [], error: _err(e) };
    }
  },

  loadForTask: async (userId, taskId) => {
    try {
      const res = await _databases.listDocuments(_dbId, _C_SESSIONS, [
        _Query.equal('user_id', userId),
        _Query.equal('task_id', taskId),
        _Query.equal('mode', 'focus'),
        _Query.orderDesc('completed_at'),
        _Query.limit(20),
      ]);
      return { data: res.documents.map(_session), error: null };
    } catch (e) {
      return { data: [], error: _err(e) };
    }
  },
};

// ─── CACHE UTILITIES ──────────────────────────
export const cache = {
  clear: async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.includes('focusnature')) await caches.delete(key);
      }
    }
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases?.() || [];
      for (const db of databases) {
        if (db.name?.includes('focusnature')) {
          await new Promise(resolve => {
            const req = indexedDB.deleteDatabase(db.name);
            req.onsuccess = req.onerror = resolve;
          });
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
  },
};
