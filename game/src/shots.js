import STEP from './config.js';
import { autopilotInput, EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, SCREEN_WIN } from './render.js';

// Scenes: start (title over attract play), play, boss (wave 8), end.
export function stageShot(name, world) {
  world.reset();

  if (name === 'boss') {
    world.startWave(8);
    const totalSteps = Math.round(14 / STEP);
    for (let i = 0; i < totalSteps; i++) {
      const input = autopilotInput(world.state, 'strong');
      world.update(input);
    }
    return {
      screen: SCREEN_PLAY,
      best: world.state.score,
      banner: 'WAVE 8 - DERELICT HULK'
    };
  }

  if (name === 'play') {
    const totalSteps = Math.round(28 / STEP);
    for (let i = 0; i < totalSteps; i++) {
      const input = autopilotInput(world.state, 'strong');
      const event = world.update(input);
      if (event === EVENT_OVER || event === EVENT_WIN) break;
    }
    return {
      screen: SCREEN_PLAY,
      best: world.state.score,
      banner: null
    };
  }

  if (name === 'end') {
    const maxSteps = Math.round(600 / STEP);
    let lastEvent = null;
    for (let i = 0; i < maxSteps; i++) {
      const input = autopilotInput(world.state, 'weak');
      const event = world.update(input);
      if (event) lastEvent = event;
      if (world.state.screen === SCREEN_OVER || world.state.screen === SCREEN_WIN) {
        break;
      }
    }
    const s = world.state;
    const screen = s.hull <= 0 ? SCREEN_OVER : (s.won ? SCREEN_WIN : s.screen);
    return {
      screen,
      best: s.score,
      banner: null
    };
  }

  // Default / 'start'
  const totalSteps = Math.round(6 / STEP);
  for (let i = 0; i < totalSteps; i++) {
    const input = autopilotInput(world.state, 'strong');
    world.update(input);
  }
  world.state.screen = SCREEN_TITLE;
  return {
    screen: SCREEN_TITLE,
    best: 0,
    banner: null
  };
}
