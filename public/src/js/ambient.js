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
    case 'space':    return _sceneSpace(ctx, out);
    case 'deep':     return _sceneDeep(ctx, out);
    case 'volcano':  return _sceneVolcano(ctx, out);
    case 'rain':     return _sceneRain(ctx, out);
    case 'japan':    return _sceneJapan(ctx, out);
    case 'swamp':    return _sceneSwamp(ctx, out);
    case 'cave':     return _sceneCave(ctx, out);
    case 'underarctic': return _sceneUnderArctic(ctx, out);
    case 'savanna':  return _sceneSavanna(ctx, out);
    case 'alps':     return _sceneAlps(ctx, out);
    case 'festival': return _sceneFestival(ctx, out);
    case 'jungle':   return _sceneJungle(ctx, out);
    case 'mars':     return _sceneMars(ctx, out);
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

// ─────────────────────────────────────────────────────────────────────
//  SPACE — hum cósmico + pulso estelar + silencio profundo
// ─────────────────────────────────────────────────────────────────────
function _sceneSpace(ctx, out) {
  const nodes = [];

  // Hum de nave estelar — osciladores graves muy suaves
  [[55, 0.08], [110, 0.04], [165, 0.02]].forEach(([f, vol]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.value = vol;
    o.connect(g); g.connect(out);
    o.start(); nodes.push(o);
  });

  // Pulso lento (warp drive idle) — AM muy lenta
  const pulse = ctx.createOscillator(); pulse.type = 'sine'; pulse.frequency.value = 55;
  const pulseAM = ctx.createOscillator(); pulseAM.type = 'sine'; pulseAM.frequency.value = 0.08;
  const pulseAMG = ctx.createGain(); pulseAMG.gain.value = 0.06;
  const pulseG = ctx.createGain(); pulseG.gain.value = 0.0;
  pulseAM.connect(pulseAMG); pulseAMG.connect(pulseG.gain);
  pulse.connect(pulseG); pulseG.connect(out);
  pulse.start(); pulseAM.start();
  nodes.push(pulse, pulseAM);

  // Chispa estelar ocasional — clic breve de alta freq
  const stopped = { val: false };
  function scheduleSpark() {
    setTimeout(() => {
      if (stopped.val) return;
      const freq = 3000 + Math.random() * 5000;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.31);
      scheduleSpark();
    }, 3000 + Math.random() * 9000);
  }
  scheduleSpark();

  // Ruido cósmico suave — muy atenuado, highpass
  const buf = _makeNoise(ctx, 4);
  const nSrc = _noiseLoop(ctx, buf);
  const nHp = ctx.createBiquadFilter(); nHp.type = 'highpass'; nHp.frequency.value = 8000;
  const nG = ctx.createGain(); nG.gain.value = 0.008;
  nSrc.connect(nHp); nHp.connect(nG); nG.connect(out);
  nSrc.start(); nodes.push(nSrc);

  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  DEEP OCEAN — presión abisal + criaturas bioluminiscentes
// ─────────────────────────────────────────────────────────────────────
function _sceneDeep(ctx, out) {
  const nodes = [];

  // Presión abisal — ruido muy grave y profundo
  const buf1 = _makeNoise(ctx, 6);
  const dSrc = _noiseLoop(ctx, buf1);
  const dLp = ctx.createBiquadFilter(); dLp.type = 'lowpass'; dLp.frequency.value = 60;
  const dG = ctx.createGain(); dG.gain.value = 0.35;
  const dLfo = ctx.createOscillator(); dLfo.type = 'sine'; dLfo.frequency.value = 0.018;
  const dLfoG = ctx.createGain(); dLfoG.gain.value = 0.2;
  dLfo.connect(dLfoG); dLfoG.connect(dG.gain);
  dSrc.connect(dLp); dLp.connect(dG); dG.connect(out);
  dSrc.start(); dLfo.start(); nodes.push(dSrc, dLfo);

  // Corriente submarina — mid-range muy filtrado
  const buf2 = _makeNoise(ctx, 3);
  const cSrc = _noiseLoop(ctx, buf2);
  const cBp = ctx.createBiquadFilter(); cBp.type = 'bandpass'; cBp.frequency.value = 120; cBp.Q.value = 0.4;
  const cG = ctx.createGain(); cG.gain.value = 0.08;
  cSrc.connect(cBp); cBp.connect(cG); cG.connect(out);
  cSrc.start(); nodes.push(cSrc);

  // Pings de sonar / criatura bioluminiscente
  const stopped = { val: false };
  function schedulePing() {
    setTimeout(() => {
      if (stopped.val) return;
      const freq = 600 + Math.random() * 800;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      o.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + 1.5);
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 1.9);
      schedulePing();
    }, 5000 + Math.random() * 12000);
  }
  schedulePing();

  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  VOLCANO — retumbo telúrico + crepitar de lava + vapor
