/**
 * creatures.js — Animaciones de criaturas según el tema activo
 */

// ─── OCEAN ────────────────────────────────────
const FISH_COLORS  = ['#4ecdc4','#45b7d1','#96ceb4','#ffeaa7','#dda0dd','#ff9a9e','#a8edea','#f093fb','#4facfe','#43e97b','#fa709a','#fee140'];
const JELLY_COLORS = ['rgba(155,89,182,.7)','rgba(52,152,219,.6)','rgba(230,176,170,.65)','rgba(93,173,226,.6)'];

function fishSVG(c, w, v) {
  if (v === 0) return `<svg width="${w}" height="${w*.5}" viewBox="0 0 60 30" fill="none"><path d="M50 15 C40 5,15 8,8 15 C15 22,40 25,50 15Z" fill="${c}" opacity=".9"/><path d="M50 15 L60 8 L60 22 Z" fill="${c}" opacity=".65"/><circle cx="12" cy="13" r="2" fill="rgba(0,0,0,.4)"/><circle cx="11.5" cy="12.5" r=".7" fill="rgba(255,255,255,.7)"/></svg>`;
  if (v === 1) return `<svg width="${w}" height="${w*.45}" viewBox="0 0 75 30" fill="none"><path d="M60 15 C50 4,20 8,10 15 C20 22,50 26,60 15Z" fill="${c}" opacity=".85"/><path d="M60 15 L75 7 L72 15 L75 23Z" fill="${c}" opacity=".6"/><circle cx="15" cy="13" r="2.5" fill="rgba(0,0,0,.5)"/><circle cx="14.5" cy="12.5" r=".8" fill="rgba(255,255,255,.8)"/></svg>`;
  return `<svg width="${w}" height="${w*.5}" viewBox="0 0 45 28" fill="none"><ellipse cx="20" cy="14" rx="18" ry="9" fill="${c}" opacity=".88"/><path d="M38 14 L45 8 L45 20Z" fill="${c}" opacity=".6"/><circle cx="8" cy="12" r="1.8" fill="rgba(0,0,0,.4)"/></svg>`;
}
function jellySVG(c) {
  return `<svg width="34" height="52" viewBox="0 0 34 52" fill="none"><ellipse cx="17" cy="15" rx="15" ry="13" fill="${c}" opacity=".5"/><ellipse cx="17" cy="13" rx="11" ry="8" fill="${c}" opacity=".25"/><path d="M9 24 Q7 36 5 46" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/><path d="M13 25 Q12 38 10 50" stroke="${c}" stroke-width="1" stroke-linecap="round" opacity=".4"/><path d="M17 26 Q17 40 17 52" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/><path d="M21 25 Q22 38 24 50" stroke="${c}" stroke-width="1" stroke-linecap="round" opacity=".4"/><path d="M25 24 Q27 36 29 46" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/></svg>`;
}
function seaweedSVG(h, c) {
  return `<svg width="16" height="${h}" viewBox="0 0 16 ${h}" fill="none"><path d="M8 ${h} C8 ${h*.8},3 ${h*.7},5 ${h*.55} C7 ${h*.4},12 ${h*.35},10 ${h*.2} C8 ${h*.1},4 ${h*.05},8 0" stroke="${c}" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`;
}

