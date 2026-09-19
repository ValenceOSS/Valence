/**
 * Whether a release is a proper — a better release of the same thing by another group — or a
 * repack, the same group fixing its own.
 *
 * @param spaced - The name, with its words spaced.
 * @returns Which it is.
 */
const readRevision = (spaced: string): { isProper: boolean; isRepack: boolean } => ({
  isProper: /\b(real )?proper\b/i.test(spaced),
  isRepack: /\brepack\d?\b|\brerip\b/i.test(spaced),
});

export { readRevision };
