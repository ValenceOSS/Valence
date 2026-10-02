import { say } from '@ValenceI18n/say';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * The line under an entry's title on the release calendar: which episode it is, or which of a
 * film's releases this day is.
 *
 * @param entry - The entry.
 * @returns The line.
 */
const describeCalendarEntry = (entry: CalendarEntry): string => {
  if (entry.episode !== null) {
    return say('client.calendar.describeCalendarEntry.sSeasonNumberEEpisodeNumberTitle', {
      seasonNumber: entry.episode.seasonNumber.toString(),
      episodeNumber: entry.episode.episodeNumber.toString(),
      title: entry.episode.title,
    });
  }

  switch (entry.release) {
    case 'cinema':
      return say('client.calendar.describeCalendarEntry.inCinemas');
    case 'physical':
      return say('client.calendar.describeCalendarEntry.onDisc');
    case 'digital':
    case 'airs':
      return say('client.calendar.describeCalendarEntry.toBuyOrRent');
  }
};

export { describeCalendarEntry };
