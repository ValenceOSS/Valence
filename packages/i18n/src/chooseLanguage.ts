import { LANGUAGES } from './LANGUAGES';
import type { Language } from './LANGUAGES';
import { isLanguage } from './isLanguage';

/**
 * Picks the language to speak from somebody's preferences, in order: an exact match first, then a
 * script or region Valence has for the same language, read from the tag itself rather than through
 * Intl.Locale, which an app's JavaScript engine may not have — Chinese in Taiwan or Hong Kong reads
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

    const parts = tag.split(/[-_]/u);
    const base = (parts[0] ?? '').toLowerCase();
    const rest = parts.slice(1).map((part) => part.toUpperCase());

    if (base === 'zh') {
      return rest.some((part) => ['HANT', 'TW', 'HK', 'MO'].includes(part)) ? 'zh-Hant' : 'zh-Hans';
    }

    if (base === 'pt') {
      return rest.includes('BR') ? 'pt-BR' : 'pt-PT';
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
