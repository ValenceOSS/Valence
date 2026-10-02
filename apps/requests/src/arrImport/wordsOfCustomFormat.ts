import { fieldsOf } from '@ValenceRequests/arrImport/fieldsOf';
import { termAsWord } from '@ValenceRequests/arrImport/termAsWord';
import type { ArrCustomFormat } from '@ValenceRequests/arrImport/schemas/ArrCustomFormatSchema';

const TITLE = 'ReleaseTitleSpecification';

/**
 * The words a custom format comes to, where it is only release-name terms: each term it matches on
 * as a word, approximate where it also says what a name must not have or needs every term at once,
 * which a profile's words cannot say; a format that judges anything other than the name — a
 * source, a resolution, a language, a size — comes to none.
 *
 * @param format - The custom format.
 * @returns Its words and whether they only approximate it, or null.
 */
const wordsOfCustomFormat = (
  format: ArrCustomFormat,
): { words: string[]; isApproximate: boolean } | null => {
  const { specifications } = format;

  if (specifications.length === 0 || specifications.some((one) => one.implementation !== TITLE)) {
    return null;
  }

  const kept = specifications.filter((one) => !one.negate);
  const words = kept.map((one) => termAsWord(fieldsOf(one.fields).text('value'), true));
  const read = words.filter((word): word is string => word !== null);

  if (read.length === 0) {
    return null;
  }

  return {
    words: [...new Set(read)],
    isApproximate:
      kept.length < specifications.length ||
      read.length < words.length ||
      (kept.length > 1 && kept.some((one) => one.required)),
  };
};

export { wordsOfCustomFormat };
