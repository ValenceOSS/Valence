import type { CountedKey } from './CountedKey';
import { ENGLISH } from './ENGLISH';
import { say } from './say';
import type { Said } from './SaidSchema';
import { sayCount } from './sayCount';
import type { StringKey } from './StringKey';
import { wordsFor } from './wordsFor';

/**
 * Whether a code names words in the strings file this app was built with.
 *
 * @param code - A code a server sent.
 */
const isKnown = (code: string): code is StringKey => Object.hasOwn(ENGLISH, code);

/**
 * Whether a code names counted words in the strings file this app was built with.
 *
 * @param code - A code a server sent.
 */
const isCounted = (code: string): code is CountedKey => Object.hasOwn(ENGLISH, `${code}.other`);

/**
 * Says again something a server said, from this app's own strings where it knows the code, and in
 * the server's English where it does not — text that came from elsewhere, or a newer server.
 *
 * @param said - What the server said.
 * @returns The words to show.
 */
const sayAgain = (said: Said): string => {
  const words = wordsFor(said.values, sayAgain);
  const { count } = said.values;

  if (said.code === null) {
    return said.message;
  }

  if (isCounted(said.code) && typeof count === 'number') {
    return sayCount(said.code, count, words);
  }

  return isKnown(said.code) ? say(said.code, words) : said.message;
};

export { sayAgain };
