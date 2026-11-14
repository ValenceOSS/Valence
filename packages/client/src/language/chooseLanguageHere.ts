import type { Language } from '@ValenceI18n/LANGUAGES';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { LANGUAGE_CHOICE_KEY } from './LANGUAGE_CHOICE_KEY';

/**
 * Keeps a language somebody chose for this device, or forgets the choice so the device's own
 * languages decide again.
 *
 * @param language - The language, or nothing to follow the device.
 */
const chooseLanguageHere = (language: Language | null): void => {
  const { store } = platformInUse();

  if (language === null) {
    store.forget(LANGUAGE_CHOICE_KEY);
  } else {
    store.write(LANGUAGE_CHOICE_KEY, language);
  }
};

export { chooseLanguageHere };
