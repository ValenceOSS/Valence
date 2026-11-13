import { GAP } from './GAP';

/**
 * Splits words at their gaps and puts what is given in each, for a sentence whose gap holds an
 * element such as a link; a gap with nothing given for it is left as written.
 *
 * @param text - The words.
 * @param fillings - What goes in each gap.
 * @returns The pieces, in order, with nothing empty among them.
 */
const partsOf = <Filling>(
  text: string,
  fillings: Readonly<Record<string, Filling>>,
): (string | Filling)[] =>
  text
    .split(GAP)
    .map((part, at) => (at % 2 === 1 ? (fillings[part] ?? `{${part}}`) : part))
    .filter((part) => part !== '');

export { partsOf };
