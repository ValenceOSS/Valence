import { say } from '@ValenceI18n/say';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * The line under an entry's title on the release calendar: which episode it is, or which of a
 * film's releases this day is. An episode the catalogue has only called by its number, as it does
 * before the real title is known, is named by its season and number alone rather than twice over.
 *
 * @param entry - The entry.
 * @returns The line.
 */
const describeCalendarEntry = (entry: CalendarEntry): string => {
  if (entry.episode !== null) {
    const { episodeNumber, title } = entry.episode;

    if (
      title.trim() === '' ||
      new RegExp(`^episode\\s*0*${episodeNumber}$`, 'iu').test(title.trim())
    ) {
      return say('client.calendar.describeCalendarEntry.sSeasonNumberEEpisodeNumber', {
        seasonNumber: entry.episode.seasonNumber.toString(),
        episodeNumber: episodeNumber.toString(),
      });
    }

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
