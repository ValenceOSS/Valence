/**
 * How far the frowns on the cards behind have come in, as the deck fans out: not at all until it
 * is half open, then fading in until it is nine-tenths open.
 *
 * @param progress - How far the deck has fanned out, from 0 (stacked) to 1.
 * @returns How visible the frowns are, from 0 to 1.
 */
const frownsAt = (progress: number): number => Math.min(1, Math.max(0, (progress - 0.5) / 0.4));

export { frownsAt };
