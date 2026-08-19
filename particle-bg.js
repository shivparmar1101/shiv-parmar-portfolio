/* ============================================
   Zero Gravity Particle Background
   Floating particle system with mouse interaction
   ============================================ */

(function () {
  'use strict';

  const PARTICLE_DENSITY = 0.0001;
  const BG_PARTICLE_DENSITY = 0.00004;
  const MOUSE_RADIUS = 200;
  const RETURN_SPEED = 0.008;
  const DAMPING = 0.985;
  const REPULSION_STRENGTH = 2.5;
  const DRIFT_STRENGTH = 0.03;

  let canvas, ctx, container;
  let particles = [];
  let bgParticles = [];
  let mouse = { x: -1000, y: -1000, active: false };
  let frameId;
  let w, h;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initParticles() {
    const count = Math.floor(w * h * PARTICLE_DENSITY);
    particles = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      particles.push({
        x: x, y: y,
        ox: x, oy: y,
        vx: rand(-0.5, 0.5),
        vy: rand(-0.5, 0.5),
        size: rand(1, 2.8),
        color: Math.random() > 0.88 ? '#c9a84c' : '#ffffff',
        angle: Math.random() * Math.PI * 2,
        driftPhase: Math.random() * Math.PI * 2
      });
    }

    const bgCount = Math.floor(w * h * BG_PARTICLE_DENSITY);
    bgParticles = [];
    for (let i = 0; i < bgCount; i++) {
      bgParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: rand(0.5, 1.5),
        alpha: rand(0.08, 0.4),
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function animate(time) {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Pulsating radial glow ---
    const cx = w / 2, cy = h / 2;
    const pulse = Math.sin(time * 0.0006) * 0.03 + 0.07;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.65);
    grad.addColorStop(0, 'rgba(201, 168, 76, ' + pulse + ')');
    grad.addColorStop(0.5, 'rgba(66, 133, 244, ' + (pulse * 0.4) + ')');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Background particles (twinkling) ---
    for (let i = 0; i < bgParticles.length; i++) {
      const p = bgParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      const twinkle = Math.sin(time * 0.0015 + p.phase) * 0.5 + 0.5;
      ctx.globalAlpha = p.alpha * (0.3 + 0.7 * twinkle);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- Main particles physics ---
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Continuous organic drift
      p.driftPhase += 0.01;
      p.vx += Math.sin(p.driftPhase) * DRIFT_STRENGTH * 0.1;
      p.vy += Math.cos(p.driftPhase * 0.7) * DRIFT_STRENGTH * 0.1;

      // Mouse repulsion
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (mouse.active && dist < MOUSE_RADIUS && dist > 0.1) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        const repulse = force * REPULSION_STRENGTH;
        p.vx -= (dx / dist) * repulse * 8;
        p.vy -= (dy / dist) * repulse * 8;
      }

      // Very soft spring back to origin
      p.vx += (p.ox - p.x) * RETURN_SPEED;
      p.vy += (p.oy - p.y) * RETURN_SPEED;
    }

    // Particle-particle collision
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dSq = dx * dx + dy * dy;
        const minD = a.size + b.size;
        if (dSq < minD * minD && dSq > 0.01) {
          const d = Math.sqrt(dSq);
          const nx = dx / d, ny = dy / d;
          const overlap = minD - d;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;

          const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
          const vAlongN = dvx * nx + dvy * ny;
          if (vAlongN > 0) {
            const imp = (-(1 + 0.85) * vAlongN) / (1 / a.size + 1 / b.size);
            a.vx += (imp / a.size) * nx;
            a.vy += (imp / a.size) * ny;
            b.vx -= (imp / b.size) * nx;
            b.vy -= (imp / b.size) * ny;
          }
        }
      }
    }

    // Draw main particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.vx *= DAMPING;
      p.vy *= DAMPING;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen edges
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const opacity = Math.min(0.3 + vel * 0.06, 1);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      if (p.color === '#ffffff') {
        ctx.fillStyle = 'rgba(255,255,255,' + opacity + ')';
      } else {
        ctx.fillStyle = p.color;
      }
      ctx.fill();
    }

    frameId = requestAnimationFrame(animate);
  }

  function resize() {
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    initParticles();
  }

  function onMouseMove(e) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }

  function onMouseLeave() { mouse.active = false; }

  function init() {
    container = document.getElementById('particle-hero');
    if (!container) return;

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    window.addEventListener('resize', resize);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    resize();
    frameId = requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
