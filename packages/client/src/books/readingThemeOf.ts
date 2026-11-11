import type { READING_THEME_IDS } from '@ValenceCore/tokens/READING_THEME_IDS';
import type { TextPreferences } from '@ValenceClient/books/textPreferences';

/**
 * The theme a book's text is set in: the one somebody chose, or for somebody who only ever chose a
 * light, sepia or dark page, the theme nearest it.
 *
 * @param settings - How they like text set.
 * @returns The theme.
 */
const readingThemeOf = (
  settings: Pick<TextPreferences, 'theme' | 'page'>,
): (typeof READING_THEME_IDS)[number] =>
  settings.theme ??
  (settings.page === 'dark' ? 'focus' : settings.page === 'sepia' ? 'quiet' : 'original');

export { readingThemeOf };
