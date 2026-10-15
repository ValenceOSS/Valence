import type { SpokenAudio } from '@ValenceContracts/schemas/ParsedRelease';

const DUAL = /\b(?:dual|multi)[ -]?audio\b|\bdual\b|\bjpn? ?\+ ?eng\b|\beng ?\+ ?jpn?\b/i;

const DUBBED = /\b(?:eng(?:lish)?[ -]?)?dub(?:bed)?\b/i;

const SUBBED = /\b(?:eng(?:lish)?[ -]?)?sub(?:bed|s)?\b|\bvostfr\b|\bmulti[ -]?subs?\b/i;

/**
 * What an anime release says its speech is: Japanese with English beside it, an English dub, or
 * the original with subtitles; nothing where the name does not say, which for a fansub release
 * usually means the original with subtitles but is left for the judge to decide.
 *
 * @param spaced - The name, with its words spaced.
 * @returns What it says, or null.
 */
const readSpokenAudio = (spaced: string): SpokenAudio | null => {
  if (DUAL.test(spaced)) {
    return 'dual';
  }

  if (DUBBED.test(spaced)) {
    return 'dubbed';
  }

  return SUBBED.test(spaced) ? 'subbed' : null;
};

export { readSpokenAudio };