// ─────────────────────────────────────────────────────────────────────
function _sceneVolcano(ctx, out) {
  const nodes = [];
  const buf = _makeNoise(ctx, 5);
  const vSrc = _noiseLoop(ctx, buf);
  const vLp  = ctx.createBiquadFilter(); vLp.type = 'lowpass'; vLp.frequency.value = 80;
  const vG   = ctx.createGain(); vG.gain.value = 0.32;
  const vLfo = ctx.createOscillator(); vLfo.type = 'sine'; vLfo.frequency.value = 0.035;
  const vLfoG= ctx.createGain(); vLfoG.gain.value = 0.22;
  vLfo.connect(vLfoG); vLfoG.connect(vG.gain);
  vSrc.connect(vLp); vLp.connect(vG); vG.connect(out);
  vSrc.start(); vLfo.start(); nodes.push(vSrc, vLfo);

  const fBuf = _makeNoise(ctx, 2);
  const fSrc = _noiseLoop(ctx, fBuf);
  const fBp  = ctx.createBiquadFilter(); fBp.type = 'bandpass'; fBp.frequency.value = 900; fBp.Q.value = 0.7;
  const fG   = ctx.createGain(); fG.gain.value = 0.07;
  const fLfo = ctx.createOscillator(); fLfo.type = 'sine'; fLfo.frequency.value = 4.5;
  const fLfoG= ctx.createGain(); fLfoG.gain.value = 0.04;
  fLfo.connect(fLfoG); fLfoG.connect(fG.gain);
  fSrc.connect(fBp); fBp.connect(fG); fG.connect(out);
  fSrc.start(); fLfo.start(); nodes.push(fSrc, fLfo);

  const stopped = { val: false };
  function scheduleSteam() {
    setTimeout(() => {
      if (stopped.val) return;
      const dur = 0.4 + Math.random() * 0.8;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(2200, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + dur);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(out); o.start(); o.stop(ctx.currentTime + dur + 0.05);
      scheduleSteam();
    }, 4000 + Math.random() * 10000);
  }
  scheduleSteam();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  RAIN — lluvia de otoño + gotas en cristal + trueno lejano
// ─────────────────────────────────────────────────────────────────────
function _sceneRain(ctx, out) {
  const nodes = [];
  [[1500,1.2,0.15],[3000,0.8,0.08],[600,1.8,0.10]].forEach(([freq,Q,vol]) => {
    const buf = _makeNoise(ctx, 2), src = _noiseLoop(ctx, buf);
    const bp  = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = Q;
    const g   = ctx.createGain(); g.gain.value = vol;
    src.connect(bp); bp.connect(g); g.connect(out); src.start(); nodes.push(src);
  });
  const stopped = { val: false };
  function scheduleDrop() {
    setTimeout(() => {
      if (stopped.val) return;
      const f = 1200 + Math.random() * 1800;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      o.connect(g); g.connect(out); o.start(); o.stop(ctx.currentTime + 0.13);
      scheduleDrop();
    }, 80 + Math.random() * 280);
  }
  scheduleDrop();
  function scheduleThunder() {
    setTimeout(() => {
      if (stopped.val) return;
      const buf2 = _makeNoise(ctx, 1), src2 = ctx.createBufferSource(); src2.buffer = buf2;
      const lp   = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 120;
      const g2   = ctx.createGain(); const t = ctx.currentTime;
      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(0.40, t + 0.08);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
      src2.connect(lp); lp.connect(g2); g2.connect(out); src2.start(t); src2.stop(t + 2.6);
      scheduleThunder();
    }, 18000 + Math.random() * 30000);
  }
  scheduleThunder();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  JAPAN — viento entre bambú + campana de templo + grillo solitario
// ─────────────────────────────────────────────────────────────────────
function _sceneJapan(ctx, out) {
  const nodes = [];
  const buf = _makeNoise(ctx, 3), wSrc = _noiseLoop(ctx, buf);
  const wBp  = ctx.createBiquadFilter(); wBp.type = 'bandpass'; wBp.frequency.value = 1200; wBp.Q.value = 2.5;
  const wG   = ctx.createGain(); wG.gain.value = 0.04;
  const wLfo = ctx.createOscillator(); wLfo.type = 'sine'; wLfo.frequency.value = 0.12;
  const wLfoG= ctx.createGain(); wLfoG.gain.value = 0.025;
  wLfo.connect(wLfoG); wLfoG.connect(wG.gain);
  wSrc.connect(wBp); wBp.connect(wG); wG.connect(out);
  wSrc.start(); wLfo.start(); nodes.push(wSrc, wLfo);

  const stopped = { val: false };
  function scheduleBell() {
    setTimeout(() => {
      if (stopped.val) return;
      [[220,0.16,3.5],[605,0.07,2.2],[990,0.03,1.5]].forEach(([f,vol,dur],i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.05;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.1);
      });
      scheduleBell();
    }, 22000 + Math.random() * 28000);
  }
  scheduleBell();

  const osc = ctx.createOscillator(), amO = ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 4200;
  amO.type = 'square'; amO.frequency.value = 14;
  const amG = ctx.createGain(); amG.gain.value = 0.025;
  const gG  = ctx.createGain(); gG.gain.value = 0;
  amO.connect(amG); amG.connect(gG.gain); osc.connect(gG); gG.connect(out);
  osc.start(); amO.start(); nodes.push(osc, amO);

  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  SWAMP — croar de ranas + burbujas de barro + fuego fatuo
// ─────────────────────────────────────────────────────────────────────
function _sceneSwamp(ctx, out) {
  const nodes = [];
  // Ambiente pantanoso — ruido muy grave filtrado, húmedo
  const buf = _makeNoise(ctx, 4);
  const wSrc = _noiseLoop(ctx, buf);
  const wLp  = ctx.createBiquadFilter(); wLp.type = 'lowpass'; wLp.frequency.value = 300;
  const wG   = ctx.createGain(); wG.gain.value = 0.08;
  wSrc.connect(wLp); wLp.connect(wG); wG.connect(out);
  wSrc.start(); nodes.push(wSrc);
  // Ranas — AM a frecuencia de croar
  [320, 290, 340].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const am = ctx.createOscillator(); am.type = 'square'; am.frequency.value = 1.8 + i * 0.4;
    const amG = ctx.createGain(); amG.gain.value = 0.03;
    const g   = ctx.createGain(); g.gain.value = 0;
    am.connect(amG); amG.connect(g.gain);
    o.connect(g); g.connect(out);
    o.start(ctx.currentTime + i * 1.2); am.start(ctx.currentTime + i * 1.2);
    nodes.push(o, am);
  });
  // Burbujas de barro
  const stopped = { val: false };
  function scheduleBubble() {
    setTimeout(() => {
      if (stopped.val) return;
      const f = 80 + Math.random() * 120;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(f * 2.5, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.connect(g); g.connect(out); o.start(); o.stop(ctx.currentTime + 0.16);
      scheduleBubble();
    }, 600 + Math.random() * 2000);
  }
  scheduleBubble();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  CAVE — resonancia mineral + gotas en eco + silencio subterráneo
// ─────────────────────────────────────────────────────────────────────
function _sceneCave(ctx, out) {
  const nodes = [];
  // Resonancia grave de caverna — fundamental muy baja con reverb simulado
  [[55, 0.06], [110, 0.03], [165, 0.015]].forEach(([f, vol]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.value = vol;
    o.connect(g); g.connect(out); o.start(); nodes.push(o);
  });
  // Silencio subterráneo — ruido muy atenuado
  const buf = _makeNoise(ctx, 3);
  const nSrc = _noiseLoop(ctx, buf);
  const nLp  = ctx.createBiquadFilter(); nLp.type = 'lowpass'; nLp.frequency.value = 200;
  const nG   = ctx.createGain(); nG.gain.value = 0.025;
  nSrc.connect(nLp); nLp.connect(nG); nG.connect(out); nSrc.start(); nodes.push(nSrc);
  // Gotas con eco — clic + reverb simulado (delay + feedback)
  const stopped = { val: false };
  function scheduleDrop() {
    setTimeout(() => {
      if (stopped.val) return;
      const delay = ctx.createDelay(2.0); delay.delayTime.value = 0.35;
      const fbGain = ctx.createGain(); fbGain.gain.value = 0.45;
      delay.connect(fbGain); fbGain.connect(delay);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 1400 + Math.random() * 600;
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.14, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.connect(g); g.connect(delay); delay.connect(out); g.connect(out);
      o.start(t); o.stop(t + 0.11);
      scheduleDrop();
    }, 1500 + Math.random() * 4000);
  }
  scheduleDrop();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  UNDERWATER ARCTIC — canto de beluga + hielo desde abajo
// ─────────────────────────────────────────────────────────────────────
function _sceneUnderArctic(ctx, out) {
  const nodes = [];
  const buf = _makeNoise(ctx, 5);
  const wSrc = _noiseLoop(ctx, buf);
  const wBp  = ctx.createBiquadFilter(); wBp.type = 'bandpass'; wBp.frequency.value = 200; wBp.Q.value = 0.5;
  const wG   = ctx.createGain(); wG.gain.value = 0.18;
  wSrc.connect(wBp); wBp.connect(wG); wG.connect(out); wSrc.start(); nodes.push(wSrc);
  // Canto de beluga — glissando suave
  const stopped = { val: false };
  function scheduleWhale() {
    setTimeout(() => {
      if (stopped.val) return;
      const startF = 600 + Math.random() * 400;
      const endF   = startF * (0.7 + Math.random() * 0.6);
      const dur    = 1.5 + Math.random() * 2;
      const o = ctx.createOscillator(), vib = ctx.createOscillator();
      const vibG = ctx.createGain(); vibG.gain.value = 15;
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(startF, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(endF, ctx.currentTime + dur);
      vib.frequency.value = 4.5; vib.connect(vibG); vibG.connect(o.frequency);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.2);
      g.gain.setTargetAtTime(0, ctx.currentTime + dur - 0.3, 0.2);
      o.connect(g); g.connect(out);
      o.start(); vib.start(); o.stop(ctx.currentTime + dur + 0.5); vib.stop(ctx.currentTime + dur + 0.5);
      scheduleWhale();
    }, 5000 + Math.random() * 12000);
  }
  scheduleWhale();
  // Crujido del hielo desde abajo — más seco
  function scheduleIce() {
    setTimeout(() => {
      if (stopped.val) return;
      const cBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
      const d = cBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 2);
      const s = ctx.createBufferSource(); s.buffer = cBuf;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1000;
      const g  = ctx.createGain(); g.gain.value = 0.2 + Math.random() * 0.3;
      s.connect(hp); hp.connect(g); g.connect(out); s.start();
      scheduleIce();
    }, 1000 + Math.random() * 5000);
  }
  scheduleIce();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  SAVANNA — grillos africanos + viento seco cálido + pájaro tejedor
// ─────────────────────────────────────────────────────────────────────
function _sceneSavanna(ctx, out) {
  const nodes = [];
  const buf = _makeNoise(ctx, 3);
  const wSrc = _noiseLoop(ctx, buf);
  const wBp  = ctx.createBiquadFilter(); wBp.type = 'bandpass'; wBp.frequency.value = 800; wBp.Q.value = 0.6;
  const wG   = ctx.createGain(); wG.gain.value = 0.05;
  const wLfo = ctx.createOscillator(); wLfo.type = 'sine'; wLfo.frequency.value = 0.06;
  const wLfoG= ctx.createGain(); wLfoG.gain.value = 0.035;
  wLfo.connect(wLfoG); wLfoG.connect(wG.gain);
  wSrc.connect(wBp); wBp.connect(wG); wG.connect(out); wSrc.start(); wLfo.start(); nodes.push(wSrc, wLfo);
  // Grillos africanos — más graves que los de prado
  [3600, 3800, 4000].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const am = ctx.createOscillator(); am.type = 'square'; am.frequency.value = 22 + i * 3;
    const amG = ctx.createGain(); amG.gain.value = 0.03;
    const g   = ctx.createGain(); g.gain.value = 0;
    am.connect(amG); amG.connect(g.gain); o.connect(g); g.connect(out);
    o.start(ctx.currentTime + i * 0.8); am.start(ctx.currentTime + i * 0.8); nodes.push(o, am);
  });
  // Pájaro tejedor — trino rápido ocasional
  const stopped = { val: false };
  function scheduleBird() {
    setTimeout(() => {
      if (stopped.val) return;
      const notes = [1200, 1400, 1100, 1600, 1300, 1000];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.07;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.11);
      });
      scheduleBird();
    }, 6000 + Math.random() * 14000);
  }
  scheduleBird();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  ALPS — viento suave alpino + cencerro lejano + río glaciar