function spawnOcean(layer) {
  const fishData = [
    {y:14,spd:22,sz:36,v:0,rev:false,c:FISH_COLORS[0]},
    {y:28,spd:34,sz:28,v:2,rev:true, c:FISH_COLORS[2], d:-8},
    {y:48,spd:28,sz:44,v:1,rev:false,c:FISH_COLORS[4], d:-15},
    {y:62,spd:40,sz:24,v:0,rev:true, c:FISH_COLORS[5], d:-5},
    {y:40,spd:52,sz:20,v:2,rev:false,c:FISH_COLORS[7], d:-22},
    {y:72,spd:38,sz:32,v:1,rev:true, c:FISH_COLORS[1], d:-11},
    {y:20,spd:60,sz:16,v:0,rev:false,c:FISH_COLORS[9], d:-30},
    {y:55,spd:45,sz:26,v:2,rev:true, c:FISH_COLORS[10],d:-18},
  ];
  fishData.forEach(f => {
    const el = document.createElement('div');
    el.className = 'fish-el' + (f.rev ? ' rev' : '');
    el.style.cssText = `top:${f.y}%;animation-duration:${f.spd}s;animation-delay:${f.d||0}s`;
    el.innerHTML = fishSVG(f.c, f.sz, f.v);
    layer.appendChild(el);
  });
  JELLY_COLORS.forEach((c, i) => {
    const cfg = [{x:5,y:8},{x:80,y:14},{x:65,y:4},{x:18,y:20}][i];
    const el = document.createElement('div');
    el.className = 'jelly-el';
    el.style.cssText = `left:${cfg.x}%;top:${cfg.y}%;animation-duration:${5+i*1.5}s;animation-delay:${-i*2}s`;
    el.innerHTML = jellySVG(c);
    layer.appendChild(el);
  });
  [{x:3,h:80,c:'#1a7a4a',dur:4},{x:8,h:60,c:'#1d8a52',dur:5,d:-1},{x:88,h:90,c:'#156b3f',dur:3.5},{x:93,h:70,c:'#0f5c35',dur:4.5,d:-2},{x:50,h:65,c:'#248c52',dur:6,d:-3},{x:75,h:55,c:'#1a7a4a',dur:4,d:-1.5}].forEach(sw => {
    const el = document.createElement('div');
    el.className = 'seaweed-el';
    el.style.cssText = `left:${sw.x}%;animation-duration:${sw.dur}s;animation-delay:${sw.d||0}s`;
    el.innerHTML = seaweedSVG(sw.h, sw.c);
    layer.appendChild(el);
  });
  for (let i = 0; i < 18; i++) {
    const b = document.createElement('div');
    b.className = 'bubble-el';
    const sz = 4 + Math.random() * 12;
    b.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;animation-duration:${6+Math.random()*14}s;animation-delay:-${Math.random()*20}s`;
    layer.appendChild(b);
  }
}

// ─── MEADOW ───────────────────────────────────
function butterflySVG(c1, c2) {
  return `<svg width="44" height="36" viewBox="0 0 44 36" fill="none"><g class="bfly-wing"><ellipse cx="10" cy="14" rx="10" ry="13" fill="${c1}" opacity=".85"/><ellipse cx="10" cy="26" rx="7" ry="8" fill="${c2}" opacity=".75"/><ellipse cx="34" cy="14" rx="10" ry="13" fill="${c1}" opacity=".85" transform="scale(-1,1) translate(-44,0)"/><ellipse cx="34" cy="26" rx="7" ry="8" fill="${c2}" opacity=".75" transform="scale(-1,1) translate(-44,0)"/></g><rect x="21" y="6" width="2" height="24" rx="1" fill="#3a2010" opacity=".7"/><path d="M21 6 L18 2 M23 6 L26 2" stroke="#3a2010" stroke-width="1" stroke-linecap="round" opacity=".7"/></svg>`;
}
function beeSVG() {
  return `<svg width="28" height="18" viewBox="0 0 28 18" fill="none"><ellipse cx="14" cy="11" rx="9" ry="6" fill="#f5c842"/><rect x="7" y="8" width="3" height="6" rx="1" fill="#2a1a00" opacity=".7"/><rect x="12" y="8" width="3" height="6" rx="1" fill="#2a1a00" opacity=".7"/><rect x="17" y="8" width="3" height="6" rx="1" fill="#2a1a00" opacity=".7"/><ellipse cx="20" cy="11" rx="5" ry="4" fill="#ff9800" opacity=".8"/><circle cx="22" cy="10" r="1.5" fill="#111" opacity=".6"/><path d="M10 8 Q8 3 6 5 M18 8 Q20 3 22 5" stroke="rgba(200,230,255,.7)" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
}
function flowerSVG(c, sz) {
  return `<svg width="${sz}" height="${sz*1.6}" viewBox="0 0 30 48" fill="none"><path d="M15 48 Q13 38 15 28" stroke="#4a9e1a" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="15" cy="22" r="5" fill="#ffd700"/><ellipse cx="8" cy="20" rx="5" ry="3" fill="${c}" opacity=".9" transform="rotate(-30 8 20)"/><ellipse cx="22" cy="20" rx="5" ry="3" fill="${c}" opacity=".9" transform="rotate(30 22 20)"/><ellipse cx="12" cy="14" rx="5" ry="3" fill="${c}" opacity=".9" transform="rotate(-60 12 14)"/><ellipse cx="18" cy="14" rx="5" ry="3" fill="${c}" opacity=".9" transform="rotate(60 18 14)"/><ellipse cx="15" cy="12" rx="3" ry="5" fill="${c}" opacity=".9"/></svg>`;
}
const BUTTERFLY_COLORS = [['#ff89a8','#c048a0'],['#ffd54f','#ff8c00'],['#80d8ff','#0288d1'],['#ccff90','#4caf50'],['#ea80fc','#7b1fa2'],['#ff6e40','#bf360c']];

function spawnMeadow(layer) {
  BUTTERFLY_COLORS.concat(BUTTERFLY_COLORS.slice(0,3)).forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'butterfly-el';
    el.style.cssText = `left:${5+i*12}%;top:${15+Math.sin(i)*20}%;animation-duration:${6+i*1.3}s;animation-delay:${-i*1.5}s`;
    el.innerHTML = butterflySVG(c[0], c[1]);
    layer.appendChild(el);
  });
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'bee-el';
    el.style.cssText = `left:${10+i*18}%;top:${30+Math.cos(i)*15}%;animation-duration:${4+i}s;animation-delay:${-i*2}s`;
    el.innerHTML = beeSVG();
    layer.appendChild(el);
  }
  const flC = ['#ff6b9d','#ff9e40','#a78bfa','#f472b6','#34d399','#60a5fa','#fbbf24','#f87171'];
  const flS = [22,18,26,20,24,16,22,18];
  [2,8,14,22,30,40,52,62,72,80,88,95].forEach((x, i) => {
    const el = document.createElement('div');
    el.className = 'flower-el';
    el.style.cssText = `left:${x}%;animation-duration:${3+Math.random()*3}s;animation-delay:${-Math.random()*3}s`;
    el.innerHTML = flowerSVG(flC[i % flC.length], flS[i % flS.length]);
    layer.appendChild(el);
  });
}

