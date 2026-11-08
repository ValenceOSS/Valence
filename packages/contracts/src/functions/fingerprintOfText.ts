const FNV_PRIME = 0x01000193;

const SEEDS = [0x811c9dc5, 0x050c5d1f] as const;

/**
 * A short fingerprint of some text, the same every time for the same text and on any platform,
 * made from two FNV-1a hashes with different seeds. It is for telling texts apart cheaply, never
 * for keeping anything secret.
 *
 * @param text - The text.
 * @returns Sixteen hexadecimal digits.
 */
const fingerprintOfText = (text: string): string =>
  SEEDS.map((seed) => {
    let hash = seed;

    for (let index = 0; index < text.length; index += 1) {
      hash = Math.imul(hash ^ text.charCodeAt(index), FNV_PRIME) >>> 0;
    }

    return hash.toString(16).padStart(8, '0');
  }).join('');

export { fingerprintOfText };
