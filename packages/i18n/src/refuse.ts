import { saying } from './saying';
import type { RefusalBody } from './RefusalBody';
import type { SaidValues } from './SaidSchema';
import type { StringKey } from './StringKey';

/**
 * The body a server answers with when it refuses: the English under `error`, where every client
 * has always read it, with the code and values beside it to translate it by.
 *
 * @param key - Which words.
 * @param values - What fills the gaps in them.
 */
const refuse = (key: StringKey, values: SaidValues = {}): RefusalBody & { code: string } => ({
  error: saying(key, values).message,
  code: key,
  values,
});

export { refuse };
