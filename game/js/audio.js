// Sounds, synthesized with WebAudio: no audio files, no network. Every sound
// is a few oscillators through a gain envelope, so it costs almost nothing.

/** Create the sound board. The context starts on the first user gesture. */
export function createAudio() {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return false;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
      return true;
    } catch (error) {
      return false;
    }
  }

  /** One tone: frequency, seconds, shape and volume, with a quick fade. */
  function tone(freq, duration, type = 'sine', volume = 1, when = 0, slideTo = null) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** A short noise burst (splash, snap) through a band-pass filter. */
  function noise(duration, freq, volume = 1, when = 0) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(t0);
  }

  return {
    /** Call from any user gesture so later sounds are allowed to play. */
    unlock() {
      ensure();
    },

    click() {
      tone(660, 0.07, 'triangle', 0.5);
    },

    splash() {
      noise(0.35, 900, 0.9);
      tone(300, 0.25, 'sine', 0.4, 0, 120);
    },

    bite() {
      tone(880, 0.12, 'square', 0.35);
      tone(1320, 0.12, 'square', 0.3, 0.09);
    },

    reelTick() {
      tone(1200 + Math.random() * 300, 0.03, 'square', 0.12);
    },

    snap() {
      noise(0.15, 2400, 0.8);
      tone(200, 0.2, 'sawtooth', 0.4, 0, 60);
    },

    escape() {
      tone(420, 0.3, 'sine', 0.4, 0, 180);
    },

    /** A fanfare that grows with the tier: more notes, higher, brighter. */
    catchFanfare(tier) {
      const notes = {
        common: [523],
        uncommon: [523, 659],
        rare: [523, 659, 784],
        epic: [523, 659, 784, 1047],
        legendary: [523, 659, 784, 1047, 1319],
        mythic: [523, 659, 784, 1047, 1319, 1568],
        divine: [523, 659, 784, 1047, 1319, 1568, 2093],
      }[tier] ?? [523];
      notes.forEach((freq, i) => tone(freq, 0.35, 'triangle', 0.6, i * 0.09));
      tone(1568, 0.5, 'sine', 0.25, notes.length * 0.09);
    },

    levelUp() {
      [523, 659, 784, 1047].forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.55, i * 0.07));
    },

    buy() {
      tone(880, 0.1, 'triangle', 0.5);
      tone(1175, 0.18, 'triangle', 0.5, 0.08);
    },

    win() {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((freq, i) => tone(freq, 0.4, 'triangle', 0.55, i * 0.12));
    },
  };
}
