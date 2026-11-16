import {
  FIELD,
  STEP,
  SHIP,
  BULLET,
  ROCK,
  CORE,
  WAVE,
  COMBO,
  PICKUP,
  HULK,
  PALETTE
} from './config.js';
import { range, pick } from './random.js';

// The step returns these so main.js can play sounds and end the game.
export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_WIN = 4;
export const EVENT_WAVE = 8;
export const EVENT_CORE = 16;

export function createWorld(random) {
  const state = {
    ship: {
      x: FIELD.width / 2,
      y: FIELD.height / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      hull: 100,
      maxHull: 100,
      fireCooldown: 0,
      dashCooldown: 0,
      dashTime: 0,
      invuln: 0,
      overcharge: 0,
      alive: true,
      thrusting: false
    },
    rocks: [],
    bullets: [],
    cores: [],
    pickups: [],
    particles: [],
    popups: [],
    stars: [],
    nebulae: [],
    wave: 0,
    waveState: 'banner',
    waveTimer: WAVE.bannerTime,
    score: 0,
    combo: 1,
    comboTimer: 0,
    coresCollected: 0,
    fullSalvage: false,
    winBonus: 0,
    kills: 0,
    time: 0,
    ambientCoreTimer: 4.0
  };

  function makeRockVerts() {
    const verts = [];
    for (let i = 0; i < 8; i++) {
      verts.push(range(random, 0.75, 1.25));
    }
    return verts;
  }

  function spawnRock(size, x, y) {
    const cfg = size === 'hulk' ? HULK : ROCK[size];
    const angle = range(random, 0, Math.PI * 2);
    const speed = range(random, cfg.speed * 0.7, cfg.speed * 1.3);
    state.rocks.push({
      size,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: range(random, 0, Math.PI * 2),
      spin: range(random, -1.5, 1.5),
      hp: cfg.hp,
      maxHp: cfg.hp,
      radius: cfg.radius,
      verts: makeRockVerts()
    });
  }

  function spawnCore(x, y) {
    const angle = range(random, 0, Math.PI * 2);
    const speed = range(random, 20, 50);
    state.cores.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      pulse: range(random, 0, Math.PI * 2)
    });
  }

  function spawnPopup(text, x, y, color = PALETTE.gold) {
    state.popups.push({
      x,
      y,
      text,
      life: 0.8,
      color
    });
  }

  function burstParticles(x, y, count, color, speedScale = 1) {
    for (let i = 0; i < count; i++) {
      const angle = range(random, 0, Math.PI * 2);
      const spd = range(random, 30, 200) * speedScale;
      const life = range(random, 0.3, 0.8);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size: range(random, 1.5, 3.5),
        color
      });
    }
  }

  function startWave(n) {
    state.wave = n;
    state.waveState = 'fight';
    if (n === 8) {
      spawnRock('hulk', FIELD.width / 2, -120);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        spawnRock('medium', FIELD.width / 2 + Math.cos(a) * 300, FIELD.height / 2 + Math.sin(a) * 300);
      }
      return 'WAVE 8: DERELICT HULK';
    }
    const count = WAVE.base + WAVE.perWave * n;
    for (let i = 0; i < count; i++) {
      let rx, ry;
      if (range(random, 0, 1) < 0.5) {
        rx = range(random, 0, 1) < 0.5 ? -40 : FIELD.width + 40;
        ry = range(random, 0, FIELD.height);
      } else {
        rx = range(random, 0, FIELD.width);
        ry = range(random, 0, 1) < 0.5 ? -40 : FIELD.height + 40;
      }
      const r = range(random, 0, 1);
      const size = r < 0.5 + n * 0.03 ? 'small' : r < 0.85 + n * 0.02 ? 'medium' : 'large';
      spawnRock(size, rx, ry);
    }
    return `WAVE ${n}`;
  }

  function reset() {
    state.ship.x = FIELD.width / 2;
    state.ship.y = FIELD.height / 2;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.ship.angle = 0;
    state.ship.hull = 100;
    state.ship.maxHull = 100;
    state.ship.fireCooldown = 0;
    state.ship.dashCooldown = 0;
    state.ship.dashTime = 0;
    state.ship.invuln = 0;
    state.ship.overcharge = 0;
    state.ship.alive = true;
    state.ship.thrusting = false;

    state.rocks.length = 0;
    state.bullets.length = 0;
    state.cores.length = 0;
    state.pickups.length = 0;
    state.particles.length = 0;
    state.popups.length = 0;
    state.stars.length = 0;
    state.nebulae.length = 0;

    for (let i = 0; i < 130; i++) {
      state.stars.push({
        x: range(random, 0, FIELD.width),
        y: range(random, 0, FIELD.height),
        size: range(random, 0.8, 2.2),
        twinkle: range(random, 0, Math.PI * 2)
      });
    }
    for (let i = 0; i < 5; i++) {
      state.nebulae.push({
        x: range(random, 0, FIELD.width),
        y: range(random, 0, FIELD.height),
        radius: range(random, 250, 500),
        color: range(random, 0, 1) < 0.5 ? PALETTE.nebula1 : PALETTE.nebula2
      });
    }

    state.score = 0;
    state.combo = 1;
    state.comboTimer = 0;
    state.coresCollected = 0;
    state.fullSalvage = false;
    state.winBonus = 0;
    state.kills = 0;
    state.time = 0;
    state.ambientCoreTimer = 4.0;
    state.wave = 0;
    state.waveState = 'banner';
    state.waveTimer = WAVE.bannerTime;
  }

  function destroyRock(index, events) {
    const r = state.rocks[index];
    state.rocks.splice(index, 1);
    state.kills++;

    const cfg = r.size === 'hulk' ? HULK : ROCK[r.size];
    const pts = cfg.score * state.combo;
    state.score += pts;
    spawnPopup(`+${pts}`, r.x, r.y);

    state.combo = Math.min(state.combo + 1, COMBO.max);
    state.comboTimer = COMBO.window;

    burstParticles(r.x, r.y, r.size === 'hulk' ? 40 : r.size === 'large' ? 25 : 15, PALETTE.rock, r.size === 'hulk' ? 2 : 1);

    if (r.size === 'hulk') {
      for (let i = 0; i < 4; i++) {
        spawnRock('medium', r.x + range(random, -20, 20), r.y + range(random, -20, 20));
      }
    } else if (r.size === 'large' || r.size === 'medium') {
      const nextSize = r.size === 'large' ? 'medium' : 'small';
      for (let i = 0; i < 2; i++) {
        spawnRock(nextSize, r.x, r.y);
      }
    }

    const dropRoll = range(random, 0, 1);
    if (dropRoll < PICKUP.coreChance) {
      spawnCore(r.x, r.y);
    } else if (dropRoll < PICKUP.coreChance + PICKUP.repairChance) {
      state.pickups.push({ kind: 'repair', x: r.x, y: r.y, vx: range(random, -15, 15), vy: range(random, -15, 15), pulse: 0 });
    } else if (dropRoll < PICKUP.coreChance + PICKUP.repairChance + PICKUP.overChance) {
      state.pickups.push({ kind: 'overcharge', x: r.x, y: r.y, vx: range(random, -15, 15), vy: range(random, -15, 15), pulse: 0 });
    }
  }

  function step(dt, input, attract = false) {
    let events = 0;
    state.time += dt;

    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 1;
      }
    }

    if (state.ship.fireCooldown > 0) state.ship.fireCooldown -= dt;
    if (state.ship.dashCooldown > 0) state.ship.dashCooldown -= dt;
    if (state.ship.dashTime > 0) state.ship.dashTime -= dt;
    if (state.ship.invuln > 0) state.ship.invuln -= dt;
    if (state.ship.overcharge > 0) state.ship.overcharge -= dt;

    if (state.waveState === 'banner') {
      state.waveTimer -= dt;
      if (state.waveTimer <= 0) {
        startWave(state.wave + 1);
        events |= EVENT_WAVE;
      }
    } else if (state.waveState === 'clear') {
      state.waveTimer -= dt;
      if (state.waveTimer <= 0) {
        if (state.wave >= 8) {
          state.winBonus = 2000 + state.ship.hull * 10;
          state.score += state.winBonus;
          events |= EVENT_WIN;
        } else {
          state.waveState = 'banner';
          state.waveTimer = WAVE.bannerTime;
        }
      }
    } else if (state.waveState === 'fight') {
      state.ambientCoreTimer -= dt;
      if (state.ambientCoreTimer <= 0 && state.cores.length < 3) {
        state.ambientCoreTimer = 4.0;
        spawnCore(range(random, 100, FIELD.width - 100), range(random, 100, FIELD.height - 100));
      }

      if (state.rocks.length === 0 && state.wave > 0) {
        state.waveState = 'clear';
        const bonus = WAVE.clearBonus * state.wave;
        state.score += bonus;
        state.waveTimer = 2.0;
      }
    }

    const ship = state.ship;
    if (ship.alive) {
      ship.angle = input.aim;
      const isDashing = ship.dashTime > 0;

      if (isDashing) {
        const dashSpd = 720;
        ship.vx = Math.cos(ship.angle) * dashSpd;
        ship.vy = Math.sin(ship.angle) * dashSpd;
        ship.invuln = 0.1;
      } else {
        if (input.dash && ship.dashCooldown <= 0) {
          ship.dashTime = 0.16;
          ship.dashCooldown = 2.2;
          burstParticles(ship.x, ship.y, 18, PALETTE.core, 1.5);
        } else if (input.thrust) {
          ship.vx += Math.cos(ship.angle) * SHIP.accel * dt;
          ship.vy += Math.sin(ship.angle) * SHIP.accel * dt;
          ship.thrusting = true;
          if (Math.random() < 0.3) {
            burstParticles(ship.x - Math.cos(ship.angle) * 12, ship.y - Math.sin(ship.angle) * 12, 1, PALETTE.shipDark, 0.4);
          }
        } else {
          ship.thrusting = false;
        }

        const drag = Math.pow(SHIP.drag, dt);
        ship.vx *= drag;
        ship.vy *= drag;

        const spd = Math.hypot(ship.vx, ship.vy);
        if (spd > SHIP.maxSpeed) {
          ship.vx = (ship.vx / spd) * SHIP.maxSpeed;
          ship.vy = (ship.vy / spd) * SHIP.maxSpeed;
        }
      }

      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;

      if (ship.x < 15) { ship.x = 15; ship.vx *= -0.5; }
      if (ship.x > FIELD.width - 15) { ship.x = FIELD.width - 15; ship.vx *= -0.5; }
      if (ship.y < 15) { ship.y = 15; ship.vy *= -0.5; }
      if (ship.y > FIELD.height - 15) { ship.y = FIELD.height - 15; ship.vy *= -0.5; }

      if (input.fire && ship.fireCooldown <= 0) {
        ship.fireCooldown = ship.overcharge > 0 ? BULLET.fireGap * 0.5 : BULLET.fireGap;
        const nx = ship.x + Math.cos(ship.angle) * 16;
        const ny = ship.y + Math.sin(ship.angle) * 16;
        state.bullets.push({
          x: nx,
          y: ny,
          vx: ship.vx + Math.cos(ship.angle) * BULLET.speed,
          vy: ship.vy + Math.sin(ship.angle) * BULLET.speed,
          life: BULLET.life
        });
      }
    }

    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) {
        state.bullets.splice(i, 1);
      }
    }

    for (let i = state.rocks.length - 1; i >= 0; i--) {
      const r = state.rocks[i];
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.angle += r.spin * dt;

      if (r.x < -r.radius) r.x += FIELD.width + r.radius * 2;
      if (r.x > FIELD.width + r.radius) r.x -= FIELD.width + r.radius * 2;
      if (r.y < -r.radius) r.y += FIELD.height + r.radius * 2;
      if (r.y > FIELD.height + r.radius) r.y -= FIELD.height + r.radius * 2;
    }

    for (let i = state.cores.length - 1; i >= 0; i--) {
      const c = state.cores[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.pulse += dt * 4;
      c.vx *= Math.pow(0.5, dt);
      c.vy *= Math.pow(0.5, dt);

      if (ship.alive) {
        const dx = ship.x - c.x;
        const dy = ship.y - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          c.vx += (dx / dist) * 300 * dt;
          c.vy += (dy / dist) * 300 * dt;
        }
        if (dist < 18) {
          state.cores.splice(i, 1);
          state.coresCollected++;
          const pts = CORE.points * state.combo;
          state.score += pts;
          state.combo = Math.min(state.combo + 1, COMBO.max);
          state.comboTimer = COMBO.window;
          spawnPopup(`+${pts}`, c.x, c.y, PALETTE.core);
          burstParticles(c.x, c.y, 8, PALETTE.core);
          events |= EVENT_CORE;

          if (state.coresCollected >= CORE.target && !state.fullSalvage) {
            state.fullSalvage = true;
            state.score += CORE.bonus;
            spawnPopup('FULL SALVAGE +5000', FIELD.width / 2, FIELD.height / 3, PALETTE.gold);
          }
          continue;
        }
      }
    }

    for (let i = state.pickups.length - 1; i >= 0; i--) {
      const p = state.pickups[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.5, dt);
      p.vy *= Math.pow(0.5, dt);

      if (ship.alive) {
        const dist = Math.hypot(ship.x - p.x, ship.y - p.y);
        if (dist < 20) {
          state.pickups.splice(i, 1);
          if (p.kind === 'repair') {
            ship.hull = Math.min(ship.maxHull, ship.hull + PICKUP.repair);
            spawnPopup('+25 HULL', ship.x, ship.y, PALETTE.hull);
            burstParticles(ship.x, ship.y, 10, PALETTE.hull);
          } else if (p.kind === 'overcharge') {
            ship.overcharge = PICKUP.overchargeTime;
            spawnPopup('OVERCHARGE!', ship.x, ship.y, PALETTE.core);
            burstParticles(ship.x, ship.y, 10, PALETTE.core);
          }
        }
      }
    }

    for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
      const b = state.bullets[bi];
      let hit = false;
      for (let ri = state.rocks.length - 1; ri >= 0; ri--) {
        const r = state.rocks[ri];
        const dist = Math.hypot(b.x - r.x, b.y - r.y);
        if (dist < r.radius + 4) {
          hit = true;
          r.hp -= 1;
          burstParticles(b.x, b.y, 4, PALETTE.rockDark);
          if (r.hp <= 0) {
            destroyRock(ri, events);
          }
          break;
        }
      }
      if (hit) {
        state.bullets.splice(bi, 1);
      }
    }

    if (ship.alive && ship.invuln <= 0 && ship.dashTime <= 0) {
      for (let ri = 0; ri < state.rocks.length; ri++) {
        const r = state.rocks[ri];
        const dist = Math.hypot(ship.x - r.x, ship.y - r.y);
        if (dist < r.radius + 12) {
          const damage = r.size === 'hulk' ? 30 : r.size === 'large' ? 25 : r.size === 'medium' ? 18 : 12;
          if (attract) {
            ship.hull = 100;
          } else {
            ship.hull -= damage;
            ship.invuln = SHIP.invuln;
            state.combo = 1;
            events |= EVENT_HIT;
            burstParticles(ship.x, ship.y, 20, PALETTE.danger);

            const pushAngle = Math.atan2(ship.y - r.y, ship.x - r.x);
            ship.vx = Math.cos(pushAngle) * 300;
            ship.vy = Math.sin(pushAngle) * 300;

            if (ship.hull <= 0) {
              ship.hull = 0;
              ship.alive = false;
              events |= EVENT_OVER;
              burstParticles(ship.x, ship.y, 50, PALETTE.danger, 2);
            }
          }
          break;
        }
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    for (let i = state.popups.length - 1; i >= 0; i--) {
      const p = state.popups[i];
      p.y -= 20 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        state.popups.splice(i, 1);
      }
    }

    return events;
  }

  reset();
  return { state, reset, startWave, step };
}

