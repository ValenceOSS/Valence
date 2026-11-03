/**
 * What a language is called, in the viewer's own language, so a track tagged `eng` and a language
 * asked for as `en` are known to be the same. An engine that cannot name languages, as some phones'
 * cannot, gives the code back in capitals.
 *
 * @param code - The language, by its code.
 * @returns Its name, or the code where it names no language.
 */
const languageName = (code: string): string => {
  try {
    return new Intl.DisplayNames(undefined, { type: 'language' }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

export { languageName };
