import { readNumber } from '@ValenceRequests/cardigann/readNumber';

const POWERS: readonly (readonly [RegExp, number])[] = [
  [/t/, 4],
  [/g/, 3],
  [/m/, 2],
  [/k/, 1],
];

/**
 * Reads a size as a site wrote it — "1.4 GB", "700MiB", "1,2 Go", "8000000000" — as bytes, counting
 * in 1024s, which is what every site means whatever it writes.
 *
 * @param text - What the site wrote.
 * @returns The size in bytes, or null where there is none.
 */
const readSize = (text: string): number | null => {
  const value = readNumber(text);

  if (value === null) {
    return null;
  }

  const unit = text.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const power = POWERS.find(([letter]) => letter.test(unit))?.[1] ?? 0;

  return Math.round(value * 1024 ** power);
};

export { readSize };
