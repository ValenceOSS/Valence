import { chooseLanguage } from '@ValenceI18n/chooseLanguage';
import type { Language } from '@ValenceI18n/LANGUAGES';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { LANGUAGE_CHOICE_KEY } from './LANGUAGE_CHOICE_KEY';
import { readLanguagesInUse } from './readLanguagesInUse';

/**
 * Which language this device speaks: the one somebody chose on it, or else the one the profile
 * watching chose, or else the one the server's administrator chose for everybody, or else the first
 * of the device's own languages Valence is translated into, or English.
 *
 * @param wanted - The device's languages, most wanted first.
 * @returns The language to speak.
 */
const languageToSpeak = (wanted: readonly string[]): Language => {
  const chosenHere = platformInUse().store.read(LANGUAGE_CHOICE_KEY);
  const { profile, server } = readLanguagesInUse();
  const chosen = [chosenHere, profile, server].filter((one) => one !== null);

  return chooseLanguage([...chosen, ...wanted]);
};

export { languageToSpeak };
