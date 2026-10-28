const ELLIPSIS = '…';

/**
 * Cuts text to the most a receiver will accept, marking that it was cut — receivers such as Discord
 * and Telegram refuse a whole message when one part of it is over their limit. A character written as
 * two halves, such as an emoji, is never cut between them.
 *
 * @param text - What to say.
 * @param limit - The most the receiver will take.
 * @returns The text, cut where it had to be.
 */
const clipText = (text: string, limit: number): string => {
  if (text.length <= limit) {
    return text;
  }

  if (limit < ELLIPSIS.length) {
    return '';
  }

  const end = limit - ELLIPSIS.length;
  const splitsAPair = /[\uD800-\uDBFF]/.test(text.charAt(end - 1));

  return `${text.slice(0, splitsAPair ? end - 1 : end)}${ELLIPSIS}`;
};

export { clipText };
