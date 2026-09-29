const WORTH_DOING = 0.9;

/**
 * Whether a smaller copy of a file would be smaller by enough to be worth a generation of quality —
 * which a tenth is not.
 *
 * @param estimatedBytes - How large the copy is expected to be.
 * @param originalBytes - How large the file already is.
 * @returns Whether the copy saves enough to be worth making.
 */
const savesEnough = (estimatedBytes: number, originalBytes: number): boolean =>
  estimatedBytes <= originalBytes * WORTH_DOING;

export { savesEnough };
