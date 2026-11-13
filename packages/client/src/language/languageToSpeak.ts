import { chooseLanguage } from '@ValenceI18n/chooseLanguage';
import type { Language } from '@ValenceI18n/LANGUAGES';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { LANGUAGE_CHOICE_KEY } from './LANGUAGE_CHOICE_KEY';

/**
 * Which language this device speaks: the one somebody chose on it, or else the first of the
 * device's own languages Valence is translated into, or English.
 *
 * @param wanted - The device's languages, most wanted first.
 * @returns The language to speak.
 */
const languageToSpeak = (wanted: readonly string[]): Language => {
  const chosen = platformInUse().store.read(LANGUAGE_CHOICE_KEY);

  return chooseLanguage(chosen === null ? wanted : [chosen, ...wanted]);
};

export { languageToSpeak };
