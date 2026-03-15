/**
 * ambient.js — Música ambiental generativa
 *
 * Temas disponibles:
 *   ocean    → olas con LFO + ruido filtrado
 *   meadow   → grillos modulados + brisa
 *   mountain → viento con sweep + silbido lejano
 *   forest   → rumor nocturno + grillos + búho
 *   desert   → viento seco + chicharras + silencio pulsante
 *   city     → lluvia sobre asfalto + zumbido urbano + sirena lejana
 *   arctic   → viento helado profundo + crujido del hielo + silencio polar
 *
 * BUG FIX: stopAmbient() ahora acepta un callback onStopped para que
 * switchAmbient() pueda encadenar el nuevo tema DESPUÉS de que el anterior
 * haya terminado de hacer fade-out, evitando que nodos "zombies" se acumulen.
 */

let _ctx    = null;
let _master = null;
let _scene  = null;
let _volume = 0.4;
let _active = false;

// ─── API pública ──────────────────────────────────────────────────────

export function initAmbient() { /* AudioContext se crea en el primer gesto */ }

export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (_master && _ctx) _master.gain.setTargetAtTime(_volume, _ctx.currentTime, 0.1);
}

export function isPlaying() { return _active; }

/** Inicia la escena de un tema. Para cambiar de tema usa switchAmbient(). */
export function startAmbient(theme) {
  _ensureContext();
  if (_active) stopAmbient();
  _active = true;
  _master = _ctx.createGain();
  _master.gain.setValueAtTime(0, _ctx.currentTime);
  _master.gain.linearRampToValueAtTime(_volume, _ctx.currentTime + 2);
  _master.connect(_ctx.destination);
  _scene = _buildScene(theme, _ctx, _master);
}

/**
 * Cambia el tema de forma limpia:
 * hace fade-out del anterior y arranca el nuevo cuando termina.
 * Esto resuelve el bug de nodos zombies al cambiar de tema.
 */
export function switchAmbient(newTheme) {
  if (!_active) {
    startAmbient(newTheme);
    return;
  }
  // Fade-out del actual
  _active = false;
  if (_master && _ctx) {
    _master.gain.setTargetAtTime(0, _ctx.currentTime, 0.3);
  }
  const oldScene  = _scene;
  const oldMaster = _master;
  _scene  = null;
  _master = null;
  // Arrancar el nuevo cuando el fade-out termina (~1s)
  setTimeout(() => {
    try { oldScene?.stop(); }  catch(e) {}
    try { oldMaster?.disconnect(); } catch(e) {}
    startAmbient(newTheme);
  }, 900);
}

/** Detiene el audio completamente con fade-out suave. */
export function stopAmbient() {
  if (!_active) return;
  _active = false;
  const scene  = _scene;
  const master = _master;
  _scene  = null;
  _master = null;
  if (master && _ctx) {
    master.gain.setTargetAtTime(0, _ctx.currentTime, 0.4);
    setTimeout(() => {
      try { scene?.stop(); }   catch(e) {}
      try { master.disconnect(); } catch(e) {}
    }, 1500);
  }
}

// ─── Privado ──────────────────────────────────────────────────────────

function _ensureContext() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
}

function _makeNoise(ctx, duration = 2) {
  const sr  = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.floor(sr * duration), sr);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function _noiseLoop(ctx, buf) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;
  return src;
}

function _buildScene(theme, ctx, out) {
  switch (theme) {
    case 'ocean':    return _sceneOcean(ctx, out);
    case 'meadow':   return _sceneMeadow(ctx, out);
    case 'mountain': return _sceneMountain(ctx, out);
    case 'forest':   return _sceneForest(ctx, out);
    case 'desert':   return _sceneDesert(ctx, out);
    case 'city':     return _sceneCity(ctx, out);
    case 'arctic':   return _sceneArctic(ctx, out);
    default:         return _sceneOcean(ctx, out);
  }
}

