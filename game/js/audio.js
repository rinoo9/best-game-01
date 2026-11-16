// Synthesized sounds: everything is an oscillator or a noise burst through the
// Web Audio API, so the game ships no audio files and makes no network request.
// The context is created on the first user gesture, as browsers require.

export function createAudio() {
  let context = null;
  let master = null;

  function ensure() {
    if (context !== null) return context;
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.25;
    master.connect(context.destination);
    return context;
  }

  function tone(freq, seconds, type = 'sine', when = 0, slideTo = null) {
    const ctx = ensure();
    if (ctx === null) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.5, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  function noise(seconds, filterFreq = 800) {
    const ctx = ensure();
    if (ctx === null) return;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = 0.6;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
  }

  return {
    /** Warm the context up on the first gesture so later sounds play at once. */
    unlock() {
      ensure();
    },
    click() {
      tone(660, 0.06, 'square');
    },
    splash() {
      noise(0.35, 900);
      tone(300, 0.18, 'sine', 0, 90);
    },
    bite() {
      tone(880, 0.09, 'sine');
      tone(1318, 0.12, 'sine', 0.08);
    },
    reelTick() {
      tone(1200, 0.03, 'square');
    },
    snap() {
      noise(0.2, 2400);
      tone(180, 0.25, 'sawtooth', 0, 60);
    },
    escape() {
      tone(392, 0.15, 'sine', 0, 196);
    },
    coin() {
      tone(988, 0.07, 'sine');
      tone(1319, 0.12, 'sine', 0.07);
    },
    travel() {
      tone(523, 0.1, 'sine');
      tone(659, 0.1, 'sine', 0.09);
      tone(784, 0.16, 'sine', 0.18);
    },
    goldenHour() {
      tone(523, 0.12, 'sine');
      tone(659, 0.12, 'sine', 0.1);
      tone(784, 0.12, 'sine', 0.2);
      tone(1047, 0.2, 'sine', 0.3);
    },
    /** A catch fanfare that grows with the tier: more notes, higher, brighter. */
    fanfare(tier) {
      const scales = {
        common: [523, 659],
        uncommon: [523, 659, 784],
        rare: [523, 659, 784, 1047],
        epic: [523, 659, 784, 1047, 1319],
        legendary: [523, 659, 784, 1047, 1319, 1568],
        mythic: [523, 659, 784, 1047, 1319, 1568, 2093],
        divine: [523, 659, 784, 1047, 1319, 1568, 2093, 2637],
      };
      const notes = scales[tier] ?? scales.common;
      notes.forEach((freq, i) => tone(freq, 0.22, 'triangle', i * 0.09));
      tone(notes[notes.length - 1], 0.5, 'sine', notes.length * 0.09);
    },
  };
}