// ─── MOUNTAIN ─────────────────────────────────
function eagleSVG() {
  return `<svg width="80" height="40" viewBox="0 0 80 40" fill="none"><path d="M5 20 Q20 5 40 18 Q60 5 75 20" stroke="#c8d8e8" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M5 20 Q12 28 20 22" stroke="#c8d8e8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".7"/><path d="M75 20 Q68 28 60 22" stroke="#c8d8e8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".7"/><ellipse cx="40" cy="18" rx="8" ry="5" fill="#a8b8c8" opacity=".9"/><path d="M40 18 L44 16 L46 19 L40 20Z" fill="#e8d080" opacity=".9"/></svg>`;
}
function snowSVG(sz, op) {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 20 20" fill="none"><line x1="10" y1="1" x2="10" y2="19" stroke="rgba(200,220,255,${op})" stroke-width="1.2" stroke-linecap="round"/><line x1="1" y1="10" x2="19" y2="10" stroke="rgba(200,220,255,${op})" stroke-width="1.2" stroke-linecap="round"/><line x1="3" y1="3" x2="17" y2="17" stroke="rgba(200,220,255,${op})" stroke-width="1.2" stroke-linecap="round"/><line x1="17" y1="3" x2="3" y2="17" stroke="rgba(200,220,255,${op})" stroke-width="1.2" stroke-linecap="round"/></svg>`;
}
function pineSVG(h, sn) {
  const w = h * 0.55;
  return `<svg width="${w}" height="${h}" viewBox="0 0 55 100" fill="none"><rect x="24" y="82" width="7" height="18" rx="2" fill="#4a3020" opacity=".85"/><polygon points="27.5,2 6,42 49,42" fill="#1a4a2a" opacity=".9"/><polygon points="27.5,18 5,58 50,58" fill="#1d5530" opacity=".85"/><polygon points="27.5,34 4,76 51,76" fill="#20603a" opacity=".8"/><polygon points="27.5,2 6,42 49,42" fill="rgba(220,235,255,${sn*.7})" opacity=".6" clip-path="inset(0 0 60% 0)"/></svg>`;
}

