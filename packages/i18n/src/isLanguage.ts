import { LANGUAGES } from './LANGUAGES';
import type { Language } from './LANGUAGES';

/**
 * Whether a tag is one of the languages Valence is translated into, as written in `LANGUAGES`.
 *
 * @param tag - A language tag.
 * @returns Whether it is one of them.
 */
const isLanguage = (tag: string): tag is Language => LANGUAGES.some((one) => one === tag);

export { isLanguage };
