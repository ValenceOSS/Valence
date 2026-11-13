import { ENGLISH } from './ENGLISH';
import type { Language } from './LANGUAGES';
import { SPOKEN } from './SPOKEN';

/**
 * Makes every later `say` in this process speak a language, from its words; anything the words do
 * not hold is said in English, so a string added since they were translated still reads.
 *
 * @param language - The language to speak.
 * @param words - Its words by handler, or nothing for English.
 */
const speakLanguage = (language: Language, words: Readonly<Record<string, string>> = {}): void => {
  SPOKEN.language = language;
  SPOKEN.words = language === 'en' ? ENGLISH : { ...ENGLISH, ...words };
};

export { speakLanguage };
