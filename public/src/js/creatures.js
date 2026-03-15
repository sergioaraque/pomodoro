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
  }
}
