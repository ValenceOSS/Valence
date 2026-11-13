import type { Language } from '@ValenceI18n/LANGUAGES';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { languageToSpeak } from './languageToSpeak';

/**
 * Gets this device speaking its language before anything is drawn: picks the language, fetches its
 * words and speaks them, falling back to English where the words cannot be fetched.
 *
 * @param wanted - The device's languages, most wanted first.
 * @param loadWords - Fetches a language's words by handler.
 * @returns The language now spoken.
 */
const startSpeaking = async (
  wanted: readonly string[],
  loadWords: (language: Language) => Promise<Readonly<Record<string, string>>>,
): Promise<Language> => {
  const language = languageToSpeak(wanted);

  if (language === 'en') {
    return language;
  }

  try {
    speakLanguage(language, await loadWords(language));

    return language;
  } catch {
    speakLanguage('en');

    return 'en';
  }
};

export { startSpeaking };
