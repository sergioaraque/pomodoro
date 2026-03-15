/**
 * confetti.js — Micro-animación de partículas al completar una sesión de enfoque
 * Canvas temporal de 800ms. Sin dependencias. ~30 líneas de lógica real.
 */

export function burstConfetti(accentColor = '#4ecdc4') {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Generate colors based on accent
  const colors = [
    accentColor,
    accentColor + 'aa',
    '#ffffff88',
    _lighten(accentColor),
    _lighten(accentColor, 60),
  ];

  // Origin: center of the timer display
  const timerEl = document.getElementById('timer-disp');
  const rect     = timerEl?.getBoundingClientRect();
  const ox = rect ? rect.left + rect.width / 2 : canvas.width / 2;
  const oy = rect ? rect.top  + rect.height / 2 : canvas.height * 0.4;

  // Spawn particles
  const N = 40;
  const particles = Array.from({ length: N }, (_, i) => {
    const angle  = (Math.PI * 2 * i / N) + (Math.random() - 0.5) * 0.5;
    const speed  = 2.5 + Math.random() * 4;
    const size   = 4 + Math.random() * 7;
    const isRect = Math.random() > 0.5;
    return {
      x: ox, y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,  // upward bias
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      isRect,
      alpha: 1,
    };
  });

  const START = performance.now();
  const DURATION = 900;

  function frame(now) {
    const elapsed = now - START;
    const progress = elapsed / DURATION;
    if (progress >= 1) { canvas.remove(); return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.18;  // gravity
      p.vx *= 0.985; // drag
      p.rot += p.rotV;
      p.alpha = Math.max(0, 1 - progress * 1.4);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.isRect) {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.55);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function _lighten(hex, amount = 40) {
  // Simple hex lightener
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = v => Math.min(255, v + amount);
  return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}
