import { LANGUAGES } from './LANGUAGES';
import type { Language } from './LANGUAGES';
import { isLanguage } from './isLanguage';

/**
 * Picks the language to speak from somebody's preferences, in order: an exact match first, then a
 * script or region Valence has for the same language — Chinese in Taiwan or Hong Kong reads
 * Traditional, Portuguese outside Brazil reads European — and English where nothing matches.
 *
 * @param wanted - Language tags, most wanted first, such as a browser's `navigator.languages`.
 * @returns The language to speak.
 */
const chooseLanguage = (wanted: readonly string[]): Language => {
  for (const tag of wanted) {
    const exact = LANGUAGES.find((one) => one.toLowerCase() === tag.toLowerCase());

    if (exact !== undefined) {
      return exact;
    }

    const locale = new Intl.Locale(tag).maximize();
    const base = locale.language;

    if (base === 'zh') {
      return locale.script === 'Hant' ? 'zh-Hant' : 'zh-Hans';
    }

    if (base === 'pt') {
      return locale.region === 'BR' ? 'pt-BR' : 'pt-PT';
    }

    if (base === 'no' || base === 'nb') {
      return 'nb';
    }

    if (isLanguage(base)) {
      return base;
    }
  }

  return 'en';
};

export { chooseLanguage };
