const MOST_CHARACTERS = 500;

const REPEATS_A_REPEAT = /\((?:[^()\\]|\\.)*[+*}](?:[^()\\]|\\.)*\)[+*{]/;

/**
 * Whether a release name has a word a profile names: as a whole word, whatever its case, or — for
 * a word written between slashes, such as `/\bhdr10\+?/` — wherever that pattern matches. Only the
 * first five hundred characters of the name are looked at, and a pattern that repeats a group that
 * itself repeats, which can take for ever to fail, matches nothing.
 *
 * @param release - The release name.
 * @param word - The word, or a pattern between slashes.
 * @returns Whether it has it.
 */
const hasWord = (release: string, word: string): boolean => {
  const name = release.slice(0, MOST_CHARACTERS);
  const pattern = /^\/(.+)\/$/.exec(word)?.[1];

  if (pattern !== undefined) {
    if (REPEATS_A_REPEAT.test(pattern)) {
      return false;
    }

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
