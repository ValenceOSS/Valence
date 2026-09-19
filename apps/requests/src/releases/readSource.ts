import type { ReleaseSource } from '@ValenceContracts/schemas/ParsedRelease';

const SOURCES: readonly [RegExp, ReleaseSource][] = [
  [/\b(bd|uhd)?remux\b/i, 'remux'],
  [/\bblu-?ray\b|\bblu ray\b|\bbd(rip|25|50|mv)?\b|\bbrrip\b|\buhd ?rip\b|\bjpbd\b/i, 'bluray'],
  [/\bweb-?rip\b|\bhdrip\b/i, 'webrip'],
  [/\bweb(-?dl)?\b/i, 'webdl'],
  [/\b(hd|pd)tv\b|\btvrip\b|\bdsr(ip)?\b/i, 'hdtv'],
  [/\bdvd(rip|r|5|9|scr)?\b/i, 'dvd'],
  [/\b(hd)?ts\b|\btelesync\b|\b(hd)?tc\b|\btelecine\b/i, 'telesync'],
  [/\b(hd)?cam(rip)?\b/i, 'cam'],
];

const STREAMERS = /\b(amzn|nf|dsnp|atvp|hmax|max|hulu|pcok|pmtp|cr|adn|b-global|stan|itunes|ma)\b/i;

/**
 * Where a release came from — a remux, Blu-ray, a web download or rip, television, DVD, or a
 * recording made in a cinema — by the first sign of each, best first. A name that names only a
 * streaming service, such as AMZN or NF, is a web download.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The source, or null where it does not say.
 */
const readSource = (spaced: string): ReleaseSource | null =>
  SOURCES.find(([pattern]) => pattern.test(spaced))?.[1] ??
  (STREAMERS.test(spaced) ? 'webdl' : null);

export { readSource };