// ─────────────────────────────────────────────────────────────────────
function _sceneAlps(ctx, out) {
  const nodes = [];
  const buf = _makeNoise(ctx, 4);
  const wSrc = _noiseLoop(ctx, buf);
  const wBp  = ctx.createBiquadFilter(); wBp.type = 'bandpass'; wBp.frequency.value = 1400; wBp.Q.value = 1.5;
  const wG   = ctx.createGain(); wG.gain.value = 0.04;
  const wLfo = ctx.createOscillator(); wLfo.type = 'sine'; wLfo.frequency.value = 0.08;
  const wLfoG= ctx.createGain(); wLfoG.gain.value = 0.025;
  wLfo.connect(wLfoG); wLfoG.connect(wG.gain);
  wSrc.connect(wBp); wBp.connect(wG); wG.connect(out); wSrc.start(); wLfo.start(); nodes.push(wSrc, wLfo);
  // Río glaciar — ruido blanco suave, highpass
  const rBuf = _makeNoise(ctx, 2);
  const rSrc = _noiseLoop(ctx, rBuf);
  const rHp  = ctx.createBiquadFilter(); rHp.type = 'highpass'; rHp.frequency.value = 1800;
  const rG   = ctx.createGain(); rG.gain.value = 0.06;
  rSrc.connect(rHp); rHp.connect(rG); rG.connect(out); rSrc.start(); nodes.push(rSrc);
  // Cencerro — tono puro con decaimiento
  const stopped = { val: false };
  function scheduleCowbell() {
    setTimeout(() => {
      if (stopped.val) return;
      const freqs = [420, 560, 630]; // acorde de cencerro
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.01;
        g.gain.setValueAtTime(0.08/(i+1), t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.5 - i * 0.3);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 2.6);
      });
      scheduleCowbell();
    }, 8000 + Math.random() * 20000);
  }
  scheduleCowbell();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  FESTIVAL — bullicio lejano + petardos suaves + música ambiente
