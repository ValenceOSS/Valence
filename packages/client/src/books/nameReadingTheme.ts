import type { READING_THEME_IDS } from '@ValenceCore/tokens/READING_THEME_IDS';
import { say } from '@ValenceI18n/say';

/**
 * What a reading theme is called where somebody chooses it.
 *
 * @param theme - The theme.
 * @returns Its name.
 */
const nameReadingTheme = (theme: (typeof READING_THEME_IDS)[number]): string =>
  ({
    original: say('common.original'),
    quiet: say('client.books.nameReadingTheme.quiet'),
    paper: say('client.books.nameReadingTheme.paper'),
    bold: say('client.books.nameReadingTheme.bold'),
    calm: say('client.books.nameReadingTheme.calm'),
    focus: say('client.books.nameReadingTheme.focus'),
  })[theme];

export { nameReadingTheme };
