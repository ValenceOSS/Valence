import { PLURAL_FORM } from './PLURAL_FORM';
import type { StringEntry } from './StringsFileSchema';

/**
 * Brings one language's strings into step with the English: every English handler in the English
 * order and with the English context, keeping whatever words the language already has and taking
 * the English words where it has none yet.
 *
 * The extra plural forms a language counts with, such as `.few`, stay beside their `.other` for as
 * long as the English still counts that thing.
 *
 * @param english - The English strings file.
 * @param translation - The language's strings file as it stands, empty for a new language.
 * @returns The language's strings file, in step.
 */
const alignTranslation = (
  english: readonly StringEntry[],
  translation: readonly StringEntry[],
): StringEntry[] => {
  const translatedBy = new Map(translation.map((entry) => [entry.handler, entry]));
  const handlers = new Set(english.map((entry) => entry.handler));
  const extraFormsOf = (other: string): StringEntry[] =>
    translation.filter((entry) => {
      const plural = PLURAL_FORM.exec(entry.handler);

      return (
        plural !== null && `${plural[1] ?? ''}.other` === other && !handlers.has(entry.handler)
      );
    });

  return english.flatMap((entry) => {
    const aligned = { ...entry, text: translatedBy.get(entry.handler)?.text ?? entry.text };

    return entry.handler.endsWith('.other')
      ? [
          ...extraFormsOf(entry.handler).map((extra) => ({ ...extra, context: entry.context })),
          aligned,
        ]
      : [aligned];
  });
};

export { alignTranslation };
