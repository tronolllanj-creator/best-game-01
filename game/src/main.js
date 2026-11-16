import { FIELD, STEP, BEST_KEY, PALETTE, CORE } from './config.js';
import createRandom from './random.js';
import createWorld, { autopilotInput, EVENT_HIT, EVENT_OVER, EVENT_WIN, EVENT_WAVE, EVENT_CORE } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_DASH, ACTION_RESTART, ACTION_MUTE, createInput } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WIN } from './render.js';
import createAudio from './audio.js';
import stageShot from './shots.js';

const FIXED_STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 5; // spiral-of-death guard

function readBest() {
    try {
        const val = localStorage.getItem(BEST_KEY);
        return val ? parseInt(val, 10) || 0 : 0;
    } catch (e) {
        return 0;
    }
}

function saveBest(val) {
    try {
        localStorage.setItem(BEST_KEY, String(val));
    } catch (e) {}
}

function boot() {
    const params = new URLSearchParams(window.location.search);
    const shotName = params.get('shot');
    const seedParam = parseInt(params.get('seed'), 10);
    const seed = isNaN(seedParam) ? 1 : seedParam;

    const canvas = document.getElementById('game');
    const statusEl = document.getElementById('status');

    window.__shotError = null;
    window.__shotReady = false;

    window.onerror = (msg, src, line, col, err) => {
        window.__shotError = { msg, src, line, col, err: err ? err.stack : null };
    };
    window.addEventListener('unhandledrejection', (e) => {
        window.__shotError = { msg: e.reason ? e.reason.message : 'rejection', err: e.reason };
    });

    const rng = createRandom(seed);
    const world = createWorld(rng);
    const renderer = createRenderer(canvas);
    const audio = createAudio();

    function announce(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    if (shotName) {
        runShot(shotName, world, renderer, audio);
    } else {
        runGame(world, renderer, audio, canvas, announce);
    }
}

function runShot(name, world, renderer, audio) {
    try {
        const shotData = stageShot(name, world);
        let banner = shotData ? shotData.banner : null;
        renderer.draw(world, SCREEN_PLAY, banner);
        requestAnimationFrame(() => {
            renderer.draw(world, SCREEN_PLAY, banner);
            window.__shotReady = true;
        });
    } catch (e) {
        window.__shotError = { msg: e.message, err: e.stack };
    }
}

function runGame(world, renderer, audio, canvas, announce) {
    const input = createInput(canvas);
    let screen = SCREEN_TITLE;
    let best = readBest();
    let lastBulletCount = world.bullets.length;
    let lastKills = world.kills;
    let lastDashTime = world.ship.dashTime;
    let bannerText = null;
    let bannerTimer = 0;

    function startGame() {
        world.rng = createRandom(12345);
        world.reset();
        screen = SCREEN_PLAY;
        audio.unlock();
        announce('Game started.');
    }

    function endGame(win) {
        screen = win ? SCREEN_WIN : SCREEN_OVER;
        if (world.score > best) {
            best = world.score;
            saveBest(best);
        }
        announce(win ? 'Victory!' : 'Game Over.');
    }

    function handleActions() {
        const actions = input.consumeActions();
        for (let i = 0; i < actions.length; i++) {
            const act = actions[i];
            if (act === ACTION_MUTE) {
                audio.toggleMute();
            } else if (act === ACTION_CONFIRM) {
                if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) {
                    startGame();
                }
            } else if (act === ACTION_PAUSE) {
                if (screen === SCREEN_PLAY) {
                    screen = SCREEN_PAUSED;
                    announce('Paused.');
                } else if (screen === SCREEN_PAUSED) {
                    screen = SCREEN_PLAY;
                    announce('Resumed.');
                }
            } else if (act === ACTION_RESTART) {
                if (screen === SCREEN_OVER || screen === SCREEN_WIN || screen === SCREEN_PAUSED) {
                    startGame();
                }
            }
        }

        if (screen === SCREEN_TITLE && (input.isMouseDown() || input.consumeClick())) {
            startGame();
        } else if ((screen === SCREEN_OVER || screen === SCREEN_WIN) && input.consumeClick()) {
            startGame();
        }
    }

    let accumulator = 0;
    let lastTime = performance.now();

    function frame(now) {
        requestAnimationFrame(frame);
        const dt = Math.min((now - lastTime) / 1000, 0.25);
        lastTime = now;

        handleActions();

        if (screen === SCREEN_TITLE) {
            accumulator += dt;
            while (accumulator >= FIXED_STEP) {
                accumulator -= FIXED_STEP;
                autopilotInput(world, 'strong');
                world.step(FIXED_STEP);
                if (world.bullets.length > lastBulletCount) audio.shoot();
                if (world.kills > lastKills) audio.explode('medium');
                if (world.ship.dashTime > 0 && lastDashTime <= 0) audio.dash();
                lastBulletCount = world.bullets.length;
                lastKills = world.kills;
                lastDashTime = world.ship.dashTime;
            }
        } else if (screen === SCREEN_PLAY) {
            accumulator += dt;
            let steps = 0;
            while (accumulator >= FIXED_STEP && steps < 5) {
                accumulator -= FIXED_STEP;
                steps++;

                const mousePos = input.mouse;
                const view = renderer.getView();
                const fx = (mousePos.x - canvas.width / 2) / view.scale + view.x;
                const fy = (mousePos.y - canvas.height / 2) / view.scale + view.y;

                const controls = {
                    mx: input.getAxes().x,
                    my: input.getAxes().y,
                    aimX: fx,
                    aimY: fy,
                    fire: input.isMouseDown(),
                    dash: input.consumeDash()
                };

                world.playerInput = controls;
                world.step(FIXED_STEP);

                if (world.bullets.length > lastBulletCount) audio.shoot();
                if (world.kills > lastKills) audio.explode('medium');
                if (world.ship.dashTime > 0 && lastDashTime <= 0) audio.dash();
                lastBulletCount = world.bullets.length;
                lastKills = world.kills;
                lastDashTime = world.ship.dashTime;

                const events = world.consumeEvents();
                for (let e = 0; e < events.length; e++) {
                    const ev = events[e];
                    if (ev === EVENT_HIT) audio.hurt();
                    if (ev === EVENT_WAVE) audio.wave();
                    if (ev === EVENT_CORE) audio.core();
                    if (ev === EVENT_OVER) endGame(false);
                    if (ev === EVENT_WIN) endGame(true);
                }

                if (world.waveState === 'banner') {
                    bannerText = `WAVE ${world.wave}`; 
                } else if (world.fullSalvageJustMet) {
                    bannerText = 'FULL SALVAGE +5000';
                } else {
                    bannerText = null;
                }
            }
        }

        renderer.draw(world, screen, bannerText);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && screen === SCREEN_PLAY) {
            screen = SCREEN_PAUSED;
            announce('Paused (hidden).');
        }
    });

    requestAnimationFrame((t) => {
        lastTime = t;
        requestAnimationFrame(frame);
    });
}

window.addEventListener('DOMContentLoaded', boot);