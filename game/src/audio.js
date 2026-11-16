export function createAudio() {
  // All sounds are procedural: oscillators and filtered noise, no files.
const MASTER_GAIN = 0.4;
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;

  function ensureContext() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : MASTER_GAIN;
      master.connect(ctx.destination);

      // Build 1s white noise buffer
      const rate = ctx.sampleRate;
      noiseBuffer = ctx.createBuffer(1, rate, rate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < rate; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function playTone(freqStart, freqEnd, type, duration, gainVal = 0.1) {
    if (!ensureContext() || muted) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  function playNoise(duration, filterFreq, gainVal = 0.2) {
    if (!ensureContext() || muted || !noiseBuffer) return;
    try {
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(filterFreq, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(master);
      src.start(now);
      src.stop(now + duration);
    } catch (e) {}
  }

  return {
    unlock() {
      if (ensureContext() && ctx.state === 'suspended') {
        ctx.resume();
      }
    },
    toggleMute() {
      muted = !muted;
      if (master && ctx) {
        master.gain.setValueAtTime(muted ? 0 : MASTER_GAIN, ctx.currentTime);
      }
      return muted;
    },
    shoot() {
      playTone(880, 440, 'square', 0.07, 0.08);
    },
    explode(size) {
      const mult = size === 'large' ? 1.5 : size === 'medium' ? 1.0 : 0.6;
      playNoise(0.4 * mult, size === 'large' ? 300 : 600, 0.25);
      playTone(150 / mult, 40, 'sawtooth', 0.3 * mult, 0.15);
    },
    pickup() {
      playTone(660, 660, 'sine', 0.08, 0.1);
      setTimeout(() => playTone(990, 990, 'sine', 0.12, 0.1), 80);
    },
    core() {
      playTone(880, 880, 'sine', 0.06, 0.06);
      setTimeout(() => playTone(1174, 1174, 'sine', 0.06, 0.06), 60);
      setTimeout(() => playTone(1568, 1568, 'sine', 0.12, 0.06), 120);
    },
    hurt() {
      playTone(110, 55, 'triangle', 0.2, 0.25);
      playNoise(0.2, 400, 0.2);
    },
    dash() {
      if (!ensureContext() || muted || !noiseBuffer) return;
      try {
        const now = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        const filt = ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.setValueAtTime(200, now);
        filt.frequency.exponentialRampToValueAtTime(1200, now + 0.16);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        src.connect(filt);
        filt.connect(gain);
        gain.connect(master);
        src.start(now);
        src.stop(now + 0.16);
      } catch (e) {}
    },
    wave() {
      playTone(220, 220, 'sawtooth', 0.2, 0.12);
      setTimeout(() => playTone(330, 330, 'sawtooth', 0.3, 0.12), 200);
    },
    win() {
      playTone(523, 523, 'triangle', 0.15, 0.15);
      setTimeout(() => playTone(659, 659, 'triangle', 0.15, 0.15), 150);
      setTimeout(() => playTone(784, 784, 'triangle', 0.15, 0.15), 300);
      setTimeout(() => playTone(1046, 1046, 'triangle', 0.4, 0.15), 450);
    },
    lose() {
      playTone(392, 392, 'sawtooth', 0.2, 0.15);
      setTimeout(() => playTone(311, 311, 'sawtooth', 0.2, 0.15), 200);
      setTimeout(() => playTone(233, 233, 'sawtooth', 0.4, 0.15), 400);
    }
  };
}
