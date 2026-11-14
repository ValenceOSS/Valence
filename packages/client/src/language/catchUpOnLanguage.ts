import type { Language } from '@ValenceI18n/LANGUAGES';
import { SPOKEN } from '@ValenceI18n/SPOKEN';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { fetchLanguagesInUse } from './fetchLanguagesInUse';
import { fetchTheWords } from './fetchTheWords';
import { languageToSpeak } from './languageToSpeak';
import { readKeptWords } from './readKeptWords';
import { tellOfNewWords } from './tellOfNewWords';
import { thisDevicesLanguages } from './thisDevicesLanguages';

/**
 * Brings an app that fetches its words from its server up to date with the languages chosen there:
 * asks which the server and the profile watching chose, speaks the language that makes this device
 * speak at once where it already has its words, and fetches them where it does not.
 *
 * @returns The language this device should now speak, whose words may still be on their way.
 */
const catchUpOnLanguage = async (): Promise<Language> => {
  await fetchLanguagesInUse();

  const language = languageToSpeak(thisDevicesLanguages());
  const kept = readKeptWords();

  if (language !== SPOKEN.language && (language === 'en' || kept?.language === language)) {
    speakLanguage(language, kept?.language === language ? kept.words : {});
    tellOfNewWords();
  }

  await fetchTheWords(language);

  return language;
};

export { catchUpOnLanguage };
