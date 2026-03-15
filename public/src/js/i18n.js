/**
 * i18n.js — Internacionalización de FocusNature
 * Soporta: es (por defecto), en, fr, de, pt
 */

const STRINGS = {
  es: {
    // Tabs
    tab_timer:    'Timer',
    tab_tasks:    'Tareas',
    tab_stats:    'Stats',
    tab_settings: 'Ajustes',
    tab_notes:    'Notas',
    // Timer
    mode_focus:   'ENFOQUE',
    mode_short:   'PAUSA CORTA',
    mode_long:    'PAUSA LARGA',
    btn_start:    'Iniciar',
    btn_pause:    'Pausar',
    btn_resume:   'Reanudar',
    btn_reset:    'Reiniciar',
    btn_skip:     'Saltar',
    // Tasks
    task_placeholder: '¿Qué vas a hacer hoy?',
    task_add:     '+ Añadir',
    task_empty:   'Sin tareas aún — ¡añade una arriba!',
    task_focus:   'Enfocar',
    task_active:  '✓ Activa',
    label_none:   'Sin etiqueta',
    label_work:   '💼 Trabajo',
    label_personal: '🏠 Personal',
    label_study:  '📚 Estudio',
    label_health: '💪 Salud',
    label_other:  '📌 Otro',
    est_label:    '🍅 estimados',
    // Stats
    stat_total:   'Pomodoros totales',
    stat_today:   'Hoy',
    stat_streak:  'Racha (días)',
    stat_hours:   'Tiempo enfocado',
    history_title: 'Historial reciente',
    filter_ph:    'Filtrar por tarea…',
    btn_csv:      '⬇ CSV',
    loading_stats: 'Cargando historial…',
    // Settings
    settings_presets: 'Presets rápidos',
    settings_times: 'Tiempos (min)',
    settings_sessions: 'Sesiones',
    settings_goal: 'Objetivo diario',
    settings_sound: 'Notificación al terminar',
    settings_sound_sub: 'Tono suave al cambiar de modo',
    settings_ambient: 'Música ambiental',
    settings_autobreak: 'Auto-iniciar pausa',
    settings_autobreak_sub: 'La pausa arranca sola al terminar',
    settings_autotheme: 'Tema automático por hora',
    settings_autotheme_sub: 'El tema cambia según el momento del día',
    settings_deepfocus: 'Modo foco profundo',
    settings_deepfocus_sub: 'Atenúa la interfaz al iniciar',
    settings_notifications: 'Notificaciones del sistema',
    settings_notifications_sub: 'Aviso cuando cambia el modo (tab en segundo plano)',
    settings_security: 'Seguridad',
    settings_changepw: 'Cambiar contraseña',
    // Notes
    notes_placeholder: 'Escribe aquí tus notas…',
    notes_hint: 'Notas rápidas — ideas sueltas, recordatorios. Se guardan automáticamente.',
    // Auth
    auth_login:   'Entrar',
    auth_register:'Crear cuenta',
    auth_email:   'Correo electrónico',
    auth_password:'Contraseña',
    auth_forgot:  '¿Olvidaste tu contraseña?',
    // Commands
    cmd_placeholder: 'Buscar comando…',
    cmd_no_results: 'Sin resultados',
    // Notifications
    notif_grant: 'Activar notificaciones',
    notif_focus_done: '¡Pomodoro completado!',
    notif_break_done: 'Pausa terminada',
    notif_take_break: 'Tómate una pausa. Te la has ganado.',
    notif_back_to_work: 'Es hora de volver al trabajo. ¡Ánimo!',
  },
  en: {
    tab_timer:'Timer', tab_tasks:'Tasks', tab_stats:'Stats', tab_settings:'Settings', tab_notes:'Notes',
    mode_focus:'FOCUS', mode_short:'SHORT BREAK', mode_long:'LONG BREAK',
    btn_start:'Start', btn_pause:'Pause', btn_resume:'Resume', btn_reset:'Reset', btn_skip:'Skip',
    task_placeholder:"What are you working on?", task_add:'+ Add', task_empty:'No tasks yet — add one above!',
    task_focus:'Focus', task_active:'✓ Active',
    label_none:'No label', label_work:'💼 Work', label_personal:'🏠 Personal', label_study:'📚 Study', label_health:'💪 Health', label_other:'📌 Other',
    est_label:'🍅 estimated',
    stat_total:'Total pomodoros', stat_today:'Today', stat_streak:'Streak (days)', stat_hours:'Focus time',
    history_title:'Recent history', filter_ph:'Filter by task…', btn_csv:'⬇ CSV', loading_stats:'Loading…',
    settings_presets:'Quick presets', settings_times:'Times (min)', settings_sessions:'Sessions',
    settings_goal:'Daily goal', settings_sound:'Session end sound', settings_sound_sub:'Soft tone on mode change',
    settings_ambient:'Ambient music', settings_autobreak:'Auto-start break', settings_autobreak_sub:'Break starts automatically',
    settings_autotheme:'Auto theme by hour', settings_autotheme_sub:'Theme changes with time of day',
    settings_deepfocus:'Deep focus mode', settings_deepfocus_sub:'Dims the UI when running',
    settings_notifications:'System notifications', settings_notifications_sub:'Alert when mode changes (background tab)',
    settings_security:'Security', settings_changepw:'Change password',
    notes_placeholder:'Write your notes here…', notes_hint:'Quick notes — ideas, reminders. Auto-saved.',
    auth_login:'Sign in', auth_register:'Create account', auth_email:'Email', auth_password:'Password', auth_forgot:'Forgot password?',
    cmd_placeholder:'Search commands…', cmd_no_results:'No results',
    notif_grant:'Enable notifications', notif_focus_done:'Pomodoro complete!', notif_break_done:'Break over',
    notif_take_break:'Take a break. You earned it.', notif_back_to_work:'Time to focus again. Let\'s go!',
  },
  fr: {
    tab_timer:'Minuteur', tab_tasks:'Tâches', tab_stats:'Stats', tab_settings:'Réglages', tab_notes:'Notes',
    mode_focus:'CONCENTRATION', mode_short:'PAUSE COURTE', mode_long:'PAUSE LONGUE',
    btn_start:'Démarrer', btn_pause:'Pause', btn_resume:'Reprendre', btn_reset:'Réinitialiser', btn_skip:'Passer',
    task_placeholder:'Sur quoi travaillez-vous ?', task_add:'+ Ajouter', task_empty:'Aucune tâche — ajoutez-en une !',
    task_focus:'Focus', task_active:'✓ Active',
    label_none:'Sans étiquette', label_work:'💼 Travail', label_personal:'🏠 Personnel', label_study:'📚 Étude', label_health:'💪 Santé', label_other:'📌 Autre',
    est_label:'🍅 estimés',
    stat_total:'Pomodoros totaux', stat_today:"Aujourd'hui", stat_streak:'Série (jours)', stat_hours:'Temps de concentration',
    history_title:'Historique récent', filter_ph:'Filtrer par tâche…', btn_csv:'⬇ CSV', loading_stats:'Chargement…',
    settings_presets:'Préréglages', settings_times:'Durées (min)', settings_sessions:'Sessions',
    settings_goal:'Objectif quotidien', settings_sound:'Son de fin de session', settings_sound_sub:'Ton doux lors du changement de mode',
    settings_ambient:'Musique ambiante', settings_autobreak:'Démarrage auto de la pause', settings_autobreak_sub:'La pause démarre automatiquement',
    settings_autotheme:'Thème auto par heure', settings_autotheme_sub:'Le thème change selon le moment',
    settings_deepfocus:'Mode concentration profonde', settings_deepfocus_sub:'Assombrit l\'interface',
    settings_notifications:'Notifications système', settings_notifications_sub:'Alerte lors du changement de mode',
    settings_security:'Sécurité', settings_changepw:'Changer le mot de passe',
    notes_placeholder:'Écrivez vos notes ici…', notes_hint:'Notes rapides — idées, rappels. Sauvegarde auto.',
    auth_login:'Connexion', auth_register:'Créer un compte', auth_email:'E-mail', auth_password:'Mot de passe', auth_forgot:'Mot de passe oublié ?',
    cmd_placeholder:'Rechercher une commande…', cmd_no_results:'Aucun résultat',
    notif_grant:'Activer les notifications', notif_focus_done:'Pomodoro terminé !', notif_break_done:'Pause terminée',
    notif_take_break:'Prenez une pause. Vous l\'avez méritée.', notif_back_to_work:'Retour au travail. Courage !',
  },
  de: {
    tab_timer:'Timer', tab_tasks:'Aufgaben', tab_stats:'Stats', tab_settings:'Einstellungen', tab_notes:'Notizen',
    mode_focus:'FOKUS', mode_short:'KURZE PAUSE', mode_long:'LANGE PAUSE',
    btn_start:'Starten', btn_pause:'Pause', btn_resume:'Fortsetzen', btn_reset:'Zurücksetzen', btn_skip:'Überspringen',
    task_placeholder:'Woran arbeitest du?', task_add:'+ Hinzufügen', task_empty:'Noch keine Aufgaben — füge eine hinzu!',
    task_focus:'Fokus', task_active:'✓ Aktiv',
    label_none:'Kein Label', label_work:'💼 Arbeit', label_personal:'🏠 Persönlich', label_study:'📚 Lernen', label_health:'💪 Gesundheit', label_other:'📌 Sonstiges',
    est_label:'🍅 geschätzt',
    stat_total:'Pomodoros gesamt', stat_today:'Heute', stat_streak:'Serie (Tage)', stat_hours:'Fokuszeit',
    history_title:'Verlauf', filter_ph:'Nach Aufgabe filtern…', btn_csv:'⬇ CSV', loading_stats:'Lädt…',
    settings_presets:'Schnelleinstellungen', settings_times:'Zeiten (Min)', settings_sessions:'Sitzungen',
    settings_goal:'Tagesziel', settings_sound:'Sitzungsende-Ton', settings_sound_sub:'Sanfter Ton beim Moduswechsel',
    settings_ambient:'Umgebungsmusik', settings_autobreak:'Pause automatisch starten', settings_autobreak_sub:'Pause startet automatisch',
    settings_autotheme:'Auto-Thema nach Uhrzeit', settings_autotheme_sub:'Thema wechselt je nach Tageszeit',
    settings_deepfocus:'Tiefer Fokus-Modus', settings_deepfocus_sub:'Abdunkelt die Oberfläche',
    settings_notifications:'Systembenachrichtigungen', settings_notifications_sub:'Benachrichtigung bei Moduswechsel',
    settings_security:'Sicherheit', settings_changepw:'Passwort ändern',
    notes_placeholder:'Notizen hier schreiben…', notes_hint:'Schnellnotizen — Ideen, Erinnerungen. Automatisch gespeichert.',
    auth_login:'Anmelden', auth_register:'Konto erstellen', auth_email:'E-Mail', auth_password:'Passwort', auth_forgot:'Passwort vergessen?',
    cmd_placeholder:'Befehl suchen…', cmd_no_results:'Keine Ergebnisse',
    notif_grant:'Benachrichtigungen aktivieren', notif_focus_done:'Pomodoro abgeschlossen!', notif_break_done:'Pause beendet',
    notif_take_break:'Mach eine Pause. Du hast sie verdient.', notif_back_to_work:'Zurück zur Arbeit. Los!',
  },
  pt: {
    tab_timer:'Timer', tab_tasks:'Tarefas', tab_stats:'Stats', tab_settings:'Ajustes', tab_notes:'Notas',
    mode_focus:'FOCO', mode_short:'PAUSA CURTA', mode_long:'PAUSA LONGA',
    btn_start:'Iniciar', btn_pause:'Pausar', btn_resume:'Retomar', btn_reset:'Reiniciar', btn_skip:'Pular',
    task_placeholder:'No que você está trabalhando?', task_add:'+ Adicionar', task_empty:'Sem tarefas ainda — adicione uma!',
    task_focus:'Focar', task_active:'✓ Ativa',
    label_none:'Sem etiqueta', label_work:'💼 Trabalho', label_personal:'🏠 Pessoal', label_study:'📚 Estudo', label_health:'💪 Saúde', label_other:'📌 Outro',
    est_label:'🍅 estimados',
    stat_total:'Pomodoros totais', stat_today:'Hoje', stat_streak:'Sequência (dias)', stat_hours:'Tempo de foco',
    history_title:'Histórico recente', filter_ph:'Filtrar por tarefa…', btn_csv:'⬇ CSV', loading_stats:'Carregando…',
    settings_presets:'Presets rápidos', settings_times:'Tempos (min)', settings_sessions:'Sessões',
    settings_goal:'Meta diária', settings_sound:'Som de fim de sessão', settings_sound_sub:'Tom suave ao mudar modo',
    settings_ambient:'Música ambiente', settings_autobreak:'Auto-iniciar pausa', settings_autobreak_sub:'A pausa começa automaticamente',
    settings_autotheme:'Tema automático por hora', settings_autotheme_sub:'Tema muda conforme o momento do dia',
    settings_deepfocus:'Modo foco profundo', settings_deepfocus_sub:'Escurece a interface ao iniciar',
    settings_notifications:'Notificações do sistema', settings_notifications_sub:'Aviso ao mudar de modo',
    settings_security:'Segurança', settings_changepw:'Alterar senha',
    notes_placeholder:'Escreva suas notas aqui…', notes_hint:'Notas rápidas — ideias, lembretes. Salvo automaticamente.',
    auth_login:'Entrar', auth_register:'Criar conta', auth_email:'E-mail', auth_password:'Senha', auth_forgot:'Esqueceu a senha?',
    cmd_placeholder:'Buscar comando…', cmd_no_results:'Sem resultados',
    notif_grant:'Ativar notificações', notif_focus_done:'Pomodoro concluído!', notif_break_done:'Pausa encerrada',
    notif_take_break:'Faça uma pausa. Você merece.', notif_back_to_work:'Hora de voltar ao trabalho. Vamos!',
  },
};

// Detect language from browser
const SUPPORTED = ['es','en','fr','de','pt'];
function detectLang() {
  const saved = localStorage.getItem('fn_lang');
  if (saved && SUPPORTED.includes(saved)) return saved;
  const browser = (navigator.language || 'es').split('-')[0].toLowerCase();
  return SUPPORTED.includes(browser) ? browser : 'es';
}

let _lang = detectLang();
let _t = STRINGS[_lang];

export function t(key) {
  return _t[key] || STRINGS.es[key] || key;
}

export function getLang() { return _lang; }

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  _lang = lang;
  _t = STRINGS[_lang];
  localStorage.setItem('fn_lang', lang);
  applyToDOM();
}

export function getSupportedLangs() {
  return [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
  ];
}

// Apply translations to elements with data-i18n attribute
export function applyToDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}
