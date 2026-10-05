import type { CAPTION_WEIGHTS } from '@ValenceClient/playback/CAPTION_WEIGHTS';
import { say } from '@ValenceI18n/say';

/**
 * Names how heavy caption lettering is drawn, the way the settings offer it.
 *
 * @param weight - The weight.
 * @returns Its name.
 */
const nameCaptionWeight = (weight: (typeof CAPTION_WEIGHTS)[number]): string => {
  switch (weight) {
    case 'light':
      return say('common.light');
    case 'regular':
      return say('client.playback.nameCaptionWeight.regular');
    case 'medium':
      return say('common.medium');
    case 'bold':
      return say('client.playback.nameCaptionWeight.bold');
    case 'heavy':
      return say('common.heavy');
  }
};

export { nameCaptionWeight };
