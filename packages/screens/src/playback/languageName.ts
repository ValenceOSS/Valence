const LANGUAGE_NAMES = new Intl.DisplayNames(undefined, { type: 'language' });

/**
 * What a language is called, in the viewer's own language, so a track tagged `eng` and a language
 * asked for as `en` are known to be the same.
 *
 * @param code - The language, by its code.
 * @returns Its name, or the code where it names no language.
 */
const languageName = (code: string): string => {
  try {
    return LANGUAGE_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
};

export { languageName };