export function autopilotInput(state, skill) {
  const ship = state.ship;
  let target = null;
  let minDist = Infinity;

  if (state.cores.length > 0) {
    for (const c of state.cores) {
      const d = Math.hypot(ship.x - c.x, ship.y - c.y);
      if (d < minDist) {
        minDist = d;
        target = { x: c.x, y: c.y, type: 'core' };
      }
    }
  }

  if (!target && state.rocks.length > 0) {
    for (const r of state.rocks) {
      const d = Math.hypot(ship.x - r.x, ship.y - r.y);
      if (d < minDist) {
        minDist = d;
        target = { x: r.x, y: r.y, type: 'rock' };
      }
    }
  }

  let aim = ship.angle;
  let fire = false;
  let thrust = false;
  let dash = false;

  let nearestRock = null;
  let nearRockDist = Infinity;
  for (const r of state.rocks) {
    const d = Math.hypot(ship.x - r.x, ship.y - r.y);
    if (d < nearRockDist) {
      nearRockDist = d;
      nearestRock = r;
    }
  }

  const lookAhead = skill === 'strong' ? 0.7 : 0.25;
  if (nearestRock && nearRockDist < 90 + (skill === 'strong' ? 0 : 30)) {
    const rvx = nearestRock.x + nearestRock.vx * lookAhead;
    const rvy = nearestRock.y + nearestRock.vy * lookAhead;
    const escapeAngle = Math.atan2(ship.y - rvy, ship.x - rvx);
    aim = escapeAngle;
    thrust = true;
    if (skill === 'strong' && nearRockDist < 70 && ship.dashCooldown <= 0) {
      dash = true;
    }
  } else if (target) {
    const angleToTarget = Math.atan2(target.y - ship.y, target.x - ship.x);
    aim = angleToTarget;
    const dist = Math.hypot(target.x - ship.x, target.y - ship.y);
    if (dist > 80) {
      thrust = true;
    }
  }

  if (nearestRock) {
    const angleToRock = Math.atan2(nearestRock.y - ship.y, nearestRock.x - ship.x);
    const angleDiff = Math.abs(Math.atan2(Math.sin(angleToRock - ship.angle), Math.cos(angleToRock - ship.angle)));
    if (angleDiff < 0.3) {
      fire = true;
      if (skill === 'weak' && Math.random() < 0.05) {
        aim += 0.5;
      }
    }
  }

  return {
    mx: ship.x + Math.cos(aim) * 100,
    my: ship.y + Math.sin(aim) * 100,
    aim,
    fire,
    thrust,
    dash
  };
}
