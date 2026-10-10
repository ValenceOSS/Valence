import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import { say } from '@ValenceI18n/say';

/**
 * What somebody has open, in a line: the show or film they are watching, the track and its artists
 * they are hearing, or the book and its authors, and that they have nothing open otherwise.
 *
 * @param session - The open session.
 * @returns The line.
 */
const titleOfSession = ({ playback, listening, bookListening, reading }: ActiveSession): string => {
  const book = bookListening ?? reading;

  return (
    playback?.seriesTitle ??
    playback?.mediaTitle ??
    (listening !== null
      ? `${listening.title} · ${listening.artists.join(', ')}`
      : book !== null
        ? [book.title, ...book.authors].join(' · ')
        : say('screens.adminArea.sessionCard.notWatchingAnything'))
  );
};

export { titleOfSession };
