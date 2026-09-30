import type { CountedKey } from './CountedKey';
import type { Said, SaidValues } from './SaidSchema';
import { sayCount } from './sayCount';
import { wordsFor } from './wordsFor';

/**
 * Something a server says about how many of something there are, coded by the words without their
 * form, so a client picks the form its own language uses for that many.
 *
 * @param key - Which words, without the `.one` or `.other` on the end.
 * @param count - How many.
 * @param values - What fills any other gaps.
 */
const sayingCount = (key: CountedKey, count: number, values: SaidValues = {}): Said => ({
  code: key,
  message: sayCount(
    key,
    count,
    wordsFor(values, (inner) => inner.message),
  ),
  values: { ...values, count },
});

export { sayingCount };
