import { describeCalendarEntry } from '@ValenceClient/calendar/describeCalendarEntry';
import { say } from '@ValenceI18n/say';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * The line beside a show's or a film's name on the calendar's timeline: the one release where
 * there is one, and the first and last episodes where a run of them airs.
 *
 * @param entries - Its releases in the days shown, soonest first.
 * @returns The line.
 */
const describeCalendarRun = (entries: readonly CalendarEntry[]): string => {
  const first = entries[0];
  const last = entries[entries.length - 1];

  if (first === undefined || last === undefined) {
    return '';
  }

  if (first === last || first.episode === null || last.episode === null) {
    return describeCalendarEntry(first);
  }

  if (first.episode.seasonNumber === last.episode.seasonNumber) {
    return say('client.calendar.describeCalendarRun.episodesInSeason', {
      seasonNumber: first.episode.seasonNumber.toString(),
      firstEpisode: first.episode.episodeNumber.toString(),
      lastEpisode: last.episode.episodeNumber.toString(),
    });
  }

  return say('client.calendar.describeCalendarRun.episodesAcrossSeasons', {
    firstSeason: first.episode.seasonNumber.toString(),
    firstEpisode: first.episode.episodeNumber.toString(),
    lastSeason: last.episode.seasonNumber.toString(),
    lastEpisode: last.episode.episodeNumber.toString(),
  });
};

export { describeCalendarRun };
