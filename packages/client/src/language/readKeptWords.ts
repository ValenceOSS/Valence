import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { KEPT_WORDS_KEY } from './KEPT_WORDS_KEY';
import { KeptWordsSchema } from './KeptWordsSchema';
import type { KeptWords } from './KeptWordsSchema';

/**
 * The words this device last fetched from its server, and which language they are, where it has
 * fetched any and they still read.
 *
 * @returns The kept words, or nothing.
 */
const readKeptWords = (): KeptWords | null => {
  const kept = platformInUse().store.read(KEPT_WORDS_KEY);

  if (kept === null) {
    return null;
  }

  try {
    const read = KeptWordsSchema.safeParse(JSON.parse(kept));

    return read.success ? read.data : null;
  } catch {
    return null;
  }
};

export { readKeptWords };
