/**
 * Reads a name for comparing, the way two catalogues spell the same title differently: in any case,
 * without what is in brackets — an edition, a remaster, a release group — and without punctuation.
 *
 * @param name - The name.
 * @returns It, plainly.
 */
const plainly = (name: string): string =>
  name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export { plainly };
