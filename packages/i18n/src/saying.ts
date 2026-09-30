import { say } from './say';
import type { Said, SaidValues } from './SaidSchema';
import type { StringKey } from './StringKey';
import { wordsFor } from './wordsFor';

/**
 * Something a server says to a person, as its code, its English and whatever fills its gaps, so a
 * client can say it again in the person's own language and still show the English if it cannot.
 *
 * @param key - Which words.
 * @param values - What fills the gaps in them, which may itself be something said.
 */
const saying = (key: StringKey, values: SaidValues = {}): Said => ({
  code: key,
  message: say(
    key,
    wordsFor(values, (inner) => inner.message),
  ),
  values,
});

export { saying };
