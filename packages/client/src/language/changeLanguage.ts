import { isLanguage } from '@ValenceI18n/isLanguage';
import type { Language } from '@ValenceI18n/LANGUAGES';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { chooseLanguageHere } from './chooseLanguageHere';
import { fetchTheWords } from './fetchTheWords';
import { languageToSpeak } from './languageToSpeak';
import { readKeptWords } from './readKeptWords';
import { tellOfNewWords } from './tellOfNewWords';
import { thisDevicesLanguages } from './thisDevicesLanguages';

/**
 * Changes the language an app that fetches its words from its server speaks, at once: keeps the
 * choice, speaks the new language in words already on the device where it has them and fetches
 * them from the server where it does not, and tells the app to draw itself again.
 *
 * @param chosen - A language's id, or anything else to follow the device's own languages.
 * @returns The language now spoken, once its words have arrived where they had to be fetched.
 */
const changeLanguage = async (chosen: string): Promise<Language> => {
  chooseLanguageHere(isLanguage(chosen) ? chosen : null);

  const language = languageToSpeak(thisDevicesLanguages());
  const kept = readKeptWords();

  if (language === 'en' || kept?.language === language) {
    speakLanguage(language, kept?.language === language ? kept.words : {});
    tellOfNewWords();

    return language;
  }

  if (!(await fetchTheWords(language))) {
    speakLanguage('en');
    tellOfNewWords();
  }

  return language;
};

export { changeLanguage };
