import type { Resolution } from '@ValenceContracts/schemas/ParsedRelease';

const BY_HEIGHT: readonly [number, Resolution][] = [
  [2160, '2160p'],
  [1080, '1080p'],
  [720, '720p'],
  [576, '576p'],
  [480, '480p'],
];

/**
 * The resolution a release name says it is: `1080p`, a frame size such as `1920x1080`, or a
 * shorthand — 4K and UHD, FHD, and SD — in that order of trust.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The resolution, or null where it does not say.
 */
const readResolution = (spaced: string): Resolution | null => {
  const stated = /\b(2160|1080|720|576|480)[pi]\b/i.exec(spaced)?.[1];
  const framed = /\b\d{3,4}x(2160|1080|720|576|480)\b/i.exec(spaced)?.[1];
  const height = Number(stated ?? framed ?? Number.NaN);
  const exact = BY_HEIGHT.find(([rows]) => rows === height)?.[1];

  if (exact !== undefined) {
    return exact;
  }

  if (/\b(4k|uhd)\b/i.test(spaced)) {
    return '2160p';
  }

  if (/\bfhd\b/i.test(spaced)) {
    return '1080p';
  }

  return /\bsd\b/i.test(spaced) ? '480p' : null;
};

export { readResolution };
