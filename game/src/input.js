export const ACTION_CONFIRM = 1, ACTION_PAUSE = 2, ACTION_DASH = 4, ACTION_RESTART = 8, ACTION_MUTE = 16;

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 640, y: 360, down: false };
  let queuedActions = 0;

  // Movement keys: WASD plus arrows, so either hand can steer.
const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

  const queue = (flag) => { queuedActions |= flag; };

  window.addEventListener('keydown', (e) => {
    if (MOVE.has(e.code) || e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'KeyP' || e.code === 'Escape' || e.code === 'KeyR' || e.code === 'KeyM' || e.code === 'Enter') {
      e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'Space' || e.code === 'ShiftLeft') queue(ACTION_DASH);
    if (e.code === 'Enter' || e.code === 'KeyR') queue(ACTION_CONFIRM | ACTION_RESTART);
    if (e.code === 'KeyP' || e.code === 'Escape') queue(ACTION_PAUSE);
    if (e.code === 'KeyM') queue(ACTION_MUTE);
  });

  window.addEventListener('keyup', (e) => {
    if (MOVE.has(e.code) || e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'KeyP' || e.code === 'Escape' || e.code === 'KeyR' || e.code === 'KeyM' || e.code === 'Enter') {
      e.preventDefault();
    }
    keys.delete(e.code);
  });

  const updateMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  };

  canvas.addEventListener('pointermove', updateMousePos);
  canvas.addEventListener('pointerdown', (e) => {
    updateMousePos(e);
    mouse.down = true;
    queue(ACTION_CONFIRM);
  });
  canvas.addEventListener('pointerup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });

  window.addEventListener('blur', () => {
    keys.clear();
    mouse.down = false;
  });

  return {
    keys,
    mouse,
    move() {
      let x = 0, y = 0;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      return { x, y };
    },
    takeActions() {
      const acts = queuedActions;
      queuedActions = 0;
      return acts;
    }
  };
}
