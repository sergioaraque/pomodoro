/**
 * creatures.js — Animaciones de criaturas por tema
 *
 * Temas:
 *   ocean    → peces, medusas, algas, burbujas
 *   meadow   → mariposas, abejas, flores
 *   mountain → águilas, copos de nieve, pinos
 *   forest   → luciérnagas, búho, árboles
 *   desert   → escorpión, serpiente de arena, cactus, remolinos de polvo
 *   city     → coches, lluvia, edificios, farolas
 *   arctic   → auroras boreales, oso polar, copos grandes, montañas de hielo
 */

// ── helpers ───────────────────────────────────────────────────────────
function el(cls, css, html) {
  const d = document.createElement('div');
  d.className = cls;
  if (css)  d.style.cssText = css;
  if (html) d.innerHTML = html;
  return d;
}

// ══════════════════════════════════════════════════════════════════════
//  OCEAN
// ══════════════════════════════════════════════════════════════════════
const FISH_C  = ['#4ecdc4','#45b7d1','#96ceb4','#ffeaa7','#dda0dd','#ff9a9e','#a8edea','#f093fb','#4facfe','#43e97b','#fa709a','#fee140'];
const JELLY_C = ['rgba(155,89,182,.7)','rgba(52,152,219,.6)','rgba(230,176,170,.65)','rgba(93,173,226,.6)'];

function fishSVG(c, w, v) {
  if (v === 0) return `<svg width="${w}" height="${w*.5}" viewBox="0 0 60 30" fill="none"><path d="M50 15 C40 5,15 8,8 15 C15 22,40 25,50 15Z" fill="${c}" opacity=".9"/><path d="M50 15 L60 8 L60 22Z" fill="${c}" opacity=".65"/><circle cx="12" cy="13" r="2" fill="rgba(0,0,0,.4)"/><circle cx="11.5" cy="12.5" r=".7" fill="rgba(255,255,255,.7)"/></svg>`;
  if (v === 1) return `<svg width="${w}" height="${w*.45}" viewBox="0 0 75 30" fill="none"><path d="M60 15 C50 4,20 8,10 15 C20 22,50 26,60 15Z" fill="${c}" opacity=".85"/><path d="M60 15 L75 7 L72 15 L75 23Z" fill="${c}" opacity=".6"/><circle cx="15" cy="13" r="2.5" fill="rgba(0,0,0,.5)"/><circle cx="14.5" cy="12.5" r=".8" fill="rgba(255,255,255,.8)"/></svg>`;
  return `<svg width="${w}" height="${w*.5}" viewBox="0 0 45 28" fill="none"><ellipse cx="20" cy="14" rx="18" ry="9" fill="${c}" opacity=".88"/><path d="M38 14 L45 8 L45 20Z" fill="${c}" opacity=".6"/><circle cx="8" cy="12" r="1.8" fill="rgba(0,0,0,.4)"/></svg>`;
}
function jellySVG(c) {
  return `<svg width="34" height="52" viewBox="0 0 34 52" fill="none"><ellipse cx="17" cy="15" rx="15" ry="13" fill="${c}" opacity=".5"/><ellipse cx="17" cy="13" rx="11" ry="8" fill="${c}" opacity=".25"/><path d="M9 24 Q7 36 5 46" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/><path d="M13 25 Q12 38 10 50" stroke="${c}" stroke-width="1" stroke-linecap="round" opacity=".4"/><path d="M17 26 Q17 40 17 52" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/><path d="M21 25 Q22 38 24 50" stroke="${c}" stroke-width="1" stroke-linecap="round" opacity=".4"/><path d="M25 24 Q27 36 29 46" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/></svg>`;
}
function sweedSVG(h, c) {
  return `<svg width="16" height="${h}" viewBox="0 0 16 ${h}" fill="none"><path d="M8 ${h} C8 ${h*.8},3 ${h*.7},5 ${h*.55} C7 ${h*.4},12 ${h*.35},10 ${h*.2} C8 ${h*.1},4 ${h*.05},8 0" stroke="${c}" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`;
}

