import type { Language } from '@ValenceI18n/LANGUAGES';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { languageToSpeak } from './languageToSpeak';
import { readKeptWords } from './readKeptWords';

/**
 * Gets an app that fetches its words from its server speaking at once, before it has asked the
 * server anything: in the words it kept from last time where they are the language it should
 * speak, and in English until then.
 *
 * @param wanted - The device's languages, most wanted first.
 * @returns The language the app should speak, whose words may still be on their way.
 */
const speakTheKeptWords = (wanted: readonly string[]): Language => {
  const language = languageToSpeak(wanted);
  const kept = readKeptWords();

  if (language !== 'en' && kept !== null && kept.language === language) {
    speakLanguage(language, kept.words);
  } else {
    speakLanguage('en');
  }

  return language;
};

export { speakTheKeptWords };
