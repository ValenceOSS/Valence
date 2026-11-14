import { isLanguage } from '@ValenceI18n/isLanguage';
import type { Language } from '@ValenceI18n/LANGUAGES';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { LANGUAGE_CHOICE_KEY } from './LANGUAGE_CHOICE_KEY';

/**
 * The language somebody chose for this device, if they chose one rather than following the
 * device's own languages.
 *
 * @returns The language, or nothing.
 */
const chosenLanguageHere = (): Language | null => {
  const chosen = platformInUse().store.read(LANGUAGE_CHOICE_KEY);

  return chosen !== null && isLanguage(chosen) ? chosen : null;
};

export { chosenLanguageHere };