function spawnOcean(L) {
  [{y:14,spd:22,sz:36,v:0,rev:false,c:FISH_C[0]},{y:28,spd:34,sz:28,v:2,rev:true,c:FISH_C[2],d:-8},{y:48,spd:28,sz:44,v:1,rev:false,c:FISH_C[4],d:-15},{y:62,spd:40,sz:24,v:0,rev:true,c:FISH_C[5],d:-5},{y:40,spd:52,sz:20,v:2,rev:false,c:FISH_C[7],d:-22},{y:72,spd:38,sz:32,v:1,rev:true,c:FISH_C[1],d:-11},{y:20,spd:60,sz:16,v:0,rev:false,c:FISH_C[9],d:-30},{y:55,spd:45,sz:26,v:2,rev:true,c:FISH_C[10],d:-18}]
    .forEach(f => { L.appendChild(el('fish-el'+(f.rev?' rev':''), `top:${f.y}%;animation-duration:${f.spd}s;animation-delay:${f.d||0}s`, fishSVG(f.c,f.sz,f.v))); });
  JELLY_C.forEach((c,i) => {
    const p=[{x:5,y:8},{x:80,y:14},{x:65,y:4},{x:18,y:20}][i];
    L.appendChild(el('jelly-el', `left:${p.x}%;top:${p.y}%;animation-duration:${5+i*1.5}s;animation-delay:${-i*2}s`, jellySVG(c)));
  });
  [{x:3,h:80,c:'#1a7a4a',dur:4},{x:8,h:60,c:'#1d8a52',dur:5,d:-1},{x:88,h:90,c:'#156b3f',dur:3.5},{x:93,h:70,c:'#0f5c35',dur:4.5,d:-2},{x:50,h:65,c:'#248c52',dur:6,d:-3},{x:75,h:55,c:'#1a7a4a',dur:4,d:-1.5}]
    .forEach(s => L.appendChild(el('seaweed-el', `left:${s.x}%;animation-duration:${s.dur}s;animation-delay:${s.d||0}s`, sweedSVG(s.h,s.c))));
  for (let i=0;i<18;i++) {
    const sz=4+Math.random()*12;
    L.appendChild(el('bubble-el', `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;animation-duration:${6+Math.random()*14}s;animation-delay:-${Math.random()*20}s`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  MEADOW
// ══════════════════════════════════════════════════════════════════════
const BF_C = [['#ff89a8','#c048a0'],['#ffd54f','#ff8c00'],['#80d8ff','#0288d1'],['#ccff90','#4caf50'],['#ea80fc','#7b1fa2'],['#ff6e40','#bf360c']];
function butterflySVG(c1,c2) {
  return `<svg width="44" height="36" viewBox="0 0 44 36" fill="none"><g class="bfly-wing"><ellipse cx="10" cy="14" rx="10" ry="13" fill="${c1}" opacity=".85"/><ellipse cx="10" cy="26" rx="7" ry="8" fill="${c2}" opacity=".75"/><ellipse cx="34" cy="14" rx="10" ry="13" fill="${c1}" opacity=".85" transform="scale(-1,1) translate(-44,0)"/><ellipse cx="34" cy="26" rx="7" ry="8" fill="${c2}" opacity=".75" transform="scale(-1,1) translate(-44,0)"/></g><rect x="21" y="6" width="2" height="24" rx="1" fill="#3a2010" opacity=".7"/></svg>`;
}
function beeSVG() {
  return `<svg width="28" height="18" viewBox="0 0 28 18" fill="none"><ellipse cx="14" cy="11" rx="9" ry="6" fill="#f5c842"/><rect x="7" y="8" width="3" height="6" rx="1" fill="#2a1a00" opacity=".7"/><rect x="12" y="8" width="3" height="6" rx="1" fill="#2a1a00" opacity=".7"/><rect x="17" y="8" width="3" height="6" rx="1" fill="#2a1a00" opacity=".7"/><ellipse cx="20" cy="11" rx="5" ry="4" fill="#ff9800" opacity=".8"/><circle cx="22" cy="10" r="1.5" fill="#111" opacity=".6"/><path d="M10 8 Q8 3 6 5 M18 8 Q20 3 22 5" stroke="rgba(200,230,255,.7)" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
}
function flowerSVG(c,sz) {
  return `<svg width="${sz}" height="${sz*1.6}" viewBox="0 0 30 48" fill="none"><path d="M15 48 Q13 38 15 28" stroke="#4a9e1a" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="15" cy="22" r="5" fill="#ffd700"/><ellipse cx="8" cy="20" rx="5" ry="3" fill="${c}" opacity=".9" transform="rotate(-30 8 20)"/><ellipse cx="22" cy="20" rx="5" ry="3" fill="${c}" opacity=".9" transform="rotate(30 22 20)"/><ellipse cx="12" cy="14" rx="5" ry="3" fill="${c}" opacity=".9" transform="rotate(-60 12 14)"/><ellipse cx="18" cy="14" rx="5" ry="3" fill="${c}" opacity=".9" transform="rotate(60 18 14)"/></svg>`;
}
function spawnMeadow(L) {
  BF_C.concat(BF_C.slice(0,3)).forEach((c,i) => L.appendChild(el('butterfly-el', `left:${5+i*12}%;top:${15+Math.sin(i)*20}%;animation-duration:${6+i*1.3}s;animation-delay:${-i*1.5}s`, butterflySVG(c[0],c[1]))));
  for(let i=0;i<5;i++) L.appendChild(el('bee-el', `left:${10+i*18}%;top:${30+Math.cos(i)*15}%;animation-duration:${4+i}s;animation-delay:${-i*2}s`, beeSVG()));
  const fC=['#ff6b9d','#ff9e40','#a78bfa','#f472b6','#34d399','#60a5fa','#fbbf24','#f87171'], fS=[22,18,26,20,24,16,22,18];
  [2,8,14,22,30,40,52,62,72,80,88,95].forEach((x,i) => L.appendChild(el('flower-el', `left:${x}%;animation-duration:${3+Math.random()*3}s;animation-delay:${-Math.random()*3}s`, flowerSVG(fC[i%fC.length],fS[i%fS.length]))));
}

// ══════════════════════════════════════════════════════════════════════
//  MOUNTAIN
// ══════════════════════════════════════════════════════════════════════
function eagleSVG() {
  return `<svg width="80" height="40" viewBox="0 0 80 40" fill="none"><path d="M5 20 Q20 5 40 18 Q60 5 75 20" stroke="#c8d8e8" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M5 20 Q12 28 20 22" stroke="#c8d8e8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".7"/><path d="M75 20 Q68 28 60 22" stroke="#c8d8e8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".7"/><ellipse cx="40" cy="18" rx="8" ry="5" fill="#a8b8c8" opacity=".9"/><path d="M40 18 L44 16 L46 19 L40 20Z" fill="#e8d080" opacity=".9"/></svg>`;
}
function snowSVG(sz,op) {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 20 20" fill="none"><line x1="10" y1="1" x2="10" y2="19" stroke="rgba(200,220,255,${op})" stroke-width="1.2" stroke-linecap="round"/><line x1="1" y1="10" x2="19" y2="10" stroke="rgba(200,220,255,${op})" stroke-width="1.2" stroke-linecap="round"/><line x1="3" y1="3" x2="17" y2="17" stroke="rgba(200,220,255,${op})" stroke-width="1.2" stroke-linecap="round"/><line x1="17" y1="3" x2="3" y2="17" stroke="rgba(200,220,255,${op})" stroke-width="1.2" stroke-linecap="round"/></svg>`;
}
function pineSVG(h,sn) {
  const w=h*.55;
  return `<svg width="${w}" height="${h}" viewBox="0 0 55 100" fill="none"><rect x="24" y="82" width="7" height="18" rx="2" fill="#4a3020" opacity=".85"/><polygon points="27.5,2 6,42 49,42" fill="#1a4a2a" opacity=".9"/><polygon points="27.5,18 5,58 50,58" fill="#1d5530" opacity=".85"/><polygon points="27.5,34 4,76 51,76" fill="#20603a" opacity=".8"/><polygon points="27.5,2 6,42 49,42" fill="rgba(220,235,255,${sn*.7})" opacity=".6" clip-path="inset(0 0 60% 0)"/></svg>`;
}
function spawnMountain(L) {
  for(let i=0;i<3;i++) L.appendChild(el('eagle-el', `animation-duration:${28+i*12}s;animation-delay:${-i*9}s;top:${8+i*5}%`, eagleSVG()));
  for(let i=0;i<35;i++) { const sz=8+Math.random()*14; L.appendChild(el('snow-el', `left:${Math.random()*100}%;animation-duration:${8+Math.random()*12}s;animation-delay:${-Math.random()*20}s`, snowSVG(sz,.6+Math.random()*.4))); }
  [2,10,18,26,70,78,86,93].forEach(x => { const h=70+Math.random()*50; L.appendChild(el('pine-el', `left:${x}%;animation-duration:${5+Math.random()*4}s;animation-delay:${-Math.random()*4}s`, pineSVG(h,.4+Math.random()*.5))); });
}

// ══════════════════════════════════════════════════════════════════════
//  FOREST
// ══════════════════════════════════════════════════════════════════════
const FF_C  = ['#aaff55','#88ff33','#ccff44','#ffff44','#aaffaa'];
const TR_C  = ['#0a2a10','#081e0c','#0d3015','#0a2412','#061808'];
function owlSVG() {
  return `<svg width="38" height="48" viewBox="0 0 38 48" fill="none"><ellipse cx="19" cy="30" rx="13" ry="16" fill="#3a2a10" opacity=".9"/><ellipse cx="19" cy="18" rx="11" ry="12" fill="#4a3518" opacity=".9"/><polygon points="14,8 19,2 24,8" fill="#3a2a10" opacity=".85"/><circle cx="14" cy="18" r="5" fill="#f0e8d0" opacity=".9"/><circle cx="24" cy="18" r="5" fill="#f0e8d0" opacity=".9"/><circle cx="14" cy="18" r="3" fill="#1a1a0a"/><circle cx="24" cy="18" r="3" fill="#1a1a0a"/><circle cx="15" cy="17" r="1" fill="rgba(255,255,255,.8)"/><circle cx="25" cy="17" r="1" fill="rgba(255,255,255,.8)"/><path d="M17 24 Q19 26 21 24" stroke="#a08050" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
}
function ftreeSVG(h,lc) {
  const w=h*.7;
  return `<svg width="${w}" height="${h}" viewBox="0 0 70 100" fill="none"><rect x="30" y="70" width="10" height="30" rx="3" fill="#1a0e06" opacity=".9"/><ellipse cx="35" cy="45" rx="28" ry="38" fill="${lc}" opacity=".85"/><ellipse cx="35" cy="38" rx="22" ry="30" fill="${lc}" opacity=".5"/></svg>`;
}
function spawnForest(L) {
  [1,7,13,20,27,68,75,82,89,95].forEach((x,i) => { const h=80+Math.random()*70; L.appendChild(el('ftree-el', `left:${x}%;animation-duration:${6+Math.random()*5}s;animation-delay:${-Math.random()*5}s`, ftreeSVG(h,TR_C[i%TR_C.length]))); });
  for(let i=0;i<28;i++) { const sz=4+Math.random()*5, x=Math.random()*90+5, y=Math.random()*70+10, c=FF_C[Math.floor(Math.random()*FF_C.length)]; L.appendChild(el('firefly-el', `left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 ${sz*3}px ${c};animation-duration:${3+Math.random()*5}s;animation-delay:${-Math.random()*8}s`)); }
  L.appendChild(el('owl-el', 'right:12%;top:18%;animation-duration:4s', owlSVG()));
}

// ══════════════════════════════════════════════════════════════════════
//  DESERT — cactus, escorpión, serpiente, remolino de polvo
// ══════════════════════════════════════════════════════════════════════
function cactusSVG(h) {
  const w = h * 0.65;
  return `<svg width="${w}" height="${h}" viewBox="0 0 65 100" fill="none">
    <rect x="28" y="20" width="9" height="80" rx="4" fill="#3a6b30" opacity=".9"/>
    <rect x="10" y="45" width="28" height="8" rx="4" fill="#3a6b30" opacity=".85"/>
    <rect x="10" y="28" width="9" height="25" rx="4" fill="#3a6b30" opacity=".85"/>
    <rect x="37" y="55" width="20" height="8" rx="4" fill="#3a6b30" opacity=".85"/>
    <rect x="46" y="38" width="9" height="25" rx="4" fill="#3a6b30" opacity=".85"/>
    <line x1="32" y1="35" x2="32" y2="90" stroke="rgba(80,160,60,.3)" stroke-width="2"/>
    <circle cx="14" cy="28" r="3" fill="#c8e855" opacity=".8"/>
    <circle cx="50" cy="38" r="3" fill="#c8e855" opacity=".8"/>
  </svg>`;
}
function scorpionSVG() {
  return `<svg width="48" height="32" viewBox="0 0 48 32" fill="none">
    <ellipse cx="22" cy="18" rx="10" ry="7" fill="#c8a050" opacity=".9"/>
    <ellipse cx="22" cy="16" rx="7" ry="5" fill="#d4aa60" opacity=".8"/>
    <path d="M32 18 Q36 16 40 18 Q44 20 44 16 Q44 10 40 8" stroke="#c8a050" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="40" cy="7" r="3" fill="#e05030" opacity=".9"/>
    <path d="M18 22 Q14 26 10 24 M20 23 Q16 28 12 27 M24 23 Q24 28 20 29 M26 22 Q28 26 32 25 M28 21 Q32 24 35 22" stroke="#c8a050" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <circle cx="16" cy="14" r="1.5" fill="#1a1a0a"/>
    <circle cx="20" cy="13" r="1.5" fill="#1a1a0a"/>
  </svg>`;
}
function dustDevilSVG() {
  return `<svg width="30" height="80" viewBox="0 0 30 80" fill="none">
    <ellipse cx="15" cy="75" rx="14" ry="4" fill="rgba(210,180,120,.4)"/>
    <ellipse cx="15" cy="60" rx="10" ry="3" fill="rgba(210,180,120,.3)"/>
    <ellipse cx="15" cy="40" rx="7"  ry="2.5" fill="rgba(210,180,120,.2)"/>
    <ellipse cx="15" cy="20" rx="4"  ry="2" fill="rgba(210,180,120,.15)"/>
    <ellipse cx="15" cy="5"  rx="2"  ry="1.5" fill="rgba(210,180,120,.1)"/>
  </svg>`;
}
function sandSnakeSVG() {
  return `<svg width="80" height="24" viewBox="0 0 80 24" fill="none">
    <path d="M5 12 Q15 4 25 12 Q35 20 45 12 Q55 4 65 12 Q72 17 75 12" stroke="#c8a050" stroke-width="4" stroke-linecap="round" fill="none" opacity=".85"/>
    <circle cx="77" cy="11" r="4" fill="#c8a050" opacity=".9"/>
    <circle cx="75" cy="9" r="1.5" fill="#1a1a0a"/>
    <path d="M80 11 Q82 9 80 11 Q82 13 80 11Z" fill="#e05030" opacity=".9"/>
  </svg>`;
}

function spawnDesert(L) {
  // Cactus
  [3, 12, 25, 70, 82, 91].forEach((x, i) => {
    const h = 60 + Math.random() * 60;
    L.appendChild(el('seaweed-el', `left:${x}%;animation-duration:${6+Math.random()*4}s;animation-delay:${-Math.random()*4}s`, cactusSVG(h)));
  });
  // Escorpiones
  for (let i = 0; i < 3; i++) {
    L.appendChild(el('bee-el', `left:${15+i*28}%;bottom:2%;top:auto;animation-duration:${8+i*3}s;animation-delay:${-i*4}s`, scorpionSVG()));
  }
  // Serpiente de arena
  L.appendChild(el('fish-el', `top:82%;animation-duration:28s;animation-delay:-5s`, sandSnakeSVG()));
  L.appendChild(el('fish-el rev', `top:76%;animation-duration:35s;animation-delay:-14s`, sandSnakeSVG()));
  // Remolinos de polvo
  for (let i = 0; i < 4; i++) {
    L.appendChild(el('dust-devil-el', `left:${10+i*22}%;animation-duration:${12+Math.random()*8}s;animation-delay:${-Math.random()*10}s`, dustDevilSVG()));
  }
  // Partículas de arena
  for (let i = 0; i < 25; i++) {
    const sz = 2 + Math.random() * 4;
    const d = el('bubble-el', `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;background:rgba(210,180,100,.4);border:none;animation-duration:${4+Math.random()*8}s;animation-delay:-${Math.random()*12}s`);
    L.appendChild(d);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  CITY — coches, lluvia, edificios, farolas
// ══════════════════════════════════════════════════════════════════════
function buildingSVG(w, h, windows) {
  let wins = '';
  const cols = Math.floor(w / 14);
  const rows = Math.floor(h / 18);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > 0.45;
      const wx = 6 + c * 14, wy = 10 + r * 18;
      wins += `<rect x="${wx}" y="${wy}" width="7" height="10" rx="1" fill="${lit ? '#ffd96e' : 'rgba(0,0,0,.4)'}" opacity="${lit ? '.9' : '.5'}"/>`;
    }
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
    <rect x="0" y="0" width="${w}" height="${h}" fill="#1a2035" opacity=".95"/>
    <rect x="0" y="0" width="${w}" height="6" fill="#252b42" opacity=".9"/>
    ${wins}
  </svg>`;
}
function carSVG(color) {
  return `<svg width="60" height="22" viewBox="0 0 60 22" fill="none">
    <rect x="2" y="10" width="56" height="10" rx="3" fill="${color}" opacity=".9"/>
    <path d="M12 10 Q16 2 28 2 Q42 2 48 10Z" fill="${color}" opacity=".85"/>
    <circle cx="14" cy="20" r="4" fill="#222"/>
    <circle cx="46" cy="20" r="4" fill="#222"/>
    <circle cx="14" cy="20" r="2" fill="#555"/>
    <circle cx="46" cy="20" r="2" fill="#555"/>
    <rect x="3"  y="12" width="8" height="5" rx="1" fill="#ffee88" opacity=".9"/>
    <rect x="49" y="12" width="8" height="5" rx="1" fill="#ff4444" opacity=".8"/>
    <rect x="18" y="3" width="22" height="7" rx="1" fill="rgba(150,200,255,.25)"/>
  </svg>`;
}
function rainDropSVG() {
  return `<svg width="2" height="14" viewBox="0 0 2 14" fill="none"><line x1="1" y1="0" x2="1" y2="14" stroke="rgba(150,200,255,.5)" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}
function lampPostSVG() {
  return `<svg width="20" height="90" viewBox="0 0 20 90" fill="none">
    <rect x="9" y="20" width="3" height="70" rx="1" fill="#3a3a5a" opacity=".9"/>
    <path d="M10 20 Q8 8 4 6" stroke="#3a3a5a" stroke-width="3" stroke-linecap="round" fill="none"/>
    <ellipse cx="4" cy="5" rx="5" ry="3" fill="#ffd96e" opacity=".85"/>
    <ellipse cx="4" cy="5" rx="8" ry="5" fill="rgba(255,217,110,.15)"/>
  </svg>`;
}

const CAR_COLORS = ['#c0392b','#2980b9','#f39c12','#27ae60','#8e44ad','#e8e8e8','#2c3e50'];
function spawnCity(L) {
  // Edificios en fondo
  const buildData = [
    {x:0,  w:80, h:240},{x:75, w:60, h:180},{x:130,w:90, h:280},{x:215,w:70, h:200},
    {x:280,w:55, h:160},{x:330,w:80, h:220},{x:405,w:65, h:300},{x:465,w:75, h:190},
    {x:535,w:55, h:250},{x:585,w:70, h:170},{x:650,w:80, h:210},{x:725,w:60, h:260},
    {x:780,w:75, h:190},{x:850,w:65, h:240},{x:910,w:80, h:180},
  ];
  buildData.forEach(b => {
    L.appendChild(el('ftree-el', `left:${(b.x/1000)*100}%;bottom:6%;animation-duration:0s`, buildingSVG(b.w, b.h)));
  });
  // Farolas
  [5, 18, 35, 52, 68, 82].forEach(x => {
    L.appendChild(el('seaweed-el', `left:${x}%;animation-duration:0s`, lampPostSVG()));
  });
  // Coches — en la parte baja
  CAR_COLORS.forEach((c, i) => {
    const rev = i % 2 === 0;
    L.appendChild(el('fish-el' + (rev ? ' rev' : ''), `top:${82 + (i%3)*3}%;animation-duration:${6+i*2}s;animation-delay:${-i*3}s`, carSVG(c)));
  });
  // Lluvia
  for (let i = 0; i < 60; i++) {
    L.appendChild(el('snow-el', `left:${Math.random()*100}%;animation-duration:${0.5+Math.random()*.8}s;animation-delay:-${Math.random()*2}s`, rainDropSVG()));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  ARCTIC — aurora boreal, oso polar, icebergs, copos grandes
// ══════════════════════════════════════════════════════════════════════
function icebergSVG(w, h) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
    <polygon points="${w*.2},0 ${w*.8},0 ${w},${h} 0,${h}" fill="#c8e8f8" opacity=".7"/>
    <polygon points="${w*.3},0 ${w*.7},0 ${w*.75},${h*.4} ${w*.25},${h*.4}" fill="#e8f6ff" opacity=".5"/>
    <line x1="${w*.35}" y1="0" x2="${w*.3}"  y2="${h*.35}" stroke="rgba(200,230,250,.4)" stroke-width="1"/>
    <line x1="${w*.6}"  y1="0" x2="${w*.65}" y2="${h*.35}" stroke="rgba(200,230,250,.4)" stroke-width="1"/>
  </svg>`;
}
function polarBearSVG() {
  return `<svg width="70" height="48" viewBox="0 0 70 48" fill="none">
    <ellipse cx="35" cy="34" rx="24" ry="14" fill="#f0f4f8" opacity=".95"/>
    <circle  cx="35" cy="18" r="13" fill="#f0f4f8" opacity=".95"/>
    <circle  cx="22" cy="10" r="5"  fill="#f0f4f8" opacity=".9"/>
    <circle  cx="48" cy="10" r="5"  fill="#f0f4f8" opacity=".9"/>
    <circle  cx="30" cy="17" r="2.5" fill="#2a2a3a"/>
    <circle  cx="40" cy="17" r="2.5" fill="#2a2a3a"/>
    <ellipse cx="35" cy="22" rx="5"  ry="3"  fill="#d8dce0" opacity=".8"/>
    <circle  cx="35" cy="23" r="1.5" fill="#2a2a3a"/>
    <path d="M11 34 Q8 40 10 44 M59 34 Q62 40 60 44 M18 44 Q15 48 18 48 M52 44 Q55 48 52 48" stroke="#f0f4f8" stroke-width="5" stroke-linecap="round" fill="none" opacity=".9"/>
  </svg>`;
}
function auroraLineSVG(color1, color2, amplitude) {
  const pts = [];
  for (let x = 0; x <= 100; x += 5) {
    const y = 50 + Math.sin((x + amplitude) * 0.08) * 30 + Math.sin(x * 0.15) * 15;
    pts.push(`${x},${y}`);
  }
  return `<svg width="100%" height="120px" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;top:0;left:0;width:100%;pointer-events:none">
    <defs>
      <linearGradient id="ag${amplitude}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${color1}" stop-opacity="0"/>
        <stop offset="30%" stop-color="${color1}" stop-opacity="0.6"/>
        <stop offset="70%" stop-color="${color2}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${color2}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polyline points="${pts.join(' ')}" stroke="url(#ag${amplitude})" stroke-width="3" fill="none"/>
  </svg>`;
}
function bigSnowSVG(sz) {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="2" x2="12" y2="22" stroke="rgba(200,230,255,.7)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="2" y1="12" x2="22" y2="12" stroke="rgba(200,230,255,.7)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="5" y1="5" x2="19" y2="19" stroke="rgba(200,230,255,.7)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="19" y1="5" x2="5"  y2="19" stroke="rgba(200,230,255,.7)" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="2" fill="rgba(220,240,255,.8)"/>
    <circle cx="12" cy="4"  r="1.2" fill="rgba(200,230,255,.6)"/>
    <circle cx="12" cy="20" r="1.2" fill="rgba(200,230,255,.6)"/>
    <circle cx="4"  cy="12" r="1.2" fill="rgba(200,230,255,.6)"/>
    <circle cx="20" cy="12" r="1.2" fill="rgba(200,230,255,.6)"/>
  </svg>`;
}

function spawnArctic(L) {
  // Auroras boreales
  const auroraColors = [
    ['#00ff88','#00ccff'],
    ['#aa00ff','#00ffcc'],
    ['#00ddff','#88ff00'],
  ];
  auroraColors.forEach((c, i) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;top:${5+i*8}%;left:0;right:0;height:120px;animation:auroraWave ${6+i*2}s ease-in-out infinite alternate;opacity:.7;animation-delay:${-i*2}s`;
    wrap.innerHTML = auroraLineSVG(c[0], c[1], i * 20);
    L.appendChild(wrap);
  });
  // Icebergs
  [{x:2,w:90,h:110},{x:20,w:60,h:80},{x:65,w:100,h:130},{x:82,w:70,h:90}].forEach(b => {
    L.appendChild(el('ftree-el', `left:${b.x}%;animation-duration:${8+Math.random()*4}s;animation-delay:${-Math.random()*4}s`, icebergSVG(b.w, b.h)));
  });
  // Oso polar
  L.appendChild(el('bee-el', `left:42%;bottom:8%;top:auto;animation-duration:10s;animation-delay:-2s`, polarBearSVG()));
  // Copos grandes
  for (let i = 0; i < 20; i++) {
    const sz = 16 + Math.random() * 20;
    L.appendChild(el('snow-el', `left:${Math.random()*100}%;animation-duration:${10+Math.random()*15}s;animation-delay:-${Math.random()*20}s`, bigSnowSVG(sz)));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  STARS
// ══════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════════════════════════════
export function spawnCreatures(theme) {
  const L = document.getElementById('creatures-layer');
  L.innerHTML = '';
  switch (theme) {
    case 'ocean':    spawnOcean(L);    break;
    case 'meadow':   spawnMeadow(L);   break;
    case 'mountain': spawnMountain(L); break;
    case 'forest':   spawnForest(L);   break;
    case 'desert':   spawnDesert(L);   break;
    case 'city':     spawnCity(L);     break;
    case 'arctic':   spawnArctic(L);   break;
    case 'space':    spawnSpace(L);    break;
    case 'deep':     spawnDeep(L);     break;
    case 'volcano':  spawnVolcano(L);  break;
    case 'rain':     spawnRain(L);     break;
    case 'japan':    spawnJapan(L);    break;
    case 'swamp':    spawnSwamp(L);    break;
    case 'cave':     spawnCave(L);     break;
    case 'underarctic': spawnUnderArctic(L); break;
    case 'savanna':  spawnSavanna(L);  break;
    case 'alps':     spawnAlps(L);     break;
    case 'festival': spawnFestival(L); break;
    case 'jungle':   spawnJungle(L);   break;
    case 'mars':     spawnMars(L);     break;
  }
}

// ══════════════════════════════════════════════════════════════════════
//  SPACE — planetas, estrellas fugaces, satélites, nebulosa
// ══════════════════════════════════════════════════════════════════════
function planetSVG(r, color, ringColor, hasRing) {
  const rings = hasRing ? `<ellipse cx="${r}" cy="${r}" rx="${r*1.7}" ry="${r*0.35}" fill="none" stroke="${ringColor}" stroke-width="${r*0.22}" opacity=".65" transform="rotate(-15 ${r} ${r})"/>` : '';
  return `<svg width="${r*2}" height="${r*2}" viewBox="0 0 ${r*2} ${r*2}" fill="none">
    ${rings}
    <circle cx="${r}" cy="${r}" r="${r*0.92}" fill="${color}" opacity=".9"/>
    <ellipse cx="${r*0.7}" cy="${r*0.65}" rx="${r*0.45}" ry="${r*0.28}" fill="rgba(255,255,255,.12)" transform="rotate(-20 ${r*0.7} ${r*0.65})"/>
  </svg>`;
}
function satelliteSVG() {
  return `<svg width="36" height="18" viewBox="0 0 36 18" fill="none">
    <rect x="14" y="6" width="8" height="6" rx="1" fill="#8899bb" opacity=".9"/>
    <rect x="0"  y="7" width="13" height="4" rx="1" fill="#4466aa" opacity=".85"/>
    <rect x="23" y="7" width="13" height="4" rx="1" fill="#4466aa" opacity=".85"/>
    <circle cx="18" cy="9" r="2" fill="#aabbdd" opacity=".8"/>
  </svg>`;
}
function shootingStarSVG() {
  return `<svg width="80" height="4" viewBox="0 0 80 4" fill="none">
    <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(200,220,255,0)"/>
      <stop offset="100%" stop-color="rgba(220,235,255,0.9)"/>
    </linearGradient></defs>
    <rect width="80" height="2" y="1" rx="1" fill="url(#sg)"/>
    <circle cx="79" cy="2" r="2" fill="rgba(240,248,255,0.95)"/>
  </svg>`;
}
function nebulaSVG(w, h, c1, c2) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
    <defs>
      <radialGradient id="nb" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.18"/>
        <stop offset="60%" stop-color="${c2}" stop-opacity="0.07"/>
        <stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}" fill="url(#nb)"/>
  </svg>`;
}

function spawnSpace(L) {
  // Nebulas background
  [
    {x:5,  y:10, w:300, h:200, c1:'#8844ff', c2:'#4488ff'},
    {x:55, y:5,  w:250, h:180, c1:'#ff4488', c2:'#ff8844'},
    {x:20, y:55, w:200, h:150, c1:'#44ffcc', c2:'#4488ff'},
  ].forEach(n => {
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;left:${n.x}%;top:${n.y}%;pointer-events:none`;
    d.innerHTML = nebulaSVG(n.w, n.h, n.c1, n.c2);
    L.appendChild(d);
  });
  // Planets
  [
    {x:72, y:12, r:45, color:'#3355cc', ring:'#6688ee', hasRing:true,  dur:0},
    {x:8,  y:20, r:28, color:'#cc4422', ring:'',         hasRing:false, dur:0},
    {x:85, y:55, r:18, color:'#44aa88', ring:'',         hasRing:false, dur:0},
    {x:40, y:8,  r:14, color:'#886622', ring:'',         hasRing:false, dur:0},
  ].forEach(p => {
    L.appendChild(el('owl-el', `left:${p.x}%;top:${p.y}%;animation-duration:${6+p.dur}s`, planetSVG(p.r, p.color, p.ring, p.hasRing)));
  });
  // Satellites
  for (let i = 0; i < 2; i++) {
    L.appendChild(el('fish-el'+(i%2?' rev':''), `top:${25+i*20}%;animation-duration:${20+i*8}s;animation-delay:${-i*10}s`, satelliteSVG()));
  }
  // Shooting stars
  for (let i = 0; i < 4; i++) {
    L.appendChild(el('fish-el', `top:${8+i*12}%;animation-duration:${3+i*1.5}s;animation-delay:-${i*4}s;opacity:.8`, shootingStarSVG()));
  }
  // Dust particles (tiny stars)
  for (let i = 0; i < 35; i++) {
    const sz = 2 + Math.random() * 4;
    const d = el('firefly-el', `left:${Math.random()*100}%;top:${Math.random()*80}%;width:${sz}px;height:${sz}px;background:rgba(200,220,255,${0.4+Math.random()*0.5});animation-duration:${4+Math.random()*8}s;animation-delay:-${Math.random()*8}s`);
    L.appendChild(d);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  DEEP OCEAN — fondo abisal, peces bioluminiscentes, anguilas
// ══════════════════════════════════════════════════════════════════════
function deepFishSVG(color, glowColor, sz) {
  return `<svg width="${sz}" height="${sz*0.5}" viewBox="0 0 60 30" fill="none">
    <path d="M48 15 C38 5,14 7,8 15 C14 23,38 25,48 15Z" fill="${color}" opacity=".85"/>
    <path d="M48 15 L58 9 L58 21Z" fill="${color}" opacity=".6"/>
    <circle cx="12" cy="13" r="3" fill="${glowColor}" opacity=".9"/>
    <circle cx="12" cy="13" r="5" fill="${glowColor}" opacity=".25"/>
    <!-- bioluminescent spots -->
    <circle cx="25" cy="14" r="1.5" fill="${glowColor}" opacity=".7"/>
    <circle cx="35" cy="13" r="1.2" fill="${glowColor}" opacity=".5"/>
    <circle cx="42" cy="15" r="1"   fill="${glowColor}" opacity=".4"/>
  </svg>`;
}
function anglerSVG() {
  return `<svg width="70" height="40" viewBox="0 0 70 40" fill="none">
    <path d="M55 20 C42 8,18 10,10 20 C18 30,42 32,55 20Z" fill="#1a2a1a" opacity=".9"/>
    <path d="M55 20 L68 14 L65 20 L68 26Z" fill="#1a2a1a" opacity=".7"/>
    <!-- Lure -->
    <path d="M30 10 Q28 2 35 0" stroke="#2a3a2a" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <circle cx="35" cy="0" r="4" fill="#00ffaa" opacity=".8"/>
    <circle cx="35" cy="0" r="7" fill="#00ffaa" opacity=".2"/>
    <!-- Teeth -->
    <path d="M12 19 L15 16 L18 19 L21 16 L24 19" stroke="#aaffcc" stroke-width="1" fill="none" opacity=".6"/>
    <circle cx="16" cy="18" r="2.5" fill="#00dd88" opacity=".85"/>
    <circle cx="16" cy="18" r="4.5" fill="#00dd88" opacity=".2"/>
  </svg>`;
}
function coralSVG(h, c) {
  const w = h * 0.6;
  return `<svg width="${w}" height="${h}" viewBox="0 0 60 100" fill="none">
    <path d="M30 100 L30 60 M30 60 L15 35 M30 60 L45 35 M30 60 L30 25 M15 35 L8 18 M15 35 L22 15 M45 35 L38 15 M45 35 L52 18 M30 25 L24 8 M30 25 L36 8" stroke="${c}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <circle cx="8"  cy="16" r="4" fill="${c}" opacity=".9"/>
    <circle cx="22" cy="13" r="4" fill="${c}" opacity=".9"/>
    <circle cx="24" cy="6"  r="3.5" fill="${c}" opacity=".9"/>
    <circle cx="36" cy="6"  r="3.5" fill="${c}" opacity=".9"/>
    <circle cx="38" cy="13" r="4" fill="${c}" opacity=".9"/>
    <circle cx="52" cy="16" r="4" fill="${c}" opacity=".9"/>
    <circle cx="30" cy="23" r="4" fill="${c}" opacity=".9"/>
  </svg>`;
}

function spawnDeep(L) {
  // Corals at the bottom
  const coralColors = ['#ff4488','#ff6622','#aa44ff','#22aaff','#ff2244'];
  [3,10,18,28,38,55,65,75,85,92].forEach((x,i) => {
    const h = 50 + Math.random() * 60;
    L.appendChild(el('seaweed-el', `left:${x}%;animation-duration:${5+Math.random()*4}s;animation-delay:-${Math.random()*4}s`, coralSVG(h, coralColors[i%coralColors.length])));
  });
  // Bioluminescent fish
  const bioColors = [
    ['#001122','#00ffaa'],
    ['#000a1a','#44ddff'],
    ['#0a0022','#cc44ff'],
    ['#001a0a','#44ff88'],
    ['#1a0010','#ff44aa'],
  ];
  bioColors.forEach(([body, glow], i) => {
    const sz = 30 + Math.random() * 30;
    const rev = i % 2 === 1;
    L.appendChild(el('fish-el'+(rev?' rev':''), `top:${20+i*12}%;animation-duration:${18+i*5}s;animation-delay:-${i*6}s`, deepFishSVG(body, glow, sz)));
  });
  // Angler fish
  L.appendChild(el('fish-el', `top:60%;animation-duration:30s;animation-delay:-8s`, anglerSVG()));
  L.appendChild(el('fish-el rev', `top:45%;animation-duration:38s;animation-delay:-20s`, anglerSVG()));
  // Bioluminescent particles
  for (let i = 0; i < 25; i++) {
    const sz = 3 + Math.random() * 5;
    const c  = bioColors[Math.floor(Math.random()*bioColors.length)][1];
    L.appendChild(el('firefly-el', `left:${Math.random()*100}%;top:${Math.random()*90+5}%;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 ${sz*2}px ${c};animation-duration:${4+Math.random()*7}s;animation-delay:-${Math.random()*7}s`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  VOLCANO — lava, rocas volando, cráter, ceniza
// ══════════════════════════════════════════════════════════════════════
function lavaBoulderSVG(sz) {
  return `<svg width="${sz}" height="${sz*.8}" viewBox="0 0 50 40" fill="none">
    <ellipse cx="25" cy="22" rx="22" ry="16" fill="#3a0800" opacity=".9"/>
    <ellipse cx="25" cy="20" rx="18" ry="12" fill="#8a1500" opacity=".8"/>
    <ellipse cx="20" cy="17" rx="8"  ry="5"  fill="#ff4400" opacity=".7"/>
    <ellipse cx="30" cy="22" rx="5"  ry="3"  fill="#ff6600" opacity=".6"/>
  </svg>`;
}
function ashParticleSVG() {
  return `<svg width="6" height="6" viewBox="0 0 6 6" fill="none">
    <circle cx="3" cy="3" r="2.5" fill="rgba(180,160,140,.6)"/>
  </svg>`;
}
function lavaFlowSVG(w) {
  return `<svg width="${w}" height="60" viewBox="0 0 ${w} 60" fill="none">
    <defs><linearGradient id="lv" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff4400" stop-opacity=".9"/>
      <stop offset="100%" stop-color="#8a1500" stop-opacity=".7"/>
    </linearGradient></defs>
    <path d="M0 0 Q${w*.3} 20 ${w*.5} 10 Q${w*.7} 0 ${w} 15 L${w} 60 L0 60Z" fill="url(#lv)"/>
    <path d="M0 8 Q${w*.25} 28 ${w*.45} 18 Q${w*.65} 8 ${w} 22 L${w} 60 L0 60Z" fill="#ff6600" opacity=".4"/>
  </svg>`;
}
function volcanoPlumeParticle(i) {
  const sz = 8 + Math.random() * 18;
  const x  = 35 + (Math.random() - 0.5) * 30;
  const dur = 3 + Math.random() * 5;
  const del = -Math.random() * 6;
  return `left:${x}%;animation-duration:${dur}s;animation-delay:${del}s;width:${sz}px;height:${sz}px;background:rgba(${100+i*10},${80+i*5},${60+i*3},.5);border-radius:50%`;
}

function spawnVolcano(L) {
  // Lava flows at bottom
  [0, 30, 58, 75].forEach((x, i) => {
    const w = 180 + Math.random() * 120;
    L.appendChild(el('seaweed-el', `left:${x}%;animation-duration:${4+i}s;animation-delay:${-i}s`, lavaFlowSVG(w)));
  });
  // Flying boulders
  for (let i = 0; i < 5; i++) {
    const sz = 20 + Math.random() * 30;
    L.appendChild(el('snow-el', `left:${10+i*18}%;animation-duration:${3+i*1.2}s;animation-delay:-${i*2}s`, lavaBoulderSVG(sz)));
  }
  // Ash column (rising particles)
  for (let i = 0; i < 30; i++) {
    L.appendChild(el('bubble-el', volcanoPlumeParticle(i)));
  }
  // Ember sparks
  for (let i = 0; i < 20; i++) {
    const sz = 3 + Math.random() * 5;
    const c  = i % 3 === 0 ? '#ff4400' : i % 3 === 1 ? '#ff8800' : '#ffcc00';
    L.appendChild(el('firefly-el', `left:${Math.random()*100}%;top:${30+Math.random()*60}%;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 ${sz*2}px ${c};animation-duration:${2+Math.random()*4}s;animation-delay:-${Math.random()*4}s`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  RAIN — lluvia, charcos, hojas de otoño, niebla
// ══════════════════════════════════════════════════════════════════════
function leafSVG(c, sz) {
  return `<svg width="${sz}" height="${sz*1.4}" viewBox="0 0 30 42" fill="none">
    <path d="M15 40 Q4 28 5 16 Q6 4 15 2 Q24 4 25 16 Q26 28 15 40Z" fill="${c}" opacity=".85"/>
    <path d="M15 40 Q15 20 15 2" stroke="rgba(0,0,0,.2)" stroke-width="1" fill="none"/>
    <path d="M15 25 Q8 22 5 16 M15 18 Q22 15 25 16" stroke="rgba(0,0,0,.15)" stroke-width=".8" fill="none"/>
  </svg>`;
}
function rainRippleSVG() {
  return `<svg width="30" height="14" viewBox="0 0 30 14" fill="none">
    <ellipse cx="15" cy="7" rx="14" ry="5" fill="none" stroke="rgba(150,200,230,.35)" stroke-width="1.2"/>
    <ellipse cx="15" cy="7" rx="8"  ry="3" fill="none" stroke="rgba(150,200,230,.25)" stroke-width="1"/>
  </svg>`;
}
const LEAF_COLORS = ['#c0392b','#e67e22','#f39c12','#8b4513','#a04020','#d4500a'];

function spawnRain(L) {
  // Rain streaks
  for (let i = 0; i < 80; i++) {
    L.appendChild(el('snow-el', `left:${Math.random()*100}%;animation-duration:${0.4+Math.random()*.6}s;animation-delay:-${Math.random()*2}s`, '<svg width="2" height="16"><line x1="1" y1="0" x2="1" y2="16" stroke="rgba(160,210,240,.5)" stroke-width="1.5" stroke-linecap="round"/></svg>'));
  }
  // Falling leaves
  for (let i = 0; i < 14; i++) {
    const c = LEAF_COLORS[i % LEAF_COLORS.length];
    const sz = 14 + Math.random() * 16;
    const rev = i % 3 === 0;
    L.appendChild(el('butterfly-el', `left:${Math.random()*90}%;top:${Math.random()*60}%;animation-duration:${8+Math.random()*10}s;animation-delay:-${Math.random()*10}s`, leafSVG(c, sz)));
  }
  // Puddle ripples at bottom
  for (let i = 0; i < 6; i++) {
    L.appendChild(el('jelly-el', `left:${5+i*16}%;bottom:3%;top:auto;animation-duration:${2+i*.4}s;animation-delay:-${i*.6}s`, rainRippleSVG()));
  }
  // Fog layer (large blurry white ellipses low opacity)
  for (let i = 0; i < 4; i++) {
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;bottom:${i*8}%;left:${-10+i*25}%;width:50%;height:15%;background:radial-gradient(ellipse,rgba(200,220,240,.06),transparent);pointer-events:none`;
    L.appendChild(d);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  JAPAN — cerezos, grullas, tori, pétalos
// ══════════════════════════════════════════════════════════════════════
function cherrySVG(h) {
  const w = h * .7;
  return `<svg width="${w}" height="${h}" viewBox="0 0 70 100" fill="none">
    <rect x="32" y="70" width="6" height="30" rx="2" fill="#5a3020" opacity=".9"/>
    <path d="M35 70 Q10 50 5 25 Q8 5 25 3 Q35 2 35 15 Q35 2 45 3 Q62 5 65 25 Q60 50 35 70Z" fill="#e8b4c8" opacity=".85"/>
    <path d="M35 70 Q15 45 18 25 Q22 10 35 15 Q48 10 52 25 Q55 45 35 70Z" fill="#f5cad8" opacity=".6"/>
    <!-- blossoms -->
    <circle cx="18" cy="22" r="5" fill="#ffb3cc" opacity=".8"/>
    <circle cx="52" cy="20" r="5" fill="#ffb3cc" opacity=".8"/>
    <circle cx="25" cy="38" r="4" fill="#ffc8d8" opacity=".7"/>
    <circle cx="46" cy="36" r="4" fill="#ffc8d8" opacity=".7"/>
    <circle cx="35" cy="28" r="5" fill="#ffe0ec" opacity=".75"/>
  </svg>`;
}
function craneSVG() {
  return `<svg width="70" height="50" viewBox="0 0 70 50" fill="none">
    <path d="M5 30 Q18 10 35 22 Q52 10 65 30" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".9"/>
    <path d="M5 30 Q10 38 14 32 M65 30 Q60 38 56 32" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".7"/>
    <ellipse cx="35" cy="22" rx="7" ry="5" fill="white" opacity=".9"/>
    <path d="M35 22 L32 18 L30 20" stroke="#cc2200" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <circle cx="33" cy="20" r="1.5" fill="#cc2200" opacity=".9"/>
  </svg>`;
}
function petalSVG() {
  return `<svg width="10" height="13" viewBox="0 0 10 13" fill="none">
    <path d="M5 12 Q1 8 1 5 Q1 1 5 0 Q9 1 9 5 Q9 8 5 12Z" fill="#ffb3cc" opacity=".8"/>
  </svg>`;
}
function toriSVG() {
  return `<svg width="90" height="90" viewBox="0 0 90 90" fill="none">
    <rect x="5"  y="20" width="10" height="70" rx="3" fill="#cc2200" opacity=".85"/>
    <rect x="75" y="20" width="10" height="70" rx="3" fill="#cc2200" opacity=".85"/>
    <rect x="0"  y="18" width="90" height="9"  rx="2" fill="#cc2200" opacity=".9"/>
    <path d="M0 18 Q45 2 90 18" stroke="#cc2200" stroke-width="6" stroke-linecap="round" fill="none" opacity=".9"/>
    <rect x="8"  y="30" width="74" height="7" rx="2" fill="#cc2200" opacity=".7"/>
  </svg>`;
}

function spawnJapan(L) {
  // Cherry trees
  [2, 20, 60, 80].forEach((x, i) => {
    const h = 110 + Math.random() * 60;
    L.appendChild(el('ftree-el', `left:${x}%;animation-duration:${5+i}s;animation-delay:-${i}s`, cherrySVG(h)));
  });
  // Torii gate
  L.appendChild(el('ftree-el', 'left:42%;animation-duration:0s', toriSVG()));
  // Cranes
  for (let i = 0; i < 3; i++) {
    L.appendChild(el('eagle-el', `animation-duration:${22+i*8}s;animation-delay:-${i*7}s;top:${10+i*7}%`, craneSVG()));
  }
  // Cherry petals falling
  for (let i = 0; i < 25; i++) {
    L.appendChild(el('snow-el', `left:${Math.random()*100}%;animation-duration:${5+Math.random()*8}s;animation-delay:-${Math.random()*12}s`, petalSVG()));
  }
  // Firefly-like paper lanterns (dots)
  for (let i = 0; i < 8; i++) {
    const sz = 8 + Math.random() * 6;
    L.appendChild(el('firefly-el', `left:${10+i*10}%;top:${40+Math.random()*30}%;width:${sz}px;height:${sz}px;background:#ffcc44;box-shadow:0 0 ${sz*2}px #ffaa22;border-radius:3px;animation-duration:${4+i}s;animation-delay:-${i*1.5}s`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  SWAMP — ciénaga, fuegos fatuos, ranas, nenúfares, niebla
// ══════════════════════════════════════════════════════════════════════
function lilypadSVG(sz) {
  return `<svg width="${sz}" height="${sz*.55}" viewBox="0 0 80 44" fill="none">
    <ellipse cx="40" cy="24" rx="38" ry="20" fill="#2d6e1a" opacity=".85"/>
    <path d="M40 4 L40 24" stroke="#1a4a0a" stroke-width="2" fill="none" opacity=".6"/>
    <ellipse cx="40" cy="24" rx="28" ry="14" fill="#3a8520" opacity=".4"/>
    <circle cx="32" cy="18" r="5" fill="#ffccdd" opacity=".9"/>
    <circle cx="32" cy="18" r="3" fill="#ff88aa" opacity=".8"/>
  </svg>`;
}
function frogSVG() {
  return `<svg width="34" height="26" viewBox="0 0 34 26" fill="none">
    <ellipse cx="17" cy="16" rx="13" ry="9" fill="#3a8520" opacity=".9"/>
    <ellipse cx="8"  cy="9"  rx="6"  ry="5" fill="#3a8520" opacity=".9"/>
    <ellipse cx="26" cy="9"  rx="6"  ry="5" fill="#3a8520" opacity=".9"/>
    <circle  cx="6"  cy="8"  r="3.5" fill="#88cc44" opacity=".8"/>
    <circle  cx="28" cy="8"  r="3.5" fill="#88cc44" opacity=".8"/>
    <circle  cx="6"  cy="8"  r="1.5" fill="#111"/>
    <circle  cx="28" cy="8"  r="1.5" fill="#111"/>
    <path d="M12 20 Q17 23 22 20" stroke="#1a5010" stroke-width="1.5" fill="none" opacity=".7"/>
  </svg>`;
}
function willowSVG(h) {
  const w = h * 0.7;
  return `<svg width="${w}" height="${h}" viewBox="0 0 70 100" fill="none">
    <rect x="32" y="70" width="6" height="30" rx="2" fill="#3a2010" opacity=".9"/>
    <ellipse cx="35" cy="42" rx="28" ry="35" fill="#1a4a0a" opacity=".8"/>
    <path d="M20 30 Q10 55 8 75 M30 25 Q25 55 22 78 M40 22 Q42 52 40 78 M50 25 Q55 52 58 75 M60 32 Q65 55 62 72" stroke="#2d6e1a" stroke-width="2" fill="none" opacity=".7"/>
  </svg>`;
}

function spawnSwamp(L) {
  // Sauce llorón
  [2, 75].forEach((x, i) => {
    const h = 120 + Math.random() * 60;
    L.appendChild(el('seaweed-el', `left:${x}%;animation-duration:${6+i}s`, willowSVG(h)));
  });
  // Nenúfares
  [10,22,35,50,65,78].forEach((x, i) => {
    const sz = 40 + Math.random() * 30;
    L.appendChild(el('jelly-el', `left:${x}%;bottom:2%;top:auto;animation-duration:${4+i}s;animation-delay:-${i}s`, lilypadSVG(sz)));
  });
  // Ranas
  for (let i = 0; i < 4; i++) {
    L.appendChild(el('bee-el', `left:${12+i*22}%;bottom:5%;top:auto;animation-duration:${5+i*2}s;animation-delay:-${i*2}s`, frogSVG()));
  }
  // Fuegos fatuos — verdes y azulados
  const ffColors = ['#88ffaa','#aaffcc','#66ffee','#aaffee','#ccffaa'];
  for (let i = 0; i < 18; i++) {
    const sz = 5 + Math.random() * 8;
    const c  = ffColors[i % ffColors.length];
    L.appendChild(el('firefly-el', `left:${Math.random()*90+5}%;top:${20+Math.random()*60}%;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 ${sz*2.5}px ${c};animation-duration:${4+Math.random()*7}s;animation-delay:-${Math.random()*7}s`));
  }
  // Niebla
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;bottom:${i*6}%;left:${-5+i*20}%;width:45%;height:12%;background:radial-gradient(ellipse,rgba(180,220,180,.07),transparent);pointer-events:none`;
    L.appendChild(d);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  CAVE — estalactitas, cristales, murciélagos, gotas
// ══════════════════════════════════════════════════════════════════════
function stalactiteSVG(h, glow) {
  const w = h * 0.35;
  return `<svg width="${w}" height="${h}" viewBox="0 0 14 ${h}" fill="none">
    <path d="M7 0 Q2 ${h*.4} 1 ${h} Q7 ${h*.85} 13 ${h} Q12 ${h*.4} 7 0Z" fill="#2a3040" opacity=".9"/>
    <path d="M7 0 Q5 ${h*.3} 5 ${h*.6}" stroke="rgba(150,180,220,.2)" stroke-width="1" fill="none"/>
    ${glow ? `<ellipse cx="7" cy="${h}" rx="4" ry="2" fill="${glow}" opacity=".6"/>` : ''}
  </svg>`;
}
function crystalSVG(h, color) {
  const w = h * 0.45;
  return `<svg width="${w}" height="${h}" viewBox="0 0 18 ${h}" fill="none">
    <polygon points="9,0 18,${h*.6} 14,${h} 4,${h} 0,${h*.6}" fill="${color}" opacity=".8"/>
    <polygon points="9,0 18,${h*.6} 14,${h*.4}" fill="rgba(255,255,255,.2)" opacity=".5"/>
    <polygon points="9,0 0,${h*.6} 4,${h*.4}" fill="rgba(255,255,255,.1)" opacity=".4"/>
  </svg>`;
}
function batSVG() {
  return `<svg width="38" height="20" viewBox="0 0 38 20" fill="none">
    <path d="M5 10 Q9 2 14 8 Q16 4 19 8 Q22 4 24 8 Q29 2 33 10" fill="#2a1a3a" opacity=".9"/>
    <ellipse cx="19" cy="12" rx="5" ry="4" fill="#3a2a4a" opacity=".9"/>
    <circle cx="17" cy="11" r="1.2" fill="#ffaa44" opacity=".8"/>
    <circle cx="21" cy="11" r="1.2" fill="#ffaa44" opacity=".8"/>
  </svg>`;
}

function spawnCave(L) {
  // Estalactitas
  [3,8,14,20,28,36,44,52,60,68,75,82,90].forEach((x, i) => {
    const h = 40 + Math.random() * 80;
    const glowColors = [null, null, '#88aaff', null, '#aaffcc', null, '#ff88aa', null];
    L.appendChild(el('seaweed-el', `left:${x}%;animation-duration:0s`, stalactiteSVG(h, glowColors[i % glowColors.length])));
  });
  // Cristales en el suelo
  const cColors = ['#88aaff','#aaccff','#ccaaff','#88ffcc','#ffaacc','#aaffee'];
  [5,15,25,40,55,65,75,88].forEach((x, i) => {
    const h = 30 + Math.random() * 50;
    L.appendChild(el('ftree-el', `left:${x}%;animation-duration:3s;animation-delay:-${i}s`, crystalSVG(h, cColors[i % cColors.length])));
  });
  // Murciélagos
  for (let i = 0; i < 5; i++) {
    L.appendChild(el('butterfly-el', `left:${5+i*18}%;top:${5+Math.random()*20}%;animation-duration:${3+i*1.5}s;animation-delay:-${i*2}s`, batSVG()));
  }
  // Puntos de bioluminiscencia
  for (let i = 0; i < 20; i++) {
    const sz = 3 + Math.random() * 5;
    const c  = cColors[i % cColors.length];
    L.appendChild(el('firefly-el', `left:${Math.random()*100}%;top:${Math.random()*90}%;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 ${sz*3}px ${c};animation-duration:${3+Math.random()*6}s;animation-delay:-${Math.random()*6}s`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  UNDERWATER ARCTIC — belugas, focas, hielo desde abajo, peces
// ══════════════════════════════════════════════════════════════════════
function belugaSVG() {
  return `<svg width="90" height="40" viewBox="0 0 90 40" fill="none">
    <path d="M80 20 C65 8 30 10 10 20 C30 30 65 32 80 20Z" fill="#e8f4ff" opacity=".92"/>
    <path d="M80 20 L90 16 L88 20 L90 24Z" fill="#e8f4ff" opacity=".8"/>
    <ellipse cx="15" cy="19" rx="5" ry="4" fill="rgba(0,0,0,.3)"/>
    <circle  cx="14" cy="18" r="2" fill="#111"/>
    <circle  cx="13.5" cy="17.5" r=".7" fill="rgba(255,255,255,.8)"/>
    <path d="M20 26 Q30 32 45 28 M55 10 Q60 6 70 12" stroke="rgba(200,220,240,.5)" stroke-width="2" fill="none"/>
  </svg>`;
}
function sealSVG() {
  return `<svg width="60" height="30" viewBox="0 0 60 30" fill="none">
    <ellipse cx="30" cy="17" rx="26" ry="12" fill="#c8c0b8" opacity=".9"/>
    <ellipse cx="15" cy="15" rx="10" ry="7" fill="#d4ccc4" opacity=".85"/>
    <circle  cx="10" cy="13" r="4.5" fill="#d4ccc4" opacity=".9"/>
    <circle  cx="8"  cy="12" r="2" fill="#222"/>
    <circle  cx="7.5" cy="11.5" r=".7" fill="rgba(255,255,255,.8)"/>
    <path d="M5 14 Q2 12 1 14 M8 17 Q5 20 3 18" stroke="#c8c0b8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M52 16 Q58 12 60 16 M52 20 Q58 24 60 20" stroke="#c8c0b8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </svg>`;
}
function iceUnderSVG(w) {
  return `<svg width="${w}" height="50" viewBox="0 0 ${w} 50" fill="none">
    <path d="M0 0 Q${w*.15} 20 ${w*.25} 8 Q${w*.35} 0 ${w*.45} 15 Q${w*.55} 28 ${w*.65} 10 Q${w*.75} 0 ${w*.85} 18 Q${w*.92} 28 ${w} 12 L${w} 50 L0 50Z" fill="rgba(180,220,255,.25)"/>
    <path d="M0 0 Q${w*.2} 12 ${w*.3} 4 Q${w*.5} -2 ${w*.6} 8 Q${w*.75} 16 ${w} 6" stroke="rgba(200,235,255,.4)" stroke-width="2" fill="none"/>
  </svg>`;
}

function spawnUnderArctic(L) {
  // Hielo superior
  L.appendChild(el('seaweed-el', `left:0;width:100%;animation-duration:0s`, iceUnderSVG(window.innerWidth || 1200)));
  // Belugas
  for (let i = 0; i < 3; i++) {
    const rev = i % 2 === 1;
    L.appendChild(el('fish-el'+(rev?' rev':''), `top:${15+i*18}%;animation-duration:${22+i*8}s;animation-delay:-${i*7}s`, belugaSVG()));
  }
  // Focas
  for (let i = 0; i < 2; i++) {
    L.appendChild(el('bee-el', `left:${20+i*50}%;top:${40+Math.random()*20}%;animation-duration:${8+i*3}s;animation-delay:-${i*4}s`, sealSVG()));
  }
  // Peces árticos pequeños
  const FISH_C2 = ['#88ccff','#aaddff','#66bbee','#99ccdd'];
  for (let i = 0; i < 8; i++) {
    const sz = 16 + Math.random() * 14;
    const c  = FISH_C2[i % FISH_C2.length];
    L.appendChild(el('fish-el'+(i%2?' rev':''), `top:${30+Math.random()*55}%;animation-duration:${12+Math.random()*10}s;animation-delay:-${Math.random()*12}s`, `<svg width="${sz}" height="${sz*.45}" viewBox="0 0 45 20" fill="none"><ellipse cx="18" cy="10" rx="16" ry="8" fill="${c}" opacity=".8"/><path d="M34 10 L44 5 L44 15Z" fill="${c}" opacity=".6"/><circle cx="6" cy="8" r="2" fill="rgba(0,0,0,.4)"/></svg>`));
  }
  // Burbujas
  for (let i = 0; i < 25; i++) {
    const sz = 4 + Math.random() * 9;
    L.appendChild(el('bubble-el', `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;background:rgba(180,220,255,.25);border-color:rgba(200,235,255,.4);animation-duration:${8+Math.random()*12}s;animation-delay:-${Math.random()*15}s`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  SAVANNA — acacia, jirafas, pájaros, sol
// ══════════════════════════════════════════════════════════════════════
function acaciaSVG(h) {
  const w = h * 1.1;
  return `<svg width="${w}" height="${h}" viewBox="0 0 110 100" fill="none">
    <rect x="50" y="55" width="10" height="45" rx="3" fill="#5a3a10" opacity=".9"/>
    <path d="M55 55 Q30 40 10 30 M55 55 Q45 35 35 20 M55 55 Q70 38 90 28 M55 55 Q65 35 75 20" stroke="#5a3a10" stroke-width="4" stroke-linecap="round" fill="none"/>
    <ellipse cx="15"  cy="28" rx="18" ry="12" fill="#2a6a10" opacity=".85"/>
    <ellipse cx="40"  cy="18" rx="16" ry="10" fill="#2d7012" opacity=".85"/>
    <ellipse cx="78"  cy="26" rx="18" ry="11" fill="#2a6a10" opacity=".85"/>
    <ellipse cx="55"  cy="42" rx="22" ry="13" fill="#336614" opacity=".8"/>
  </svg>`;
}
function giraffeSVG() {
  return `<svg width="30" height="80" viewBox="0 0 30 80" fill="none">
    <rect x="12" y="0"  width="6"  height="28" rx="3" fill="#d4a030" opacity=".9"/>
    <ellipse cx="15" cy="5" rx="8" ry="6" fill="#d4a030" opacity=".9"/>
    <rect x="7"  y="30" width="5"  height="50" rx="2" fill="#c89028" opacity=".9"/>
    <rect x="18" y="30" width="5"  height="50" rx="2" fill="#c89028" opacity=".9"/>
    <rect x="10" y="50" width="4"  height="30" rx="2" fill="#c89028" opacity=".85"/>
    <rect x="16" y="50" width="4"  height="30" rx="2" fill="#c89028" opacity=".85"/>
    <circle cx="15" cy="4"  r="2.5" fill="#111"/>
    <circle cx="14" cy="3.5" r=".9" fill="rgba(255,255,255,.8)"/>
    <!-- spots -->
    <ellipse cx="14" cy="14" rx="2.5" ry="2" fill="#8a5010" opacity=".6"/>
    <ellipse cx="18" cy="22" rx="2" ry="1.8" fill="#8a5010" opacity=".6"/>
    <ellipse cx="11" cy="35" rx="2" ry="1.8" fill="#8a5010" opacity=".5"/>
    <ellipse cx="20" cy="40" rx="2" ry="1.5" fill="#8a5010" opacity=".5"/>
  </svg>`;
}

function spawnSavanna(L) {
  // Acacias
  [2, 30, 62, 84].forEach((x, i) => {
    const h = 80 + Math.random() * 50;
    L.appendChild(el('ftree-el', `left:${x}%;animation-duration:${5+i}s;animation-delay:-${i}s`, acaciaSVG(h)));
  });
  // Jirafas en el horizonte
  for (let i = 0; i < 3; i++) {
    L.appendChild(el('ftree-el', `left:${15+i*30}%;animation-duration:${8+i*3}s;animation-delay:-${i*2}s`, giraffeSVG()));
  }
  // Pájaros tejedor (pequeños triángulos)
  for (let i = 0; i < 8; i++) {
    L.appendChild(el('snow-el', `left:${Math.random()*100}%;animation-duration:${6+Math.random()*8}s;animation-delay:-${Math.random()*8}s`, `<svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M6 0 L12 8 L0 8Z" fill="#2a1a0a" opacity=".7"/></svg>`));
  }
  // Sol grande en el fondo (div estático)
  const sun = document.createElement('div');
  sun.style.cssText = 'position:absolute;right:8%;top:8%;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(255,200,50,.35),rgba(255,150,0,.1),transparent);pointer-events:none';
  L.appendChild(sun);
  // Polvo en el suelo
  for (let i = 0; i < 15; i++) {
    const sz = 3 + Math.random() * 6;
    L.appendChild(el('bubble-el', `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;background:rgba(210,160,80,.25);border:none;animation-duration:${5+Math.random()*8}s;animation-delay:-${Math.random()*8}s`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  ALPS — picos nevados, prados, vacas, río, flores alpinas
// ══════════════════════════════════════════════════════════════════════
function alpsTreeSVG(h) {
  const w = h * 0.55;
  return `<svg width="${w}" height="${h}" viewBox="0 0 55 100" fill="none">
    <rect x="24" y="80" width="7" height="20" rx="2" fill="#5a3a20" opacity=".9"/>
    <polygon points="27.5,5 8,38 47,38"  fill="#2a6010" opacity=".9"/>
    <polygon points="27.5,20 6,56 49,56" fill="#2d6814" opacity=".85"/>
    <polygon points="27.5,35 5,74 50,74" fill="#306e16" opacity=".8"/>
    <polygon points="27.5,5 8,38 47,38"  fill="rgba(240,248,255,.18)" clip-path="inset(0 0 60% 0)"/>
  </svg>`;
}
function cowSVG() {
  return `<svg width="55" height="34" viewBox="0 0 55 34" fill="none">
    <ellipse cx="28" cy="20" rx="22" ry="12" fill="#f0e8e0" opacity=".9"/>
    <ellipse cx="12" cy="16" rx="9"  ry="7"  fill="#f0e8e0" opacity=".9"/>
    <circle  cx="8"  cy="14" r="2.5" fill="#111"/>
    <circle  cx="7.5" cy="13.5" r=".9" fill="rgba(255,255,255,.8)"/>
    <rect x="14" y="28" width="5" height="8" rx="2" fill="#e0d8d0" opacity=".9"/>
    <rect x="22" y="28" width="5" height="8" rx="2" fill="#e0d8d0" opacity=".9"/>
    <rect x="34" y="28" width="5" height="8" rx="2" fill="#e0d8d0" opacity=".9"/>
    <rect x="42" y="28" width="5" height="8" rx="2" fill="#e0d8d0" opacity=".9"/>
    <!-- spots -->
    <ellipse cx="30" cy="16" rx="6" ry="4" fill="#3a2a1a" opacity=".4"/>
    <ellipse cx="42" cy="22" rx="5" ry="3.5" fill="#3a2a1a" opacity=".35"/>
    <!-- bell -->
    <rect x="18" y="25" width="5" height="6" rx="1" fill="#cc9922" opacity=".8"/>
  </svg>`;
}
function edelweissSVG() {
  return `<svg width="20" height="28" viewBox="0 0 20 28" fill="none">
    <line x1="10" y1="28" x2="10" y2="14" stroke="#4a8020" stroke-width="1.8"/>
    <circle cx="10" cy="12" r="4" fill="#fafaf8" opacity=".9"/>
    <ellipse cx="4"  cy="10" rx="4" ry="2.5" fill="#fafaf8" opacity=".85" transform="rotate(-30 4 10)"/>
    <ellipse cx="16" cy="10" rx="4" ry="2.5" fill="#fafaf8" opacity=".85" transform="rotate(30 16 10)"/>
    <ellipse cx="7"  cy="5"  rx="4" ry="2.5" fill="#fafaf8" opacity=".85" transform="rotate(-70 7 5)"/>
    <ellipse cx="13" cy="5"  rx="4" ry="2.5" fill="#fafaf8" opacity=".85" transform="rotate(70 13 5)"/>
    <circle cx="10" cy="12" r="2.5" fill="#ffee88" opacity=".9"/>
  </svg>`;
}

function spawnAlps(L) {
  // Abetos alpinos
  [0, 8, 70, 80, 90].forEach((x, i) => {
    const h = 90 + Math.random() * 60;
    L.appendChild(el('ftree-el', `left:${x}%;animation-duration:${4+i}s;animation-delay:-${i}s`, alpsTreeSVG(h)));
  });
  // Vacas con cencerro
  for (let i = 0; i < 3; i++) {
    L.appendChild(el('bee-el', `left:${20+i*25}%;bottom:8%;top:auto;animation-duration:${8+i*3}s;animation-delay:-${i*3}s`, cowSVG()));
  }
  // Edelweiss
  [15,25,38,52,62,72].forEach((x, i) => {
    L.appendChild(el('flower-el', `left:${x}%;animation-duration:${3+i*.5}s;animation-delay:-${i*.5}s`, edelweissSVG()));
  });
  // Copos de nieve suaves
  for (let i = 0; i < 15; i++) {
    const sz = 5 + Math.random() * 8;
    L.appendChild(el('snow-el', `left:${Math.random()*100}%;animation-duration:${12+Math.random()*10}s;animation-delay:-${Math.random()*12}s`, `<svg width="${sz}" height="${sz}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="rgba(220,235,255,.5)"/></svg>`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  FESTIVAL — farolillos, fuegos artificiales, chispas
// ══════════════════════════════════════════════════════════════════════
function lanternSVG(color) {
  return `<svg width="22" height="32" viewBox="0 0 22 32" fill="none">
    <line x1="11" y1="0" x2="11" y2="5" stroke="rgba(180,140,60,.6)" stroke-width="1.5"/>
    <rect x="3" y="5" width="16" height="20" rx="4" fill="${color}" opacity=".85"/>
    <rect x="5" y="5" width="12" height="20" rx="3" fill="${color}" opacity=".4"/>
    <line x1="3" y1="12" x2="19" y2="12" stroke="rgba(0,0,0,.15)" stroke-width=".8"/>
    <line x1="3" y1="18" x2="19" y2="18" stroke="rgba(0,0,0,.15)" stroke-width=".8"/>
    <ellipse cx="11" cy="32" rx="5" ry="2.5" fill="${color}" opacity=".25"/>
    <line x1="11" y1="25" x2="11" y2="32" stroke="rgba(180,140,60,.4)" stroke-width="1"/>
  </svg>`;
}
function sparkSVG() {
  return `<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
    <circle cx="4" cy="4" r="2.5" fill="#ffee44" opacity=".9"/>
    <circle cx="4" cy="4" r="4"   fill="#ffcc22" opacity=".3"/>
  </svg>`;
}

function spawnFestival(L) {
  const lanternColors = ['#ff4444','#ff8800','#ffcc00','#ff44aa','#44aaff','#44ff88'];
  // Farolillos ascendiendo
  for (let i = 0; i < 18; i++) {
    const c = lanternColors[i % lanternColors.length];
    L.appendChild(el('bubble-el', `left:${Math.random()*90+5}%;width:22px;height:32px;border-radius:4px;background:none;border:none;animation-duration:${8+Math.random()*12}s;animation-delay:-${Math.random()*15}s`, lanternSVG(c)));
  }
  // Fuegos artificiales (partículas en ráfagas)
  for (let i = 0; i < 30; i++) {
    const sz = 4 + Math.random() * 7;
    const c  = lanternColors[i % lanternColors.length];
    L.appendChild(el('firefly-el', `left:${Math.random()*100}%;top:${5+Math.random()*50}%;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 ${sz*2}px ${c};animation-duration:${2+Math.random()*4}s;animation-delay:-${Math.random()*4}s`));
  }
  // Chispas cayendo
  for (let i = 0; i < 20; i++) {
    L.appendChild(el('snow-el', `left:${Math.random()*100}%;animation-duration:${1.5+Math.random()*2}s;animation-delay:-${Math.random()*3}s`, sparkSVG()));
  }
  // Multitud (siluetas en el fondo)
  const crowd = document.createElement('div');
  crowd.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:15%;background:linear-gradient(0deg,rgba(10,5,20,.6),transparent);pointer-events:none';
  L.appendChild(crowd);
}

// ══════════════════════════════════════════════════════════════════════
//  JUNGLE — tucanes, mariposa morpho, cascada, dosel denso
// ══════════════════════════════════════════════════════════════════════
function toucanSVG() {
  return `<svg width="55" height="45" viewBox="0 0 55 45" fill="none">
    <ellipse cx="25" cy="28" rx="18" ry="14" fill="#111118" opacity=".92"/>
    <ellipse cx="24" cy="22" rx="10" ry="8"  fill="#111118" opacity=".9"/>
    <path d="M30 20 Q50 15 52 22 Q50 30 30 26 Q25 24 24 22Z" fill="#ffcc00" opacity=".92"/>
    <path d="M30 20 Q50 15 52 22 Q50 30 30 26Z" fill="#ff4400" opacity=".6"/>
    <circle cx="21" cy="20" r="4" fill="#ffffcc" opacity=".9"/>
    <circle cx="20" cy="20" r="2" fill="#111"/>
    <circle cx="19.5" cy="19.5" r=".8" fill="rgba(255,255,255,.9)"/>
    <ellipse cx="25" cy="38" rx="10" ry="4" fill="#ff4400" opacity=".8"/>
    <path d="M15 30 Q10 36 8 40 M35 30 Q40 36 42 40" stroke="#111118" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
function morphoSVG() {
  return `<svg width="46" height="36" viewBox="0 0 46 36" fill="none">
    <g class="bfly-wing">
      <ellipse cx="9"  cy="13" rx="9"  ry="12" fill="#1166ff" opacity=".88"/>
      <ellipse cx="9"  cy="26" rx="7"  ry="8"  fill="#0044cc" opacity=".78"/>
      <ellipse cx="37" cy="13" rx="9"  ry="12" fill="#1166ff" opacity=".88" transform="scale(-1,1) translate(-46,0)"/>
      <ellipse cx="37" cy="26" rx="7"  ry="8"  fill="#0044cc" opacity=".78" transform="scale(-1,1) translate(-46,0)"/>
      <!-- iridescent spots -->
      <ellipse cx="9"  cy="12" rx="4"  ry="5"  fill="#44aaff" opacity=".5"/>
      <ellipse cx="37" cy="12" rx="4"  ry="5"  fill="#44aaff" opacity=".5" transform="scale(-1,1) translate(-46,0)"/>
    </g>
    <rect x="22" y="6" width="2" height="24" rx="1" fill="#1a0e00" opacity=".7"/>
  </svg>`;
}
function jungleLeafSVG(h, c) {
  const w = h * 1.2;
  return `<svg width="${w}" height="${h}" viewBox="0 0 120 100" fill="none">
    <path d="M60 95 Q10 60 5 20 Q30 0 60 10 Q90 0 115 20 Q110 60 60 95Z" fill="${c}" opacity=".85"/>
    <path d="M60 95 Q60 50 60 10" stroke="rgba(0,0,0,.2)" stroke-width="2" fill="none"/>
    <path d="M60 65 Q30 55 15 35 M60 50 Q88 42 105 25" stroke="rgba(0,0,0,.12)" stroke-width="1.2" fill="none"/>
  </svg>`;
}

function spawnJungle(L) {
  const leafColors = ['#0a3a0a','#0d4a0d','#0a420a','#123a12','#154815'];
  // Hojas del dosel
  [0,8,16,60,70,80,90].forEach((x, i) => {
    const h = 80 + Math.random() * 60;
    L.appendChild(el('seaweed-el', `left:${x}%;animation-duration:${4+i*.8}s;animation-delay:-${i}s`, jungleLeafSVG(h, leafColors[i % leafColors.length])));
  });
  // Tucanes
  for (let i = 0; i < 2; i++) {
    L.appendChild(el('owl-el', `left:${20+i*45}%;top:${10+Math.random()*20}%;animation-duration:${5+i*2}s`, toucanSVG()));
  }
  // Mariposas morpho
  for (let i = 0; i < 5; i++) {
    L.appendChild(el('butterfly-el', `left:${8+i*18}%;top:${20+Math.random()*35}%;animation-duration:${5+i*1.5}s;animation-delay:-${i*2}s`, morphoSVG()));
  }
  // Cascada lateral
  const waterfall = document.createElement('div');
  waterfall.style.cssText = 'position:absolute;right:3%;top:10%;width:12px;height:80%;background:linear-gradient(180deg,rgba(180,220,255,.4),rgba(180,220,255,.15));border-radius:6px;pointer-events:none';
  L.appendChild(waterfall);
  // Partículas de agua
  for (let i = 0; i < 15; i++) {
    const sz = 3 + Math.random() * 5;
    L.appendChild(el('bubble-el', `width:${sz}px;height:${sz}px;right:${Math.random()*8}%;background:rgba(180,220,255,.4);border-color:rgba(200,235,255,.5);animation-duration:${3+Math.random()*5}s;animation-delay:-${Math.random()*5}s`));
  }
}

// ══════════════════════════════════════════════════════════════════════
//  MARS — cielo rosa, dunas rojas, lunas, rover
// ══════════════════════════════════════════════════════════════════════
function duneSVG(w, h) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
    <path d="M0 ${h} Q${w*.25} ${h*.2} ${w*.5} ${h*.4} Q${w*.75} ${h*.6} ${w} ${h*.2} L${w} ${h}Z" fill="#8a2a10" opacity=".9"/>
    <path d="M0 ${h} Q${w*.3} ${h*.4} ${w*.55} ${h*.55} Q${w*.75} ${h*.7} ${w} ${h*.35} L${w} ${h}Z" fill="#aa3818" opacity=".6"/>
  </svg>`;
}
function roverSVG() {
  return `<svg width="70" height="40" viewBox="0 0 70 40" fill="none">
    <rect x="15" y="12" width="40" height="18" rx="3" fill="#8a8880" opacity=".9"/>
    <rect x="8"  y="8"  width="54" height="8"  rx="2" fill="#aaa8a0" opacity=".85"/>
    <!-- solar panels -->
    <rect x="2"  y="4"  width="20" height="5" rx="1" fill="#4466aa" opacity=".8"/>
    <rect x="48" y="4"  width="20" height="5" rx="1" fill="#4466aa" opacity=".8"/>
    <!-- wheels -->
    <circle cx="18" cy="32" r="7" fill="#555550" opacity=".9"/>
    <circle cx="18" cy="32" r="4" fill="#444440" opacity=".8"/>
    <circle cx="35" cy="34" r="6" fill="#555550" opacity=".9"/>
    <circle cx="35" cy="34" r="3.5" fill="#444440" opacity=".8"/>
    <circle cx="52" cy="32" r="7" fill="#555550" opacity=".9"/>
    <circle cx="52" cy="32" r="4" fill="#444440" opacity=".8"/>
    <!-- camera mast -->
    <line x1="35" y1="12" x2="35" y2="2" stroke="#888" stroke-width="2"/>
    <circle cx="35" cy="2" r="3" fill="#aaa" opacity=".9"/>
    <circle cx="34" cy="1" r="1.2" fill="#222"/>
  </svg>`;
}
function marsMoonSVG(r, opacity) {
  return `<svg width="${r*2}" height="${r*2}" viewBox="0 0 ${r*2} ${r*2}" fill="none">
    <circle cx="${r}" cy="${r}" r="${r*.9}" fill="#c8b890" opacity="${opacity}"/>
    <circle cx="${r*.7}" cy="${r*.7}" r="${r*.2}" fill="#b8a880" opacity=".5"/>
    <circle cx="${r*1.3}" cy="${r*1.1}" r="${r*.15}" fill="#b8a880" opacity=".4"/>
  </svg>`;
}

function spawnMars(L) {
  // Dunas
  [0, 35, 60].forEach((x, i) => {
    const w = 400 + Math.random() * 300, h = 80 + Math.random() * 60;
    L.appendChild(el('seaweed-el', `left:${x}%;animation-duration:0s`, duneSVG(w, h)));
  });
  // Dos lunas marcianas (Fobos y Deimos)
  L.appendChild(el('owl-el', `left:72%;top:8%;animation-duration:8s`, marsMoonSVG(18, 0.75)));
  L.appendChild(el('owl-el', `left:85%;top:14%;animation-duration:12s`, marsMoonSVG(10, 0.55)));
  // Rover cruzando
  L.appendChild(el('fish-el', `top:72%;animation-duration:45s;animation-delay:-10s`, roverSVG()));
  // Polvo marciano
  for (let i = 0; i < 25; i++) {
    const sz = 2 + Math.random() * 5;
    L.appendChild(el('bubble-el', `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;background:rgba(180,80,40,.3);border:none;animation-duration:${6+Math.random()*10}s;animation-delay:-${Math.random()*10}s`));
  }
  // Partículas de polvo en el suelo
  for (let i = 0; i < 10; i++) {
    const sz = 3 + Math.random() * 4;
    L.appendChild(el('snow-el', `left:${Math.random()*100}%;bottom:${Math.random()*20}%;animation-duration:${4+Math.random()*6}s;animation-delay:-${Math.random()*6}s`, `<svg width="${sz}" height="${sz}" viewBox="0 0 4 4"><circle cx="2" cy="2" r="1.5" fill="rgba(200,100,60,.4)"/></svg>`));
  }
}