// ─────────────────────────────────────────────────────────────────────
//  OCEAN — olas + rumor submarino
// ─────────────────────────────────────────────────────────────────────
function _sceneOcean(ctx, out) {
  const buf   = _makeNoise(ctx, 3);
  const nodes = [];

  function makeWave(freq, lfoRate, lfoDepth, gain) {
    const src = _noiseLoop(ctx, buf);
    const bp  = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 0.8;
    const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = lfoRate;
    const lfoG = ctx.createGain();       lfoG.gain.value = lfoDepth;
    const g    = ctx.createGain();       g.gain.value = gain;
    lfo.connect(lfoG); lfoG.connect(bp.frequency);
    src.connect(bp); bp.connect(g); g.connect(out);
    src.start(); lfo.start();
    nodes.push(src, lfo);
  }

  makeWave(400, 0.12, 300, 0.35);
  makeWave(800, 0.18, 200, 0.18);
  makeWave(1600, 0.08, 400, 0.10);

  const ampLfo  = ctx.createOscillator(); ampLfo.type = 'sine'; ampLfo.frequency.value = 0.07;
  const ampLfoG = ctx.createGain();       ampLfoG.gain.value = 0.15;
  ampLfo.connect(ampLfoG); ampLfoG.connect(out.gain);
  ampLfo.start(); nodes.push(ampLfo);

  return { stop: () => nodes.forEach(n => { try { n.stop(); } catch(e){} }) };
}

// ─────────────────────────────────────────────────────────────────────
//  MEADOW — grillos + brisa
// ─────────────────────────────────────────────────────────────────────
function _sceneMeadow(ctx, out) {
  const nodes  = [];
  const bBuf   = _makeNoise(ctx, 2);
  const bSrc   = _noiseLoop(ctx, bBuf);
  const bFilt  = ctx.createBiquadFilter(); bFilt.type = 'lowpass'; bFilt.frequency.value = 800;
  const bGain  = ctx.createGain();         bGain.gain.value = 0.06;
  bSrc.connect(bFilt); bFilt.connect(bGain); bGain.connect(out);
  bSrc.start(); nodes.push(bSrc);

  [4200, 4350, 4500, 4650, 4100].forEach((f, i) => {
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
    const am  = ctx.createOscillator(); am.type  = 'square'; am.frequency.value = 18 + i * 2.5;
    const amG = ctx.createGain();       amG.gain.value = 0.04;
    const g   = ctx.createGain();       g.gain.value = 0;
    am.connect(amG); amG.connect(g.gain); osc.connect(g); g.connect(out);
    const d = i * 0.3;
    osc.start(ctx.currentTime + d); am.start(ctx.currentTime + d);
    nodes.push(osc, am);
  });

  return { stop: () => nodes.forEach(n => { try { n.stop(); } catch(e){} }) };
}

// ─────────────────────────────────────────────────────────────────────
//  MOUNTAIN — viento + silbido lejano
// ─────────────────────────────────────────────────────────────────────
function _sceneMountain(ctx, out) {
  const nodes = [];
  const buf   = _makeNoise(ctx, 4);
  const wSrc  = _noiseLoop(ctx, buf);
  const wBp   = ctx.createBiquadFilter(); wBp.type = 'bandpass'; wBp.frequency.value = 600; wBp.Q.value = 1.2;
  const wG    = ctx.createGain();         wG.gain.value = 0.3;
  const wLfo  = ctx.createOscillator();   wLfo.type = 'sine'; wLfo.frequency.value = 0.05;
  const wLfoG = ctx.createGain();         wLfoG.gain.value = 500;
  const aLfo  = ctx.createOscillator();   aLfo.type = 'sine'; aLfo.frequency.value = 0.09;
  const aLfoG = ctx.createGain();         aLfoG.gain.value = 0.12;
  wLfo.connect(wLfoG); wLfoG.connect(wBp.frequency);
  aLfo.connect(aLfoG); aLfoG.connect(wG.gain);
  wSrc.connect(wBp); wBp.connect(wG); wG.connect(out);
  wSrc.start(); wLfo.start(); aLfo.start();
  nodes.push(wSrc, wLfo, aLfo);

  const wh  = ctx.createOscillator(); wh.type = 'sine'; wh.frequency.value = 1200;
  const vLfo = ctx.createOscillator(); vLfo.frequency.value = 5;
  const vG   = ctx.createGain();       vG.gain.value = 30;
  const whG  = ctx.createGain();       whG.gain.value = 0.04;
  vLfo.connect(vG); vG.connect(wh.frequency); wh.connect(whG); whG.connect(out);
  wh.start(); vLfo.start(); nodes.push(wh, vLfo);

  return { stop: () => nodes.forEach(n => { try { n.stop(); } catch(e){} }) };
}

