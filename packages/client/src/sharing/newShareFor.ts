import type { NewShare } from '@ValenceContracts/schemas/Share';
import type { ShareChoice, ShareSubject } from './newShareFor.types';

const HOURS_IN_A_DAY = 24;

const MILLISECONDS_IN_AN_HOUR = 3_600_000;

/**
 * The link to ask the server for, from what is being shared and what somebody chose: how long it
 * lasts, in the words a person uses — "a week" — rather than a date they would have to work out,
 * and how many people may open it. Where both are set, whichever runs out first ends it.
 *
 * An episode is shared as itself, or as its whole programme where somebody chose that; a programme
 * and a book are shared as themselves.
 *
 * @param subject - What is being shared.
 * @param choice - How long it lasts, how many may open it, and whether an episode shares its
 *   whole programme.
 * @param now - The moment it is asked for, in milliseconds.
 * @returns What to ask the server for.
 */
const newShareFor = (subject: ShareSubject, choice: ShareChoice, now: number): NewShare => {
  const asked: NewShare =
    subject.kind === 'book'
      ? { kind: 'book', bookId: subject.book.id }
      : subject.kind === 'series'
        ? { kind: 'series', seriesId: subject.seriesId }
        : choice.isWholeProgramme && subject.media.seriesId !== null
          ? { kind: 'series', seriesId: subject.media.seriesId }
          : { kind: 'item', mediaId: subject.media.id };

  return {
    ...asked,
    expiresAt:
      choice.lasts === 'forever'
        ? null
        : new Date(
            now + Number(choice.lasts) * HOURS_IN_A_DAY * MILLISECONDS_IN_AN_HOUR,
          ).toISOString(),
    viewCap: choice.cap === 'any' ? null : Number(choice.cap),
  };
};

export { newShareFor };
