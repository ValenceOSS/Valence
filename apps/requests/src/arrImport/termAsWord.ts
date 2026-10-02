const LONGEST = 100;

/**
 * A term an app matches release names with — a word, a pattern between slashes, or a custom
 * format's regular expression — as a word a Valence profile can hold: a plain word where the
 * pattern only spells one out, the pattern between slashes where it does more, or none where it is
 * too long or JavaScript cannot read it.
 *
 * @param term - The term.
 * @param isPattern - Whether it is a regular expression without slashes, as custom formats hold.
 * @returns The word, or null.
 */
const termAsWord = (term: string, isPattern: boolean): string | null => {
  const given = term.trim();
  const slashed = /^\/(.+)\/[a-z]*$/i.exec(given)?.[1];

  if (!isPattern && slashed === undefined) {
    return given === '' || given.length > LONGEST ? null : given;
  }

  const pattern = (slashed ?? given).replace(/^\(\?i\)/, '');
  const spelled = pattern
    .replace(/^\\b|\\b$/g, '')
    .replaceAll('\\.', '.')
    .replaceAll('\\-', '-')
    .replaceAll('\\+', '+');

  if (/^[\w .+-]+$/.test(spelled) && spelled.trim() !== '') {
    return spelled.trim().slice(0, LONGEST);
  }

  try {
    new RegExp(pattern, 'i').test('');
  } catch {
    return null;
  }

  const word = `/${pattern}/`;

  return word.length > LONGEST ? null : word;
};

export { termAsWord };