// ─────────────────────────────────────────────────────────────────────
function _sceneFestival(ctx, out) {
  const nodes = [];
  // Bullicio de multitud — ruido mid con LFO de emoción
  const buf = _makeNoise(ctx, 2);
  const cSrc = _noiseLoop(ctx, buf);
  const cBp  = ctx.createBiquadFilter(); cBp.type = 'bandpass'; cBp.frequency.value = 1000; cBp.Q.value = 0.4;
  const cG   = ctx.createGain(); cG.gain.value = 0.055;
  const cLfo = ctx.createOscillator(); cLfo.type = 'sine'; cLfo.frequency.value = 0.15;
  const cLfoG= ctx.createGain(); cLfoG.gain.value = 0.03;
  cLfo.connect(cLfoG); cLfoG.connect(cG.gain);
  cSrc.connect(cBp); cBp.connect(cG); cG.connect(out); cSrc.start(); cLfo.start(); nodes.push(cSrc, cLfo);
  // Música ambiente — acorde mayor simple con vibrato
  const chord = [261, 329, 392]; // Do Mayor
  chord.forEach(f => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f; g.gain.value = 0.018;
    o.connect(g); g.connect(out); o.start(); nodes.push(o);
  });
  // Petardos/fuegos artificiales
  const stopped = { val: false };
  function scheduleFirework() {
    setTimeout(() => {
      if (stopped.val) return;
      // Boom grave
      const bBuf = _makeNoise(ctx, 0.3);
      const bSrc = ctx.createBufferSource(); bSrc.buffer = bBuf;
      const bLp  = ctx.createBiquadFilter(); bLp.type = 'lowpass'; bLp.frequency.value = 150;
      const bG   = ctx.createGain();
      bG.gain.setValueAtTime(0.35, ctx.currentTime); bG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      bSrc.connect(bLp); bLp.connect(bG); bG.connect(out); bSrc.start(); bSrc.stop(ctx.currentTime + 0.85);
      // Destello agudo
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 1800 + Math.random() * 1200;
      g.gain.setValueAtTime(0.06, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.connect(g); g.connect(out); o.start(); o.stop(ctx.currentTime + 0.41);
      scheduleFirework();
    }, 8000 + Math.random() * 20000);
  }
  scheduleFirework();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  JUNGLE — aves tropicales + cascada + lluvia de selva
// ─────────────────────────────────────────────────────────────────────
function _sceneJungle(ctx, out) {
  const nodes = [];
  // Cascada — ruido blanco suave continuo, ancho de banda completo
  const buf = _makeNoise(ctx, 3);
  const wSrc = _noiseLoop(ctx, buf);
  const wBp  = ctx.createBiquadFilter(); wBp.type = 'bandpass'; wBp.frequency.value = 2000; wBp.Q.value = 0.3;
  const wG   = ctx.createGain(); wG.gain.value = 0.14;
  wSrc.connect(wBp); wBp.connect(wG); wG.connect(out); wSrc.start(); nodes.push(wSrc);
  // Selva densa — capa grave
  const bBuf = _makeNoise(ctx, 2);
  const bSrc = _noiseLoop(ctx, bBuf);
  const bLp  = ctx.createBiquadFilter(); bLp.type = 'lowpass'; bLp.frequency.value = 400;
  const bG   = ctx.createGain(); bG.gain.value = 0.06;
  bSrc.connect(bLp); bLp.connect(bG); bG.connect(out); bSrc.start(); nodes.push(bSrc);
  // Aves tropicales — llamadas variadas
  const stopped = { val: false };
  const birdSongs = [
    [800, 1200, 600, 1000],
    [1600, 1200, 1800, 1400],
    [2200, 1800, 2400, 2000],
  ];
  function scheduleBird(songIdx) {
    setTimeout(() => {
      if (stopped.val) return;
      const notes = birdSongs[songIdx % birdSongs.length];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.065, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.19);
      });
      scheduleBird(songIdx + 1);
    }, 1500 + Math.random() * 4000);
  }
  scheduleBird(0);
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}

