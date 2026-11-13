import { GAP } from './GAP';

/**
 * Fills each `{name}` in some words from what is given, leaving a gap with nothing given for it as
 * written, so a missing value shows on screen rather than quietly vanishing from the sentence.
 *
 * @param text - The words.
 * @param values - What fills the gaps.
 * @returns The words with their gaps filled.
 */
const fillGaps = (text: string, values: Readonly<Record<string, string | number>>): string =>
  text.replace(GAP, (whole, name: string) => {
    const value = values[name];

    return value === undefined ? whole : value.toString();
  });

export { fillGaps };
