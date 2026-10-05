import type { CAPTION_FONTS } from '@ValenceClient/playback/CAPTION_FONTS';
import { say } from '@ValenceI18n/say';

/**
 * Names a caption font the way the settings offer it.
 *
 * @param font - The font.
 * @returns Its name.
 */
const nameCaptionFont = (font: (typeof CAPTION_FONTS)[number]): string => {
  switch (font) {
    case 'sans':
      return say('common.sans');
    case 'serif':
      return say('common.serif');
    case 'mono':
      return say('common.mono');
    case 'typewriter':
      return say('client.playback.nameCaptionFont.typewriter');
    case 'casual':
      return say('common.casual');
    case 'script':
      return say('client.playback.nameCaptionFont.script');
    case 'smallCapitals':
      return say('client.playback.nameCaptionFont.smallCapitals');
    case 'condensed':
      return say('client.playback.nameCaptionFont.condensed');
  }
};

export { nameCaptionFont };
