import { PLURAL_FORM } from './PLURAL_FORM';
import type { StringEntry } from './StringsFileSchema';

/**
 * Everything wrong with the English strings file: a handler or a text written twice, handlers out
 * of order, or a counted string missing one of its two English forms. The forms of one counted
 * string may read the same in English, since other languages still tell them apart.
 *
 * @param english - The English strings file.
 * @returns One line per problem, empty when there are none.
 */
const problemsWithEnglish = (english: readonly StringEntry[]): string[] => {
  const handlers = english.map((entry) => entry.handler);
  const seenHandlers = new Set<string>();
  const seenTexts = new Map<string, string>();
  const problems: string[] = [];

  english.forEach((entry, at) => {
    const before = handlers[at - 1];

    if (seenHandlers.has(entry.handler)) {
      problems.push(`${entry.handler} is written twice`);
    }

    if (before !== undefined && before.localeCompare(entry.handler, 'en') > 0) {
      problems.push(`${entry.handler} comes before ${before} in handler order`);
    }

    const twin = seenTexts.get(entry.text);
    const baseOf = (handler: string) => PLURAL_FORM.exec(handler)?.[1];

    if (
      twin !== undefined &&
      (baseOf(twin) === undefined || baseOf(twin) !== baseOf(entry.handler))
    ) {
      problems.push(`${entry.handler} says the same as ${twin}: "${entry.text}"`);
    }

    seenHandlers.add(entry.handler);
    seenTexts.set(entry.text, entry.handler);

    const plural = PLURAL_FORM.exec(entry.handler);

    if (plural !== null) {
      const partner = plural[2] === 'one' ? 'other' : 'one';

      if (!handlers.includes(`${plural[1] ?? ''}.${partner}`)) {
        problems.push(`${entry.handler} has no .${partner} beside it`);
      }
    }
  });

  return problems;
};

export { problemsWithEnglish };
