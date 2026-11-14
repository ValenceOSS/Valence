import { createHash } from 'node:crypto';

const DIGITS = 32;

/**
 * A Jellyfin identifier for something Valence names without a UUID of its own, such as a programme
 * known by its title, worked out from what it is so the same thing is given the same identifier
 * every time and after every restart.
 *
 * @param kind - What sort of thing it is.
 * @param key - What Valence calls it.
 * @returns Thirty-two hexadecimal digits.
 */
const syntheticJellyfinId = (kind: string, key: string): string =>
  createHash('sha256').update(`${kind}:${key}`).digest('hex').slice(0, DIGITS);

export { syntheticJellyfinId };
