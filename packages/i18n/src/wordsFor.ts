import type { SaidValues } from './SaidSchema';

/**
 * The values that fill a sentence's gaps as words, with anything said in turn — a problem inside a
 * sentence about it — put into its own words by whoever is saying the sentence.
 *
 * @param values - What fills the gaps.
 * @param sayInner - How to say one of those things said in turn.
 */
const wordsFor = (
  values: SaidValues,
  sayInner: (inner: Exclude<SaidValues[string], string | number>) => string,
): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(values).map(([name, value]) => [
      name,
      typeof value === 'object' ? sayInner(value) : value,
    ]),
  );

export { wordsFor };
