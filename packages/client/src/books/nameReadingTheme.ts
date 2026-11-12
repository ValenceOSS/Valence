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
    quiet: say('phone.aReader.aReadingLook.quiet'),
    paper: say('phone.aReader.aReadingLook.paper'),
    bold: say('client.playback.nameCaptionWeight.bold'),
    calm: say('phone.aReader.aReadingLook.calm'),
    focus: say('phone.aReader.aReadingLook.focus'),
  })[theme];

export { nameReadingTheme };
