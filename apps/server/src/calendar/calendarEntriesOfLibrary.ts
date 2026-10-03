import { episodeEntryId } from '@ValenceServer/calendar/episodeEntryId';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { CalendarEpisode } from '@ValenceServer/calendar/CalendarEpisode';

/**
 * Lays the episodes of shows already in a library out on the calendar, each on the day it airs.
 *
 * An episode on disk is available. One still to air is not out yet, and one that has aired but
 * is not on disk is not held: nobody asked for it, so it is not wanted, but neither has it arrived.
 *
 * @param episodes - The episodes airing within the days shown.
 * @param today - Today, as YYYY-MM-DD.
 * @returns Their entries.
 */
const calendarEntriesOfLibrary = (
  episodes: readonly CalendarEpisode[],
  today: string,
): CalendarEntry[] =>
  episodes.map((episode) => ({
    id: episodeEntryId(episode.externalId, episode.seasonNumber, episode.episodeNumber),
    date: episode.airDate,
    release: 'airs',
    title: episode.show.title,
    episode: {
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      stillUrl: episode.stillUrl,
    },
    artworkMediaId: episode.show.coverMediaId,
    posterUrl: null,
    backdropUrl: null,
    logoUrl: null,
    state: episode.isHeld ? 'available' : episode.airDate > today ? 'notOutYet' : 'notHeld',
    source: 'library',
    requestedBy: null,
    opens: { kind: 'show', showId: episode.show.seriesId ?? episode.show.id },
  }));

export { calendarEntriesOfLibrary };
