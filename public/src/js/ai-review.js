/**
 * ai-review.js — Informe semanal generado con IA
 *
 * Llama a la API de Claude (claude-sonnet-4-20250514) con los datos
 * de sesiones de la semana y devuelve un análisis personalizado:
 *   - Patrón de horas más productivas
 *   - Días y tareas de mayor/menor rendimiento
 *   - Comparativa con semana anterior
 *   - 3 sugerencias accionables concretas
 *
 * La clave de API de Anthropic se pasa desde server.js,
 * que la inyecta como window.__ANTHROPIC_KEY__ igual que hace
 * con las credenciales de Supabase.
 */

// ── Helpers ────────────────────────────────────────────────────────
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Construye el bloque de datos de sesiones que se envía al modelo.
 * @param {Array} sessions  — objetos { mode, duration, task_name, completed_at }
 * @param {number} dailyGoal
 * @returns {string}
 */
function buildDataBlock(sessions, dailyGoal) {
  // Agrupar por día
  const byDay = {};
  sessions.forEach(s => {
    const day = isoDate(new Date(s.completed_at));
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(s);
  });

  // Resumen por día
  const dayLines = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, daySessions]) => {
      const focusSessions = daySessions.filter(s => s.mode === 'focus');
      const totalMin      = focusSessions.reduce((a, s) => a + s.duration, 0);
      const tasks         = [...new Set(focusSessions.map(s => s.task_name).filter(Boolean))];
      const hours         = daySessions.map(s => new Date(s.completed_at).getHours());
      const avgHour       = hours.length
        ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)
        : null;
      return `  ${day}: ${focusSessions.length} pomodoros (${totalMin} min)` +
             (tasks.length ? `, tareas: [${tasks.slice(0,3).join(', ')}]` : '') +
             (avgHour !== null ? `, hora media: ${avgHour}h` : '');
    });

  // Hora más frecuente
  const allHours = sessions
    .filter(s => s.mode === 'focus')
    .map(s => new Date(s.completed_at).getHours());
  const hourFreq = {};
  allHours.forEach(h => hourFreq[h] = (hourFreq[h] || 0) + 1);
  const peakHour = Object.entries(hourFreq).sort(([,a],[,b]) => b-a)[0]?.[0];

  // Tareas con más pomodoros
  const taskCount = {};
  sessions.filter(s => s.mode === 'focus' && s.task_name).forEach(s => {
    taskCount[s.task_name] = (taskCount[s.task_name] || 0) + 1;
  });
  const topTasks = Object.entries(taskCount)
    .sort(([,a],[,b]) => b-a)
    .slice(0, 5)
    .map(([name, count]) => `${name} (${count})`);

  const totalFocus = sessions.filter(s => s.mode === 'focus').length;

  return [
    `Objetivo diario: ${dailyGoal} pomodoros`,
    `Total sesiones de enfoque esta semana: ${totalFocus}`,
    `Objetivo semanal teórico (${dailyGoal} × 7): ${dailyGoal * 7}`,
    peakHour !== undefined ? `Hora de mayor actividad: ${peakHour}:00-${(parseInt(peakHour)+1) % 24}:00h` : '',
    topTasks.length ? `Tareas más trabajadas: ${topTasks.join(', ')}` : '',
    '',
    'Desglose por día:',
    ...dayLines,
  ].filter(Boolean).join('\n');
}

/**
 * Llama a la API de Claude y obtiene el informe en streaming.
 * @param {Array}    sessions
 * @param {number}   dailyGoal
 * @param {Function} onChunk   — callback con cada fragmento de texto recibido
 * @param {Function} onDone    — callback cuando termina
 * @param {Function} onError   — callback de error
 */
export async function generateWeeklyReview({ sessions, dailyGoal, onChunk, onDone, onError }) {
  const apiKey = window.__ANTHROPIC_KEY__;
  if (!apiKey) {
    onError(new Error('Clave de API de Anthropic no configurada. Añade ANTHROPIC_KEY al .env'));
    return;
  }

  const dataBlock = buildDataBlock(sessions, dailyGoal);
  const today = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });

  const prompt = `Eres un coach de productividad especializado en la técnica Pomodoro. \
Analiza los datos de sesiones de trabajo de esta semana y genera un informe personalizado, \
conciso y útil en español.

DATOS DE LA SEMANA (${today}):
${dataBlock}

Genera un informe con estas 4 secciones exactas, sin usar markdown pesado, \
solo texto limpio con emojis para los títulos:

🕐 MEJOR MOMENTO DEL DÍA
En qué franja horaria trabajas mejor según los datos. Sé concreto.

📈 LO QUE FUNCIONÓ
2-3 observaciones positivas basadas en los datos. Con números reales.

⚡ ÁREAS DE MEJORA
2 observaciones concretas sobre días flojos, tareas incompletas o patrones problemáticos.

🎯 3 SUGERENCIAS PARA LA PRÓXIMA SEMANA
Tres recomendaciones específicas y accionables, basadas en LOS DATOS, no genéricas. \
Cada una en una línea comenzando con un número.

Sé directo, sin relleno. Máximo 280 palabras en total.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':            'application/json',
        'x-api-key':               apiKey,
        'anthropic-version':       '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 700,
        stream:     true,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }

    // ── Parse SSE stream ──────────────────────────────────────────
    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // incomplete last line stays in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const evt = JSON.parse(data);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            onChunk(evt.delta.text);
          }
          if (evt.type === 'message_stop') {
            onDone();
            return;
          }
        } catch { /* non-JSON line — skip */ }
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}
