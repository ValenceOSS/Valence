import type { Language } from './LANGUAGES';
import { RIGHT_TO_LEFT } from './RIGHT_TO_LEFT';

/**
 * Which way a language's text runs, for a page or an app to lay itself out by.
 *
 * @param language - The language.
 * @returns `rtl` for one written right to left, otherwise `ltr`.
 */
const directionOf = (language: Language): 'ltr' | 'rtl' =>
  RIGHT_TO_LEFT.includes(language) ? 'rtl' : 'ltr';

export { directionOf };
