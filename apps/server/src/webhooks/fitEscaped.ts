import { clipText } from './clipText';

/**
 * Cuts text short enough that, once escaped, it still fits — escaping can lengthen it, so the cut is
 * made on the text and measured on what is sent.
 *
 * @param text - The text, unescaped.
 * @param room - The most the escaped text may take.
 * @param escape - How the receiver's markup escapes text.
 * @returns The escaped text, cut where it had to be.
 */
const fitEscaped = (text: string, room: number, escape: (text: string) => string): string => {
  let kept = clipText(text, room);

  while (escape(kept).length > room && kept !== '') {
    const sent = escape(kept).length;

    kept = clipText(text, Math.min(kept.length - 1, Math.floor((kept.length * room) / sent)));
  }

  return escape(kept);
};

export { fitEscaped };