// ─────────────────────────────────────────────────────────────────────
//  MARS — viento ultrafino marciano + pulso electromagnético
// ─────────────────────────────────────────────────────────────────────
function _sceneMars(ctx, out) {
  const nodes = [];
  // Viento marciano — muy tenue, alta frecuencia, casi silencio
  const buf = _makeNoise(ctx, 6);
  const wSrc = _noiseLoop(ctx, buf);
  const wHp  = ctx.createBiquadFilter(); wHp.type = 'highpass'; wHp.frequency.value = 3000;
  const wG   = ctx.createGain(); wG.gain.value = 0.022;
  const wLfo = ctx.createOscillator(); wLfo.type = 'sine'; wLfo.frequency.value = 0.03;
  const wLfoG= ctx.createGain(); wLfoG.gain.value = 0.015;
  wLfo.connect(wLfoG); wLfoG.connect(wG.gain);
  wSrc.connect(wHp); wHp.connect(wG); wG.connect(out); wSrc.start(); wLfo.start(); nodes.push(wSrc, wLfo);
  // Silencio marciano profundo — sub-bass barely audible
  const silo = ctx.createOscillator(); silo.type = 'sine'; silo.frequency.value = 28;
  const siloG = ctx.createGain(); siloG.gain.value = 0.04;
  silo.connect(siloG); siloG.connect(out); silo.start(); nodes.push(silo);
  // Pulso electromagnético del rover — beep tonal ocasional
  const stopped = { val: false };
  function schedulePulse() {
    setTimeout(() => {
      if (stopped.val) return;
      [[440, 0.06, 0.08], [880, 0.03, 0.06]].forEach(([f, vol, dur], i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.15;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.01);
      });
      schedulePulse();
    }, 12000 + Math.random() * 25000);
  }
  schedulePulse();
  return { stop: () => { stopped.val = true; nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}
