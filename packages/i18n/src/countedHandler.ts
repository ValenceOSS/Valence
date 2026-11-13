import type { CountedKey } from './CountedKey';
import { SPOKEN } from './SPOKEN';

/**
 * Picks which form of counted words a number takes in the language being spoken — one, two, few,
 * many or other, by the language's own rules — falling back to the English pair where the
 * language's file has no form of that kind.
 *
 * @param key - The counted words.
 * @param count - The number.
 * @returns The handler of the form to say.
 */
const countedHandler = (key: CountedKey, count: number): string => {
  const form = new Intl.PluralRules(SPOKEN.language).select(count);
  const chosen = `${key}.${form}`;

  return Object.hasOwn(SPOKEN.words, chosen)
    ? chosen
    : `${key}.${form === 'one' ? 'one' : 'other'}`;
};

export { countedHandler };
