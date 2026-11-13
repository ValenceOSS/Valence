import { I18nManager } from 'react-native';
import { directionOf } from '@ValenceI18n/directionOf';
import type { Language } from '@ValenceI18n/LANGUAGES';

/**
 * Lays the app out for the way a language is written, mirroring it for Arabic and Hebrew. React
 * Native settles the direction as the app starts, so a change takes hold from the next launch.
 *
 * @param language - The language the app speaks.
 * @returns Whether the app is laid out the wrong way until it is next opened.
 */
const layOutFor = (language: Language): boolean => {
  const isRightToLeft = directionOf(language) === 'rtl';

  I18nManager.allowRTL(isRightToLeft);
  I18nManager.swapLeftAndRightInRTL(true);

  if (I18nManager.isRTL === isRightToLeft) {
    return false;
  }

  I18nManager.forceRTL(isRightToLeft);

  return true;
};

export { layOutFor };
