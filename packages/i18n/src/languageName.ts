import type { Language } from './LANGUAGES';
import { LANGUAGE_NAMES } from './LANGUAGE_NAMES';

/**
 * Names a language in itself — Deutsch, 日本語, العربية — so somebody can find their own among the
 * others whatever language the page is in. The names are written out rather than asked of
 * Intl.DisplayNames, which an app's JavaScript engine may not have, so every app names them alike.
 *
 * @param language - The language.
 * @returns Its name, written in it.
 */
const languageName = (language: Language): string => LANGUAGE_NAMES[language];

export { languageName };
