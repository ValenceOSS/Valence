import { calendarStateOfItem } from '@ValenceServer/calendar/calendarStateOfItem';
import { episodeEntryId } from '@ValenceServer/calendar/episodeEntryId';
import { catalogueTitleKey } from '@ValenceServer/calendar/catalogueTitleKey';
import type { CatalogueArtwork } from '@ValenceServer/calendar/CatalogueArtwork';
import type { CalendarEntry, CalendarRelease } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { MediaRequest, ReleaseDates } from '@ValenceContracts/schemas/MediaRequest';

const NO_STILLS: ReadonlyMap<string, string> = new Map();

const NO_ARTWORK: ReadonlyMap<string, CatalogueArtwork> = new Map();

const FILM_RELEASES: readonly (readonly [keyof ReleaseDates, CalendarRelease])[] = [
  ['theatrical', 'cinema'],
  ['digital', 'digital'],
  ['physical', 'physical'],
];

/**
 * Lays requested films and episodes out on the calendar: each of a film's three releases on its
 * own day, and each episode of a requested season on the day it airs.
 *
 * A refused request is not shown, since nothing is coming. Albums, artists and books are left to
 * pages of their own; a release calendar is for what is watched.
 *
 * @param requests - The requests the viewer may see.
 * @param from - The first day shown, as YYYY-MM-DD.
 * @param to - The last day shown, as YYYY-MM-DD.
 * @param stills - The catalogue's still of each episode airing, by its entry's id, where it has one.
 * @param artwork - The catalogue's backdrop and logo of each title, by its key, for a title the
 *   library does not hold.
 * @returns Every entry falling within those days.
 */
const calendarEntriesOfRequests = (
  requests: readonly MediaRequest[],
  from: string,
  to: string,
  stills: ReadonlyMap<string, string> = NO_STILLS,
  artwork: ReadonlyMap<string, CatalogueArtwork> = NO_ARTWORK,
): CalendarEntry[] =>
  requests.flatMap((request): CalendarEntry[] => {
    if (request.approval === 'refused' || request.tmdbId === null) {
      return [];
    }

    const catalogueId = request.tmdbId.toString();
    const pictures = artwork.get(
      catalogueTitleKey({
        kind: request.kind === 'film' ? 'movie' : 'tv',
        externalId: catalogueId,
      }),
    );
    const shared = {
      title: request.title,
      posterUrl: request.posterUrl,
      backdropUrl: pictures?.backdropUrl ?? null,
      logoUrl: pictures?.logoUrl ?? null,
      source: 'request' as const,
      requestedBy: request.requestedBy,
    };

    if (request.kind === 'film') {
      const film = request.items.find((item) => item.season === null);
      const state = film === undefined ? 'wanted' : calendarStateOfItem(film.state);
      const opens =
        request.mediaId === null
          ? { kind: 'asking' as const, requestKind: request.kind, catalogueId }
          : { kind: 'item' as const, mediaId: request.mediaId };

      return FILM_RELEASES.flatMap(([field, release]) => {
        const date = request.releaseDates[field];

        return date === null || date < from || date > to
          ? []
          : [
              {
                ...shared,
                id: `film:${catalogueId}:${release}`,
                date,
                release,
                episode: null,
                artworkMediaId: request.mediaId,
                state,
                opens,
              },
            ];
      });
    }

    if (request.kind !== 'series') {
      return [];
    }

    const opens =
      request.mediaId === null
        ? { kind: 'asking' as const, requestKind: request.kind, catalogueId }
        : { kind: 'show' as const, showId: request.mediaId };

    return request.items.flatMap((item) => {
      const { season, episode, airDate } = item;

      return season === null ||
        episode === null ||
        episode < 1 ||
        airDate === null ||
        airDate < from ||
        airDate > to
        ? []
        : [
            {
              ...shared,
              id: episodeEntryId(catalogueId, season, episode),
              date: airDate,
              release: 'airs' as const,
              episode: {
                seasonNumber: season,
                episodeNumber: episode,
                title: item.title,
                stillUrl: stills.get(episodeEntryId(catalogueId, season, episode)) ?? null,
              },
              artworkMediaId: null,
              state: calendarStateOfItem(item.state),
              opens,
            },
          ];
    });
  });

export { calendarEntriesOfRequests };