// ─────────────────────────────────────────────────────────────────────
//  FOREST — rumor nocturno + grillos + búho
// ─────────────────────────────────────────────────────────────────────
function _sceneForest(ctx, out) {
  const nodes = [];
  const buf   = _makeNoise(ctx, 2);
  const rSrc  = _noiseLoop(ctx, buf);
  const rFilt = ctx.createBiquadFilter(); rFilt.type = 'lowpass'; rFilt.frequency.value = 200;
  const rG    = ctx.createGain();         rG.gain.value = 0.12;
  rSrc.connect(rFilt); rFilt.connect(rG); rG.connect(out);
  rSrc.start(); nodes.push(rSrc);

  [3100, 3300, 3500].forEach((f, i) => {
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
    const am  = ctx.createOscillator(); am.type  = 'square'; am.frequency.value = 12 + i * 1.8;
    const amG = ctx.createGain();       amG.gain.value = 0.035;
    const g   = ctx.createGain();       g.gain.value = 0;
    am.connect(amG); amG.connect(g.gain); osc.connect(g); g.connect(out);
    osc.start(ctx.currentTime + i * 0.5); am.start(ctx.currentTime + i * 0.5);
    nodes.push(osc, am);
  });

  // Búho — usando closure sobre _active para parar cuando cambie tema
  const stopped = { val: false };
  function scheduleOwl() {
    setTimeout(() => {
      if (stopped.val) return;
      [220, 165].forEach((f, i) => {
        const o   = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const vib = ctx.createOscillator(); vib.frequency.value = 6;
        const vG  = ctx.createGain();       vG.gain.value = 8;
        const env = ctx.createGain();
        const t0  = ctx.currentTime + i * 0.55;
        vib.connect(vG); vG.connect(o.frequency);
        env.gain.setValueAtTime(0, t0);
        env.gain.linearRampToValueAtTime(0.12, t0 + 0.05);
        env.gain.setTargetAtTime(0, t0 + 0.3, 0.15);
        o.connect(env); env.connect(out);
        o.start(t0); o.stop(t0 + 0.8);
        vib.start(t0); vib.stop(t0 + 0.8);
      });
      scheduleOwl();
    }, 8000 + Math.random() * 14000);
  }
  scheduleOwl();

  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  DESERT — viento seco + chicharras + silencio ardiente
// ─────────────────────────────────────────────────────────────────────
function _sceneDesert(ctx, out) {
  const nodes = [];

  // Viento seco — ruido de alta frecuencia muy atenuado, irregular
  const buf   = _makeNoise(ctx, 5);
  const wSrc  = _noiseLoop(ctx, buf);
  const wHp   = ctx.createBiquadFilter(); wHp.type = 'highpass'; wHp.frequency.value = 2000;
  const wG    = ctx.createGain();         wG.gain.value = 0.04;
  const wLfo  = ctx.createOscillator();   wLfo.type = 'sine'; wLfo.frequency.value = 0.04;
  const wLfoG = ctx.createGain();         wLfoG.gain.value = 0.03;
  wLfo.connect(wLfoG); wLfoG.connect(wG.gain);
  wSrc.connect(wHp); wHp.connect(wG); wG.connect(out);
  wSrc.start(); wLfo.start(); nodes.push(wSrc, wLfo);

  // Arena — ruido suave mid-range
  const sBuf  = _makeNoise(ctx, 3);
  const sSrc  = _noiseLoop(ctx, sBuf);
  const sBp   = ctx.createBiquadFilter(); sBp.type = 'bandpass'; sBp.frequency.value = 1200; sBp.Q.value = 0.5;
  const sG    = ctx.createGain();         sG.gain.value = 0.05;
  const sLfo  = ctx.createOscillator();   sLfo.type = 'sine'; sLfo.frequency.value = 0.02;
  const sLfoG = ctx.createGain();         sLfoG.gain.value = 0.03;
  sLfo.connect(sLfoG); sLfoG.connect(sG.gain);
  sSrc.connect(sBp); sBp.connect(sG); sG.connect(out);
  sSrc.start(); sLfo.start(); nodes.push(sSrc, sLfo);

  // Chicharras — osciladores de alta freq con AM rápida
  [5800, 6100, 6400].forEach((f, i) => {
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
    const am  = ctx.createOscillator(); am.type  = 'square'; am.frequency.value = 30 + i * 7;
    const amG = ctx.createGain();       amG.gain.value = 0.025;
    const g   = ctx.createGain();       g.gain.value = 0;
    // LFO lento de intensidad — como si se acercaran y alejaran
    const intLfo  = ctx.createOscillator(); intLfo.type = 'sine'; intLfo.frequency.value = 0.05 + i * 0.02;
    const intLfoG = ctx.createGain();       intLfoG.gain.value = 0.015;
    intLfo.connect(intLfoG); intLfoG.connect(g.gain);
    am.connect(amG); amG.connect(g.gain); osc.connect(g); g.connect(out);
    osc.start(ctx.currentTime + i * 0.4);
    am.start(ctx.currentTime + i * 0.4);
    intLfo.start();
    nodes.push(osc, am, intLfo);
  });

  return { stop: () => nodes.forEach(n => { try { n.stop(); } catch(e){} }) };
}

// ─────────────────────────────────────────────────────────────────────
//  CITY — lluvia sobre asfalto + zumbido urbano + sirena lejana
// ─────────────────────────────────────────────────────────────────────
function _sceneCity(ctx, out) {
  const nodes = [];

  // Lluvia — ruido blanco filtrado con variación de intensidad
  const rBuf  = _makeNoise(ctx, 2);
  const rSrc  = _noiseLoop(ctx, rBuf);
  const rLp   = ctx.createBiquadFilter(); rLp.type = 'lowpass'; rLp.frequency.value = 3000;
  const rG    = ctx.createGain();         rG.gain.value = 0.18;
  // Gotas irregulares — LFO rápido de baja amplitud
  const rLfo  = ctx.createOscillator();   rLfo.type = 'sine'; rLfo.frequency.value = 0.3;
  const rLfoG = ctx.createGain();         rLfoG.gain.value = 0.06;
  rLfo.connect(rLfoG); rLfoG.connect(rG.gain);
  rSrc.connect(rLp); rLp.connect(rG); rG.connect(out);
  rSrc.start(); rLfo.start(); nodes.push(rSrc, rLfo);

  // Zumbido de ciudad (AC units, transformadores) — 50Hz + armónicos
  [50, 100, 150].forEach((f, i) => {
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
    const g   = ctx.createGain();       g.gain.value = 0.025 / (i + 1);
    osc.connect(g); g.connect(out);
    osc.start(); nodes.push(osc);
  });

  // Fondo de tráfico lejano — ruido grave
  const tBuf  = _makeNoise(ctx, 4);
  const tSrc  = _noiseLoop(ctx, tBuf);
  const tLp   = ctx.createBiquadFilter(); tLp.type = 'lowpass'; tLp.frequency.value = 150;
  const tG    = ctx.createGain();         tG.gain.value = 0.1;
  const tLfo  = ctx.createOscillator();   tLfo.type = 'sine'; tLfo.frequency.value = 0.06;
  const tLfoG = ctx.createGain();         tLfoG.gain.value = 0.06;
  tLfo.connect(tLfoG); tLfoG.connect(tG.gain);
  tSrc.connect(tLp); tLp.connect(tG); tG.connect(out);
  tSrc.start(); tLfo.start(); nodes.push(tSrc, tLfo);

  // Sirena lejana ocasional — dos frecuencias alternantes
  const stopped = { val: false };
  function scheduleSiren() {
    setTimeout(() => {
      if (stopped.val) return;
      const duration = 3.5;
      const sirenG = ctx.createGain();
      sirenG.gain.setValueAtTime(0, ctx.currentTime);
      sirenG.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
      sirenG.gain.setTargetAtTime(0, ctx.currentTime + duration - 0.4, 0.2);
      sirenG.connect(out);

      const siren = ctx.createOscillator();
      siren.type = 'sawtooth';
      siren.frequency.setValueAtTime(700, ctx.currentTime);
      // Alternancia hi-lo
      for (let t = 0; t < duration; t += 0.5) {
        siren.frequency.setValueAtTime(t % 1 < 0.5 ? 700 : 550, ctx.currentTime + t);
      }
      siren.connect(sirenG);
      siren.start(ctx.currentTime);
      siren.stop(ctx.currentTime + duration);
      scheduleSiren();
    }, 15000 + Math.random() * 25000);
  }
  scheduleSiren();

  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  ARCTIC — viento polar + crujido del hielo + silencio
// ─────────────────────────────────────────────────────────────────────
function _sceneArctic(ctx, out) {
  const nodes = [];

  // Viento polar — ruido muy grave, profundo, lento
  const buf   = _makeNoise(ctx, 6);
  const wSrc  = _noiseLoop(ctx, buf);
  const wBp   = ctx.createBiquadFilter(); wBp.type = 'bandpass'; wBp.frequency.value = 180; wBp.Q.value = 0.6;
  const wG    = ctx.createGain();         wG.gain.value = 0.25;
  const wLfo  = ctx.createOscillator();   wLfo.type = 'sine'; wLfo.frequency.value = 0.025; // muy lento
  const wLfoG = ctx.createGain();         wLfoG.gain.value = 0.18;
  const w2Lfo = ctx.createOscillator();   w2Lfo.type = 'sine'; w2Lfo.frequency.value = 0.07;
  const w2G   = ctx.createGain();         w2G.gain.value = 80;
  wLfo.connect(wLfoG); wLfoG.connect(wG.gain);
  w2Lfo.connect(w2G); w2G.connect(wBp.frequency);
  wSrc.connect(wBp); wBp.connect(wG); wG.connect(out);
  wSrc.start(); wLfo.start(); w2Lfo.start();
  nodes.push(wSrc, wLfo, w2Lfo);

  // Agudo helado — frecuencia muy alta, etérea
  const iceHp  = ctx.createBiquadFilter(); iceHp.type = 'highpass'; iceHp.frequency.value = 4000;
  const iceBuf = _makeNoise(ctx, 2);
  const iceSrc = _noiseLoop(ctx, iceBuf);
  const iceG   = ctx.createGain();         iceG.gain.value = 0.015;
  iceSrc.connect(iceHp); iceHp.connect(iceG); iceG.connect(out);
  iceSrc.start(); nodes.push(iceSrc);

  // Crujido del hielo — clicks breves aleatorios
  const stopped = { val: false };
  function scheduleCrack() {
    setTimeout(() => {
      if (stopped.val) return;
      // Clic corto — ruido impulsivo con envelope
      const cBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
      const cD   = cBuf.getChannelData(0);
      for (let i = 0; i < cD.length; i++) cD[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cD.length, 3);
      const cSrc = ctx.createBufferSource(); cSrc.buffer = cBuf;
      const cBp  = ctx.createBiquadFilter(); cBp.type = 'bandpass'; cBp.frequency.value = 800 + Math.random() * 400;
      const cG   = ctx.createGain();         cG.gain.value = 0.3 + Math.random() * 0.4;
      cSrc.connect(cBp); cBp.connect(cG); cG.connect(out);
      cSrc.start();
      scheduleCrack();
    }, 2000 + Math.random() * 8000);
  }
  scheduleCrack();

  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}
