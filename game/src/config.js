// game/src/config.js - Configuration, tuning numbers, and palette for NOVA SALVAGE

// Every tuning number and colour lives here and nowhere else.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const PALETTE = {
  backdrop: '#070b16',
  sky: '#0b1226',
  nebula1: '#1b2a52',
  nebula2: '#3d2a5e',
  ship: '#f2a541',
  shipDark: '#b97a1e',
  core: '#37c8d9',
  coreGlow: '#9be8f2',
  rock: '#8fa3b0',
  rockDark: '#5d6f7d',
  rust: '#b0724f',
  danger: '#e05a4e',
  gold: '#f0c040',
  text: '#e8e4d8',
  muted: '#8fa3b0',
  panel: '#121a2e',
  hull: '#59d867',
  hullLow: '#e05a4e'
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const SHIP = {
  radius: 16,
  accel: 620,
  drag: 1.6,
  maxSpeed: 340,
  fireGap: 0.16,
  bulletSpeed: 620,
  dashSpeed: 720,
  dashTime: 0.16,
  dashCooldown: 2.2,
  invuln: 1.5
};

export const BULLET = { radius: 4, life: 0.9, damage: 1 };

export const ROCK = {
  large: { radius: 46, hp: 3, score: 50, speed: 40 },
  medium: { radius: 28, hp: 2, score: 100, speed: 70 },
  small: { radius: 16, hp: 1, score: 200, speed: 110 }
};

export const CORE = { radius: 10, points: 100, target: 24, bonus: 5000 };

export const WAVE = {
  count: 8,
  base: 4,
  perWave: 2,
  bannerTime: 2.0,
  clearBonus: 500
};

export const COMBO = { window: 3, max: 8 };

export const PICKUP = {
  repair: 25,
  overchargeTime: 8,
  repairChance: 0.12,
  overChance: 0.06,
  coreChance: 0.45
};

export const HULK = { radius: 90, hp: 30, score: 2000, speed: 18 };

export const BEST_KEY = 'nova-salvage.best';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_WIN = 4;
export const EVENT_WAVE = 8;
export const EVENT_CORE = 16;
