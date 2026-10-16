import { say } from '@ValenceI18n/say';
import type { CourSpan } from '@ValenceClient/requests/seasonsOfTitle';

/**
 * Where a cour falls in the catalogue's numbering and the show's own: the season and episodes it
 * covers, and its episodes counted from the first.
 *
 * @param span - The cour's span.
 * @returns It in words.
 */
const describeCourSpan = (span: CourSpan): string => {
  const catalogue =
    span.first.season === span.last.season
      ? say('client.calendar.describeCalendarRun.episodesInSeason', {
          seasonNumber: span.first.season.toString(),
          firstEpisode: span.first.episode.toString(),
          lastEpisode: span.last.episode.toString(),
        })
      : say('client.calendar.describeCalendarRun.episodesAcrossSeasons', {
          firstSeason: span.first.season.toString(),
          firstEpisode: span.first.episode.toString(),
          lastSeason: span.last.season.toString(),
          lastEpisode: span.last.episode.toString(),
        });

  return span.firstAbsolute === null || span.lastAbsolute === null
    ? catalogue
    : say('client.requests.describeCourSpan.andCountedFromTheFirst', {
        catalogue,
        first: span.firstAbsolute.toString(),
        last: span.lastAbsolute.toString(),
      });
};

export { describeCourSpan };
