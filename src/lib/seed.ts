/** FNV-1a hash; deterministic so every lecture keeps the same quiet cover & waveform. */
export function hashString(value: string): number {
  let hash = 2166136261 >>> 0
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** mulberry32 deterministic PRNG */
export function random(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(items: readonly T[], next: () => number): T {
  return items[Math.floor(next() * items.length) % items.length]!
}
