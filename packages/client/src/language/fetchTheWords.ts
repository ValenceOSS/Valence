import { StringsSchema } from '@ValenceContracts/schemas/Strings';
import type { Language } from '@ValenceI18n/LANGUAGES';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { readFromServerOrAbsent } from '@ValenceClient/query/readFromServerOrAbsent';
import { KEPT_WORDS_KEY } from './KEPT_WORDS_KEY';
import { readKeptWords } from './readKeptWords';
import { tellOfNewWords } from './tellOfNewWords';

const KEPT_FOR_MILLISECONDS = 24 * 60 * 60 * 1000;

/**
 * Fetches a language's words from the server, at most once a day, keeps them on the device for
 * the next launch and speaks them. A server too old to serve words, or one that cannot be reached,
 * leaves the app as it was.
 *
 * @param language - The language to fetch.
 * @param now - The time now, in milliseconds.
 * @returns Whether the words being spoken changed; where they did, the app is told to draw itself
 *   again.
 */
const fetchTheWords = async (language: Language, now = Date.now()): Promise<boolean> => {
  if (language === 'en') {
    return false;
  }

  const kept = readKeptWords();

  if (kept !== null && kept.language === language && now - kept.fetchedAt < KEPT_FOR_MILLISECONDS) {
    return false;
  }

  const words = await readFromServerOrAbsent(`/api/strings/${language}`, StringsSchema).catch(
    () => null,
  );

  if (words === null) {
    return false;
  }

  platformInUse().store.write(KEPT_WORDS_KEY, JSON.stringify({ language, fetchedAt: now, words }));

  const isChanged =
    kept === null ||
    kept.language !== language ||
    JSON.stringify(kept.words) !== JSON.stringify(words);

  if (isChanged) {
    speakLanguage(language, words);
    tellOfNewWords();
  }

  return isChanged;
};

export { fetchTheWords };
