/**
 * Eases in on a square: slow to leave, quickening as it goes — how a page sets off.
 *
 * @param progress - How far through, from nothing to all of it.
 * @returns How far along the movement is.
 */
const easeInQuad = (progress: number): number => progress * progress;

export { easeInQuad };
