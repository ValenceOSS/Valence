import type { Advisory } from '@ValenceContracts/schemas/Advisory';

const WORDS: readonly (readonly [RegExp, Advisory])[] = [
  [/violen|gore|blood|cruel|weapon|horror violence/iu, 'violence'],
  [/language|profan|swear|coarse|obscen|crude/iu, 'language'],
  [/nud/iu, 'nudity'],
  [/sex|erotic/iu, 'sex'],
  [/drug|alcohol|smok|substance|tobacco|narcot/iu, 'drugs'],
  [
    /fright|fear|scar|terror|threat|horror|disturb|distress|suicid|self-harm|self harm/iu,
    'frightening',
  ],
  [/discriminat|racis|hate/iu, 'discrimination'],
];

/**
 * Reads one of a catalogue's content descriptors as the advisory it stands for. Catalogues word them
 * country by country — "Violence", "Strong language", "Drug use", "Sexual content" — so they are
 * matched by the word at their heart rather than taken as they come.
 *
 * @param descriptor - A descriptor as the catalogue wrote it.
 * @returns The advisory it stands for, or null where it stands for none Valence names.
 */
const advisoryOf = (descriptor: string): Advisory | null =>
  WORDS.find(([words]) => words.test(descriptor))?.[1] ?? null;

export { advisoryOf };