function spawnMountain(layer) {
  for (let i = 0; i < 3; i++) {
    const el = document.createElement('div');
    el.className = 'eagle-el';
    el.style.cssText = `animation-duration:${28+i*12}s;animation-delay:${-i*9}s;top:${8+i*5}%`;
    el.innerHTML = eagleSVG();
    layer.appendChild(el);
  }
  for (let i = 0; i < 35; i++) {
    const el = document.createElement('div');
    el.className = 'snow-el';
    const sz = 8 + Math.random() * 14;
    el.style.cssText = `left:${Math.random()*100}%;animation-duration:${8+Math.random()*12}s;animation-delay:${-Math.random()*20}s`;
    el.innerHTML = snowSVG(sz, 0.6 + Math.random() * 0.4);
    layer.appendChild(el);
  }
  [2,10,18,26,70,78,86,93].forEach(x => {
    const el = document.createElement('div');
    el.className = 'pine-el';
    const h = 70 + Math.random() * 50;
    el.style.cssText = `left:${x}%;animation-duration:${5+Math.random()*4}s;animation-delay:${-Math.random()*4}s`;
    el.innerHTML = pineSVG(h, 0.4 + Math.random() * 0.5);
    layer.appendChild(el);
  });
}

// ─── FOREST ───────────────────────────────────
function owlSVG() {
  return `<svg width="38" height="48" viewBox="0 0 38 48" fill="none"><ellipse cx="19" cy="30" rx="13" ry="16" fill="#3a2a10" opacity=".9"/><ellipse cx="19" cy="18" rx="11" ry="12" fill="#4a3518" opacity=".9"/><polygon points="14,8 19,2 24,8" fill="#3a2a10" opacity=".85"/><circle cx="14" cy="18" r="5" fill="#f0e8d0" opacity=".9"/><circle cx="24" cy="18" r="5" fill="#f0e8d0" opacity=".9"/><circle cx="14" cy="18" r="3" fill="#1a1a0a"/><circle cx="24" cy="18" r="3" fill="#1a1a0a"/><circle cx="15" cy="17" r="1" fill="rgba(255,255,255,.8)"/><circle cx="25" cy="17" r="1" fill="rgba(255,255,255,.8)"/><path d="M17 24 Q19 26 21 24" stroke="#a08050" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
}
function forestTreeSVG(h, lc) {
  const w = h * 0.7;
  return `<svg width="${w}" height="${h}" viewBox="0 0 70 100" fill="none"><rect x="30" y="70" width="10" height="30" rx="3" fill="#1a0e06" opacity=".9"/><ellipse cx="35" cy="45" rx="28" ry="38" fill="${lc}" opacity=".85"/><ellipse cx="35" cy="38" rx="22" ry="30" fill="${lc}" opacity=".5"/></svg>`;
}
const FF_COLORS   = ['#aaff55','#88ff33','#ccff44','#ffff44','#aaffaa'];
const TREE_COLORS = ['#0a2a10','#081e0c','#0d3015','#0a2412','#061808'];

function spawnForest(layer) {
  [1,7,13,20,27,68,75,82,89,95].forEach((x, i) => {
    const el = document.createElement('div');
    el.className = 'ftree-el';
    const h = 80 + Math.random() * 70;
    el.style.cssText = `left:${x}%;animation-duration:${6+Math.random()*5}s;animation-delay:${-Math.random()*5}s`;
    el.innerHTML = forestTreeSVG(h, TREE_COLORS[i % TREE_COLORS.length]);
    layer.appendChild(el);
  });
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    el.className = 'firefly-el';
    const sz = 4 + Math.random() * 5;
    const x  = Math.random() * 90 + 5;
    const y  = Math.random() * 70 + 10;
    const c  = FF_COLORS[Math.floor(Math.random() * FF_COLORS.length)];
    el.style.cssText = `left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 ${sz*3}px ${c};animation-duration:${3+Math.random()*5}s;animation-delay:${-Math.random()*8}s`;
    layer.appendChild(el);
  }
  const owl = document.createElement('div');
  owl.className = 'owl-el';
  owl.style.cssText = 'right:12%;top:18%;animation-duration:4s';
  owl.innerHTML = owlSVG();
  layer.appendChild(owl);
}

// ─── EXPORT ───────────────────────────────────
export function spawnCreatures(theme) {
  const layer = document.getElementById('creatures-layer');
  layer.innerHTML = '';
  if      (theme === 'ocean')    spawnOcean(layer);
  else if (theme === 'meadow')   spawnMeadow(layer);
  else if (theme === 'mountain') spawnMountain(layer);
  else                           spawnForest(layer);
}

export function drawStars() {
  const canvas = document.getElementById('stars-canvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.65;
    const r = Math.random() * 1.4 + 0.3;
    const a = Math.random() * 0.7 + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,235,255,${a})`;
    ctx.fill();
  }
}
