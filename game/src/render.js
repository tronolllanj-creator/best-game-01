import { FIELD, PALETTE, FONT, ROCK, CORE, WAVE, HULK, SHIP } from './config.js';

// Drawing only: state and screen in, pixels out.
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let viewScale = 1;
  let viewX = 0;
  let viewY = 0;
  const fontCache = new Map();

  function getFont(size) {
    let f = fontCache.get(size);
    if (!f) {
      f = `${size}px ${FONT}`;
      fontCache.set(size, f);
    }
    return f;
  }

  function text(val, x, y, size, color, align = 'left') {
    ctx.save();
    ctx.font = getFont(size);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(val, x, y);
    ctx.restore();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const scaleX = w / FIELD.width;
    const scaleY = h / FIELD.height;
    viewScale = Math.min(scaleX, scaleY);
    viewX = (w - FIELD.width * viewScale) / 2;
    viewY = (h - FIELD.height * viewScale) / 2;
  }

  function view() {
    return { scale: viewScale, x: viewX, y: viewY };
  }

  function drawPanel(titleText, lines, promptText, bestText, subText) {
    ctx.save();
    ctx.resetTransform();
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    ctx.fillStyle = 'rgba(7, 11, 22, 0.75)';
    ctx.fillRect(0, 0, w, h);

    const pw = 600;
    const ph = 420;
    const px = (w - pw) / 2;
    const py = (h - ph) / 2;

    ctx.fillStyle = PALETTE.panel;
    ctx.strokeStyle = PALETTE.muted;
    ctx.lineWidth = 2;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);

    text(titleText, px + pw / 2, py + 45, 40, PALETTE.text, 'center');
    if (subText) {
      text(subText, px + pw / 2, py + 85, 18, PALETTE.core, 'center');
    }

    let ly = py + 130;
    for (const l of lines) {
      text(l, px + pw / 2, ly, 16, PALETTE.muted, 'center');
      ly += 26;
    }

    if (bestText) {
      text(bestText, px + pw / 2, py + 290, 18, PALETTE.gold, 'center');
    }

    text(promptText, px + pw / 2, py + 360, 20, PALETTE.gold, 'center');
    ctx.restore();
  }

  function draw(state, screen, best, banner) {
    resize();

    ctx.save();
    ctx.translate(viewX, viewY);
    ctx.scale(viewScale, viewScale);

    // Backdrop gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    bgGrad.addColorStop(0, PALETTE.backdrop);
    bgGrad.addColorStop(1, PALETTE.sky);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    // Nebulae
    const nebulae = [
      { x: FIELD.width * 0.2, y: FIELD.height * 0.3, r: 400, c: PALETTE.nebula1 },
      { x: FIELD.width * 0.8, y: FIELD.height * 0.7, r: 500, c: PALETTE.nebula2 },
      { x: FIELD.width * 0.5, y: FIELD.height * 0.5, r: 600, c: PALETTE.nebula1 },
      { x: FIELD.width * 0.8, y: FIELD.height * 0.2, r: 350, c: PALETTE.nebula2 },
      { x: FIELD.width * 0.1, y: FIELD.height * 0.8, r: 450, c: PALETTE.nebula1 }
    ];
    ctx.globalAlpha = 0.25;
    for (const n of nebulae) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, n.c);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Stars & Grid
    ctx.fillStyle = PALETTE.muted;
    for (let i = 0; i < 120; i++) {
      const sx = (i * 137.5) % FIELD.width;
      const sy = (i * 253.1) % FIELD.height;
      const twinkle = Math.sin(state.time * 3 + i) * 0.5 + 0.5;
      ctx.globalAlpha = 0.2 + twinkle * 0.5;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = PALETTE.nebula1;
    for (let x = 0; x <= FIELD.width; x += 80) {
      for (let y = 0; y <= FIELD.height; y += 80) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Cores
    for (const c of state.cores) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(state.time * 2);
      const scale = 1 + Math.sin(state.time * 6 + c.x) * 0.15;
      ctx.scale(scale, scale);
      ctx.shadowColor = PALETTE.coreGlow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = PALETTE.core;
      ctx.beginPath();
      ctx.moveTo(0, -CORE.radius);
      ctx.lineTo(CORE.radius, 0);
      ctx.lineTo(0, CORE.radius);
      ctx.lineTo(-CORE.radius, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Pickups
    for (const p of state.pickups) {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.type === 'repair') {
        ctx.fillStyle = PALETTE.hull;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.text;
        ctx.fillRect(-3, -8, 6, 16);
        ctx.fillRect(-8, -3, 16, 6);
      } else {
        ctx.fillStyle = PALETTE.gold;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.backdrop;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(4, -1);
        ctx.lineTo(-2, 1);
        ctx.lineTo(2, 8);
        ctx.lineTo(-4, 1);
        ctx.lineTo(2, -1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Rocks
    for (const r of state.rocks) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.fillStyle = PALETTE.rockDark;
      ctx.strokeStyle = PALETTE.rock;
      ctx.lineWidth = 2;

      if (r.isHulk) {
        ctx.fillStyle = PALETTE.rust;
        ctx.strokeStyle = PALETTE.rock;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const pts = 8;
        for (let i = 0; i < pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          const rad = r.radius * (0.8 + Math.sin(i * 3) * 0.2);
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gold cracks
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-30, -30);
        ctx.lineTo(10, 10);
        ctx.lineTo(30, -10);
        ctx.moveTo(-10, 20);
        ctx.lineTo(20, 30);
        ctx.stroke();

        // HP Arc
        const hpRatio = r.hp / HULK.hp;
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, r.radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpRatio);
        ctx.stroke();
      } else {
        ctx.beginPath();
        const verts = r.verts;
        for (let i = 0; i < verts.length; i++) {
          const v = verts[i];
          const px = Math.cos(v.a) * v.r;
          const py = Math.sin(v.a) * v.r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Bullets
    ctx.strokeStyle = PALETTE.gold;
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3;
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.04, b.y - b.vy * 0.04);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Particles
    for (const p of state.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Ship
    if (state.ship.hull > 0) {
      const s = state.ship;

      // Dash trail ghosts
      if (s.dashTimer > 0) {
        ctx.fillStyle = PALETTE.core;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(s.x - s.vx * 0.05, s.y - s.vy * 0.05, SHIP.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      // Shield ring if invuln
      if (s.invulnTimer > 0 && Math.floor(state.time * 20) % 2 === 0) {
        ctx.strokeStyle = PALETTE.core;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, SHIP.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Engine flame
      if (s.thrusting) {
        ctx.fillStyle = PALETTE.core;
        ctx.beginPath();
        ctx.moveTo(-12, -6);
        ctx.lineTo(-24 - Math.random() * 6, 0);
        ctx.lineTo(-12, 6);
        ctx.closePath();
        ctx.fill();
      }

      // Claw arms
      ctx.fillStyle = PALETTE.shipDark;
      ctx.fillRect(4, -14, 14, 4);
      ctx.fillRect(4, 10, 14, 4);

      // Hull body
      ctx.fillStyle = PALETTE.ship;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = PALETTE.core;
      ctx.beginPath();
      ctx.ellipse(2, 0, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Popups
    for (const pop of state.popups) {
      const alpha = Math.max(0, pop.life / pop.maxLife);
      text(pop.text, pop.x, pop.y - (1.0 - alpha) * 30, 18, PALETTE.gold, 'center');
    }

    ctx.restore(); // restore view matrix

    // HUD
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      // Top-Left Score
      text('SCORE', 24, 28, 14, PALETTE.muted);
      text(state.score.toLocaleString('en-US'), 24, 52, 28, PALETTE.text);
      text(`BEST ${best.toLocaleString('en-US')}`, 24, 78, 14, PALETTE.muted);

      // Top-Centre Wave & Cores
      const canvasW = canvas.width / (window.devicePixelRatio || 1);
      text(`WAVE ${state.wave}/8`, canvasW / 2 - 80, 32, 16, PALETTE.text, 'center');
      text(`CORES ${state.coresCollected}/24`, canvasW / 2 + 80, 32, 16, PALETTE.text, 'center');
      ctx.save();
      ctx.fillStyle = PALETTE.core;
      ctx.beginPath();
      ctx.arc(canvasW / 2 + 35, 32, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Top-Right Hull & Dash
      const hrX = canvasW - 220;
      text('HULL', hrX, 28, 14, PALETTE.muted);
      const hullColor = state.ship.hull < 30 ? PALETTE.hullLow : PALETTE.hull;
      ctx.fillStyle = PALETTE.panel;
      ctx.fillRect(hrX, 40, 180, 14);
      ctx.fillStyle = hullColor;
      ctx.fillRect(hrX, 40, Math.max(0, 180 * (state.ship.hull / 100)), 14);
      ctx.strokeStyle = PALETTE.muted;
      ctx.strokeRect(hrX, 40, 180, 14);
      text(`HULL ${Math.max(0, Math.ceil(state.ship.hull))}`, hrX + 90, 47, 12, PALETTE.text, 'center');

      // Dash pip
      const dashReady = state.ship.dashCooldown <= 0;
      ctx.fillStyle = dashReady ? PALETTE.gold : PALETTE.muted;
      ctx.beginPath();
      ctx.arc(canvasW - 40, 75, 8, 0, Math.PI * 2);
      ctx.fill();
      text('DASH', canvasW - 75, 75, 12, PALETTE.muted);

      // Bottom-Centre Combo
      if (state.combo > 1) {
        text(`COMBO x${state.combo}`, canvasW / 2, canvasW > 1000 ? 680 : canvas.height / (window.devicePixelRatio || 1) - 40, 20, PALETTE.gold, 'center');
        const cw = 120;
        const cx = canvasW / 2 - cw / 2;
        const cy = canvasW > 1000 ? 700 : canvas.height / (window.devicePixelRatio || 1) - 20;
        ctx.fillStyle = PALETTE.panel;
        ctx.fillRect(cx, cy, cw, 6);
        ctx.fillStyle = PALETTE.gold;
        const comboRatio = state.comboTimer / 3.0;
        ctx.fillRect(cx, cy, cw * Math.max(0, Math.min(1, comboRatio)), 6);
      }
    }

    // Banners
    if (banner) {
      const canvasW = canvas.width / (window.devicePixelRatio || 1);
      const canvasH = canvas.height / (window.devicePixelRatio || 1);
      text(banner, canvasW / 2, canvasH / 2 - 60, 44, PALETTE.gold, 'center');
    }

    // Screens / Panels
    if (screen === SCREEN_TITLE) {
      drawPanel(
        'NOVA SALVAGE',
        [
          'Blast the rocks. Collect 24 star-cores.',
          'Clear all 8 waves and break the Derelict Hulk.',
          '',
          'WASD move - Mouse aim - Hold click fire',
          'Space dash - P pause - M mute'
        ],
        'CLICK OR PRESS ENTER TO PLAY',
        `BEST SCORE: ${best.toLocaleString('en-US')}`
      );
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['Press P to resume'], 'P TO RESUME');
    } else if (screen === SCREEN_OVER) {
      drawPanel(
        'GAME OVER',
        [
          `Score: ${state.score.toLocaleString('en-US')}`,
          `Wave Reached: ${state.wave}`,
          `Cores Collected: ${state.coresCollected}/24`
        ],
        'PRESS R OR CLICK TO RETRY',
        `Best Score: ${best.toLocaleString('en-US')}`
      );
    } else if (screen === SCREEN_WIN) {
      const finalScore = state.score + 2000 + Math.max(0, Math.floor(state.ship.hull)) * 10;
      drawPanel(
        'SALVAGE COMPLETE',
        [
          `Final Score: ${finalScore.toLocaleString('en-US')}`,
          `Victory Bonus: +${(2000 + Math.max(0, Math.floor(state.ship.hull)) * 10).toLocaleString('en-US')}`,
          `Hull Remaining: ${Math.max(0, Math.floor(state.ship.hull))}`,
          `Cores Collected: 24/24`
        ],
        'PRESS R OR CLICK TO PLAY AGAIN',
        `Best Score: ${best.toLocaleString('en-US')}`,
        state.coresCollected >= 24 ? 'FULL SALVAGE ACHIEVED (+5000 BONUS!)' : null
      );
    }
  }

  return { draw, view };
}
