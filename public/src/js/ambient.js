/**
 * ambient.js — Música ambiental generativa por tema
 *
 * Usa Web Audio API pura (sin ficheros externos).
 * Cada tema tiene su propia "escena" de nodos de audio:
 *   ocean    → olas con LFO en frecuencia + ruido filtrado
 *   meadow   → grillos (osciladores de alta frecuencia modulados) + brisa
 *   mountain → viento rugoso (ruido band-pass con sweep lento)
 *   forest   → pulsos de grillos nocturnos + grave profundo de bosque
 */

let _ctx    = null;
let _master = null;       // GainNode maestro (controla volumen global)
let _scene  = null;       // objeto con { stop() } de la escena activa
let _volume = 0.4;        // 0–1
let _active = false;

// ─── PÚBLICA ──────────────────────────────────

export function initAmbient() {
  // AudioContext se crea al primer gesto del usuario (política de navegadores)
}

export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (_master) _master.gain.setTargetAtTime(_volume, _ctx.currentTime, 0.1);
}

export function getVolume() { return _volume; }

export function isPlaying() { return _active; }

export function startAmbient(theme) {
  _ensureContext();
  stopAmbient();
  _active = true;
  _master = _ctx.createGain();
  _master.gain.setValueAtTime(0, _ctx.currentTime);
  _master.gain.linearRampToValueAtTime(_volume, _ctx.currentTime + 2);
  _master.connect(_ctx.destination);

  if      (theme === 'ocean')    _scene = _sceneOcean(_ctx, _master);
  else if (theme === 'meadow')   _scene = _sceneMeadow(_ctx, _master);
  else if (theme === 'mountain') _scene = _sceneMountain(_ctx, _master);
  else                           _scene = _sceneForest(_ctx, _master);
}

export function stopAmbient() {
  if (!_active) return;
  _active = false;
  if (_master) {
    _master.gain.setTargetAtTime(0, _ctx.currentTime, 0.4);
    setTimeout(() => {
      try { _scene?.stop(); } catch(e) {}
      try { _master.disconnect(); } catch(e) {}
      _master = null;
      _scene  = null;
    }, 1500);
  }
}

// ─── PRIVADO ──────────────────────────────────

function _ensureContext() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
}

/** Ruido blanco → buffer de 2s aleatorio */
function _makeNoise(ctx, duration = 2) {
  const sr     = ctx.sampleRate;
  const frames = Math.floor(sr * duration);
  const buf    = ctx.createBuffer(1, frames, sr);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function _noiseSource(ctx, buf) {
  const src  = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;
  return src;
}

// ────────────────────────────────────────────
//  ESCENA: OCEAN — olas + rumor submarino
// ────────────────────────────────────────────
function _sceneOcean(ctx, out) {
  const noiseBuf = _makeNoise(ctx, 3);
  const nodes    = [];

  // Ola principal — ruido pasa-banda que sube y baja lentamente
  function makeWave(freq, lfoRate, lfoDepth, gain) {
    const src  = _noiseSource(ctx, noiseBuf);
    const bp   = ctx.createBiquadFilter();
    bp.type            = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value         = 0.8;

    const lfo  = ctx.createOscillator();
    lfo.type            = 'sine';
    lfo.frequency.value = lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value  = lfoDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);

    const g = ctx.createGain();
    g.gain.value = gain;

    src.connect(bp);
    bp.connect(g);
    g.connect(out);

    src.start(); lfo.start();
    nodes.push(src, lfo);
  }

  makeWave(400,  0.12, 300, 0.35);   // ola lenta grave
  makeWave(800,  0.18, 200, 0.18);   // ola media
  makeWave(1600, 0.08, 400, 0.10);   // spray fino

  // LFO de amplitud global — efecto de oleaje
  const ampLfo = ctx.createOscillator();
  ampLfo.type            = 'sine';
  ampLfo.frequency.value = 0.07;
  const ampLfoGain = ctx.createGain();
  ampLfoGain.gain.value  = 0.15;
  ampLfo.connect(ampLfoGain);
  ampLfoGain.connect(out.gain);
  ampLfo.start();
  nodes.push(ampLfo);

  return { stop: () => nodes.forEach(n => { try { n.stop(); } catch(e){} }) };
}

// ────────────────────────────────────────────
//  ESCENA: MEADOW — grillos + brisa suave
// ────────────────────────────────────────────
function _sceneMeadow(ctx, out) {
  const nodes = [];

  // Brisa — ruido filtrado suave
  const noiseBuf = _makeNoise(ctx, 2);
  const brisaSrc = _noiseSource(ctx, noiseBuf);
  const brisaFilter = ctx.createBiquadFilter();
  brisaFilter.type            = 'lowpass';
  brisaFilter.frequency.value = 800;
  const brisaGain = ctx.createGain();
  brisaGain.gain.value = 0.06;
  brisaSrc.connect(brisaFilter);
  brisaFilter.connect(brisaGain);
  brisaGain.connect(out);
  brisaSrc.start();
  nodes.push(brisaSrc);

  // Grillos — osciladores de 4-5 kHz con modulación de amplitud rítmica
  const CRICKET_FREQS = [4200, 4350, 4500, 4650, 4100];
  CRICKET_FREQS.forEach((f, i) => {
    const osc  = ctx.createOscillator();
    osc.type            = 'sine';
    osc.frequency.value = f;

    const am   = ctx.createOscillator();
    am.type            = 'square';
    am.frequency.value = 18 + i * 2.5;  // ritmo de canto

    const amGain = ctx.createGain();
    amGain.gain.value = 0.04;

    const g = ctx.createGain();
    g.gain.value = 0.0;   // la AM controla el volumen
    am.connect(amGain);
    amGain.connect(g.gain);

    osc.connect(g);
    g.connect(out);

    // Retardo escalonado para que no canten todos a la vez
    const delay = i * 0.3;
    osc.start(ctx.currentTime + delay);
    am.start(ctx.currentTime + delay);
    nodes.push(osc, am);
  });

  return { stop: () => nodes.forEach(n => { try { n.stop(); } catch(e){} }) };
}

