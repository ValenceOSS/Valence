const LANGUAGE_WORDS: Readonly<Record<string, readonly string[]>> = {
  en: ['english', 'eng'],
  fr: ['french', 'truefrench', 'vff', 'vfq', 'vfi', 'vf', 'vostfr'],
  de: ['german', 'deutsch', 'ger'],
  es: ['spanish', 'castellano', 'espanol', 'latino', 'spa'],
  it: ['italian', 'ita'],
  ja: ['japanese', 'jap', 'jpn'],
  ko: ['korean', 'kor'],
  nl: ['dutch', 'nederlands', 'nld'],
  pt: ['portuguese', 'dublado', 'por'],
  ru: ['russian', 'rus'],
  zh: ['chinese', 'mandarin', 'cantonese', 'chs', 'cht'],
  pl: ['polish', 'pol', 'lektor'],
  sv: ['swedish', 'swe'],
  da: ['danish', 'dan'],
  no: ['norwegian', 'nor'],
  fi: ['finnish', 'fin'],
  ar: ['arabic', 'ara'],
  hi: ['hindi', 'hin'],
  tr: ['turkish', 'tur'],
  cs: ['czech', 'cze', 'ces'],
  el: ['greek', 'gre', 'ell'],
  he: ['hebrew', 'heb'],
  hu: ['hungarian', 'hun'],
  th: ['thai', 'tha'],
  uk: ['ukrainian', 'ukr'],
  vi: ['vietnamese', 'vie'],
};

/**
 * The languages a release name says it carries, as two-letter codes.
 *
 * Only what the name actually says. Most English releases never say so, so a name that names no
 * language means nobody said rather than English — reading it as English is how a library ends up
 * ranking an English-dubbed cut above the Japanese original of a film that has no dub.
 *
 * A name saying MULTI or DUAL carries more than one language without saying which, so it is read
 * as naming none. Ranking it against a preferred language would be guessing, and a MULTI release
 * usually carries the original anyway.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The codes, in the order this reader knows them, without repeats.
 */
const readLanguages = (spaced: string): string[] =>
  Object.entries(LANGUAGE_WORDS)
    .filter(([, words]) => words.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(spaced)))
    .map(([code]) => code);

export { LANGUAGE_WORDS, readLanguages };
