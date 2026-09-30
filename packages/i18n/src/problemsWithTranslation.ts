import { gapsIn } from './gapsIn';
import { PLURAL_FORM } from './PLURAL_FORM';
import type { StringEntry } from './StringsFileSchema';

/**
 * Everything a translation does differently from the English it translates: a handler it lacks or
 * adds, context that has drifted, or a gap it drops or invents.
 *
 * A counted string may carry the extra plural forms its language uses, such as `.few`, where the
 * English has only `.one` and `.other`, and any of its forms may leave the number out.
 *
 * @param english - The English strings file.
 * @param translation - One language's strings file.
 * @returns One line per problem, empty when there are none.
 */
const problemsWithTranslation = (
  english: readonly StringEntry[],
  translation: readonly StringEntry[],
): string[] => {
  const englishBy = new Map(english.map((entry) => [entry.handler, entry]));
  const translatedBy = new Map(translation.map((entry) => [entry.handler, entry]));
  const problems: string[] = [];

  english.forEach((entry) => {
    if (!translatedBy.has(entry.handler)) {
      problems.push(`${entry.handler} is missing`);
    }
  });

  translation.forEach((entry) => {
    const plural = PLURAL_FORM.exec(entry.handler);
    const source =
      englishBy.get(entry.handler) ??
      (plural === null ? undefined : englishBy.get(`${plural[1] ?? ''}.other`));

    if (source === undefined) {
      problems.push(`${entry.handler} is not in the English`);

      return;
    }

    if (entry.context !== source.context) {
      problems.push(`${entry.handler} has different context from the English`);
    }

    const isCounted = plural !== null && englishBy.has(`${plural[1] ?? ''}.other`);
    const gaps = gapsIn(entry.text)
      .filter((gap) => !isCounted || gap !== 'count')
      .sort();
    const englishGaps = gapsIn(source.text)
      .filter((gap) => !isCounted || gap !== 'count')
      .sort();

    if (gaps.join() !== englishGaps.join()) {
      problems.push(
        `${entry.handler} fills {${gaps.join('}, {')}} where the English fills {${englishGaps.join('}, {')}}`,
      );
    }
  });

  return problems;
};

export { problemsWithTranslation };