// ────────────────────────────────────────────
//  ESCENA: MOUNTAIN — viento + silbidos lejanos
// ────────────────────────────────────────────
function _sceneMountain(ctx, out) {
  const nodes    = [];
  const noiseBuf = _makeNoise(ctx, 4);

  // Viento principal — ruido con sweep de frecuencia de corte
  const windSrc = _noiseSource(ctx, noiseBuf);
  const windBp  = ctx.createBiquadFilter();
  windBp.type            = 'bandpass';
  windBp.frequency.value = 600;
  windBp.Q.value         = 1.2;
  const windGain = ctx.createGain();
  windGain.gain.value    = 0.3;

  // LFO para el sweep de viento (ráfagas)
  const windLfo = ctx.createOscillator();
  windLfo.type            = 'sine';
  windLfo.frequency.value = 0.05;
  const wLfoG = ctx.createGain();
  wLfoG.gain.value        = 500;
  windLfo.connect(wLfoG);
  wLfoG.connect(windBp.frequency);

  // Amplitud del viento también varía
  const ampLfo = ctx.createOscillator();
  ampLfo.type            = 'sine';
  ampLfo.frequency.value = 0.09;
  const aLfoG = ctx.createGain();
  aLfoG.gain.value       = 0.12;
  ampLfo.connect(aLfoG);
  aLfoG.connect(windGain.gain);

  windSrc.connect(windBp);
  windBp.connect(windGain);
  windGain.connect(out);

  windSrc.start(); windLfo.start(); ampLfo.start();
  nodes.push(windSrc, windLfo, ampLfo);

  // Silbido lejano ocasional — oscilador con vibrato
  const whistle = ctx.createOscillator();
  whistle.type            = 'sine';
  whistle.frequency.value = 1200;
  const vibLfo = ctx.createOscillator();
  vibLfo.frequency.value  = 5;
  const vibG = ctx.createGain();
  vibG.gain.value         = 30;
  vibLfo.connect(vibG);
  vibG.connect(whistle.frequency);
  const wG = ctx.createGain();
  wG.gain.value           = 0.04;
  whistle.connect(wG);
  wG.connect(out);
  whistle.start(); vibLfo.start();
  nodes.push(whistle, vibLfo);

  return { stop: () => nodes.forEach(n => { try { n.stop(); } catch(e){} }) };
}

// ────────────────────────────────────────────
//  ESCENA: FOREST — bosque nocturno + sapo + rumor
// ────────────────────────────────────────────
function _sceneForest(ctx, out) {
  const nodes = [];

  // Rumor grave de bosque — ruido muy filtrado
  const noiseBuf = _makeNoise(ctx, 2);
  const rumSrc   = _noiseSource(ctx, noiseBuf);
  const rumBp    = ctx.createBiquadFilter();
  rumBp.type            = 'lowpass';
  rumBp.frequency.value = 200;
  const rumG = ctx.createGain();
  rumG.gain.value       = 0.12;
  rumSrc.connect(rumBp);
  rumBp.connect(rumG);
  rumG.connect(out);
  rumSrc.start();
  nodes.push(rumSrc);

  // Grillos nocturnos (más graves que prado, más lentos)
  [3100, 3300, 3500].forEach((f, i) => {
    const osc  = ctx.createOscillator();
    osc.type            = 'sine';
    osc.frequency.value = f;
    const am   = ctx.createOscillator();
    am.type            = 'square';
    am.frequency.value = 12 + i * 1.8;
    const amG  = ctx.createGain();
    amG.gain.value     = 0.035;
    const g    = ctx.createGain();
    g.gain.value       = 0.0;
    am.connect(amG);
    amG.connect(g.gain);
    osc.connect(g);
    g.connect(out);
    osc.start(ctx.currentTime + i * 0.5);
    am.start(ctx.currentTime  + i * 0.5);
    nodes.push(osc, am);
  });

  // Búho ocasional — dos notas cortas con interval de tritono
  function scheduleOwl() {
    const interval = 8000 + Math.random() * 14000; // cada 8–22s
    setTimeout(() => {
      if (!_active) return;
      [220, 165].forEach((f, i) => {
        const o  = ctx.createOscillator();
        o.type            = 'sine';
        o.frequency.value = f;
        // vibrato de búho
        const vib = ctx.createOscillator();
        vib.frequency.value  = 6;
        const vG  = ctx.createGain();
        vG.gain.value        = 8;
        vib.connect(vG);
        vG.connect(o.frequency);
        const env = ctx.createGain();
        const t0  = ctx.currentTime + i * 0.55;
        env.gain.setValueAtTime(0, t0);
        env.gain.linearRampToValueAtTime(0.12, t0 + 0.05);
        env.gain.setTargetAtTime(0, t0 + 0.3, 0.15);
        o.connect(env);
        env.connect(out);
        o.start(t0);
        o.stop(t0 + 0.8);
        vib.start(t0);
        vib.stop(t0 + 0.8);
      });
      scheduleOwl();
    }, interval);
  }
  scheduleOwl();

  return { stop: () => { nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
}
