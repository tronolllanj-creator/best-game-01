// The same seed gives the same game. Seeded mulberry32 generator.
export function createRandom(seed) {
  // Coerce any seed to a 32-bit integer first.
  let a = (seed | 0) + 0x6d2b79f5;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return $((t ^ (t >>> 14)) >>> 0);
  };
}

function $(n) {
  return n / 4294967296;
}

export function range(random, min, max) {
  return min + random() * (max - min);
}

export function pick(random, array) {
  return array[Math.floor(random() * array.length)];
}
