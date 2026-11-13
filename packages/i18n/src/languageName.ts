import type { Language } from './LANGUAGES';

/**
 * Names a language in itself — Deutsch, 日本語, العربية — so somebody can find their own among the
 * others whatever language the page is in.
 *
 * @param language - The language.
 * @returns Its name, written in it.
 */
const languageName = (language: Language): string => {
  const name = new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language;

  return name.charAt(0).toLocaleUpperCase(language) + name.slice(1);
};

export { languageName };
