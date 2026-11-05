import type { BulkReplace } from '@ValenceContracts/schemas/BulkTitleEdit';
import type { TitleValue } from '@ValenceContracts/schemas/TitleEdit';

const SPECIAL = /[.*+?^${}()|[\]\\]/gu;

/**
 * Finds and replaces in one field of a title: every place the words appear in a line of text, or
 * every word of a list that is the words, with no word in a list twice afterwards and an emptied
 * word dropped. A title emptied by the change keeps what it had, since a title cannot be nothing.
 *
 * @param value - The field's value now.
 * @param replace - What to find, what to put in its place, and whether case must match.
 * @returns The value afterwards, which is the same value where nothing was found.
 */
const replaceInTitleValue = (value: TitleValue, replace: BulkReplace): TitleValue => {
  const finding = new RegExp(
    replace.find.replace(SPECIAL, '\\$&'),
    replace.matchCase ? 'gu' : 'giu',
  );
  const isFound = (word: string) =>
    replace.matchCase
      ? word === replace.find
      : word.toLocaleLowerCase() === replace.find.toLocaleLowerCase();

  if (typeof value === 'string') {
    const next = value.replace(finding, () => replace.with).trim();

    return next === '' ? (replace.field === 'title' ? value : null) : next;
  }

  if (!Array.isArray(value)) {
    return value;
  }

  const words = value.filter((one) => typeof one === 'string');

  if (!words.some(isFound)) {
    return value;
  }

  const swapped = words.map((word) => (isFound(word) ? replace.with.trim() : word));

  return swapped.filter(
    (word, at) =>
      word !== '' &&
      swapped.findIndex((other) => other.toLocaleLowerCase() === word.toLocaleLowerCase()) === at,
  );
};

export { replaceInTitleValue };
