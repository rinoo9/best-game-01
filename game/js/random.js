// Seeded randomness: the same seed always draws the same numbers, so the
// screenshot scenes stage exactly the same way every time.

/** A small fast seeded PRNG (mulberry32). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number in [min, max) from a random function. */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** An integer in [min, max] from a random function. */
export function rangeInt(random, min, max) {
  return Math.floor(range(random, min, max + 1));
}

/** Pick one entry of a list at random. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}
