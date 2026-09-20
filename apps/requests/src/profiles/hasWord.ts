/**
 * Whether a release name has a word a profile names: as a whole word, whatever its case, or — for
 * a word written between slashes, such as `/\bhdr10\+?/` — wherever that pattern matches.
 *
 * @param name - The release name.
 * @param word - The word, or a pattern between slashes.
 * @returns Whether it has it.
 */
const hasWord = (name: string, word: string): boolean => {
  const pattern = /^\/(.+)\/$/.exec(word)?.[1];

  if (pattern !== undefined) {
    try {
      return new RegExp(pattern, 'i').test(name);
    } catch {
      return false;
    }
  }

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(name);
};

export { hasWord };
