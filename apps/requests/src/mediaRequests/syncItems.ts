import { DEFAULT_RELEASE_TYPES } from '@ValenceContracts/schemas/MediaRequest';
import { isSeasonWanted } from '@ValenceRequests/mediaRequests/isSeasonWanted';
import { releaseDateOf } from '@ValenceRequests/mediaRequests/releaseDateOf';
import type { ReleaseWait } from '@ValenceContracts/schemas/QualityProfile';
import type { HeldEpisode, RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type ItemDraft = Pick<
  RequestItemRecord,
  'musicBrainzId' | 'season' | 'episode' | 'format' | 'title' | 'airDate'
> & { state: Extract<RequestItemRecord['state'], 'waiting' | 'available'> };

type ItemChanges = {
  add: ItemDraft[];
  change: Array<{ id: string; changes: Pick<RequestItemRecord, 'title' | 'airDate'> }>;
  remove: string[];
  arrive: string[];
};

const LETTING_GO = new Set<RequestItemRecord['state']>(['waiting', 'wanted', 'failed']);

/**
 * Whether the library holds an episode.
 *
 * @param held - The episodes it holds.
 * @param season - The episode's season.
 * @param episode - Its number in the season.
 * @returns Whether it is held.
 */
const isHeld = (
  held: readonly HeldEpisode[],
  season: number | null,
  episode: number | null,
): boolean => held.some((one) => one.season === season && one.episode === episode);

/**
 * Everything a request asks for, by what the catalogue says: the film, the episodes of the seasons
 * asked for, the artist's albums of the kinds asked for, the album, or the book, once in each
 * format asked for — the ebook, the audiobook or both — each wanted at once, since a book has no
 * release to wait for.
 *
 * An episode the library already holds is asked for as already there, so nothing searches for it.
 *
 * @param request - The request.
 * @param catalogue - What the catalogue knows.
 * @param waitFor - What its quality profile holds a film until.
 * @param held - The episodes the library already holds.
 * @returns What it asks for.
 */
const wantedOf = (
  request: Pick<
    MediaRequestRecord,
    | 'kind'
    | 'title'
    | 'seasons'
    | 'followsNewSeasons'
    | 'followsAfter'
    | 'releaseDates'
    | 'musicBrainzId'
    | 'releaseTypes'
    | 'bookFormats'
  >,
  catalogue: Pick<RequestCatalogue, 'episodes' | 'albums'>,
  waitFor: ReleaseWait,
  held: readonly HeldEpisode[],
): ItemDraft[] => {
  switch (request.kind) {
    case 'film':
      return [
        {
          musicBrainzId: null,
          season: null,
          episode: null,
          title: request.title,
          airDate: releaseDateOf(request, waitFor),
          state: 'waiting',
        },
      ];
    case 'series':
      return catalogue.episodes
        .filter((episode) => isSeasonWanted(request, episode.season))
        .map(({ season, episode, title, airDate }) => ({
          musicBrainzId: null,
          season,
          episode,
          title,
          airDate,
          state: isHeld(held, season, episode) ? 'available' : 'waiting',
        }));
    case 'book':
      return (request.bookFormats ?? ['ebook']).map((format) => ({
        musicBrainzId: null,
        season: null,
        episode: null,
        format,
        title: request.title,
        airDate: null,
        state: 'waiting',
      }));
    case 'artist':
    case 'album':
      return catalogue.albums
        .filter((album) =>
          request.kind === 'album'
            ? album.id === request.musicBrainzId
            : album.type !== null &&
              (request.releaseTypes ?? DEFAULT_RELEASE_TYPES).includes(album.type),
        )
        .map((album) => ({
          musicBrainzId: album.id,
          season: null,
          episode: null,
          title: album.title,
          airDate: album.firstReleased,
          state: 'waiting',
        }));
  }
};

/**
 * Brings what a request waits for into line with what it asks for and what the catalogue now says:
 * a film is one thing, held until its release; a series is each episode of the seasons it wants,
 * each held until it airs;
 * an artist is each of their albums of the kinds asked for, and any that come later; an album is
 * itself. Something the catalogue has renamed or re-dated is changed, and something no longer asked
 * for is let go, unless it is on its way or here already. An episode the library already holds is
 * added as there, and one still waited for is marked there, unless it is on its way.
 *
 * @param request - The request.
 * @param catalogue - What the catalogue knows: every episode, or every album.
 * @param items - What the request waits for now.
 * @param waitFor - What its quality profile holds a film until.
 * @param held - The episodes the library already holds.
 * @returns What to add, change, remove and mark there.
 */
const syncItems = (
  request: Pick<
    MediaRequestRecord,
    | 'kind'
    | 'title'
    | 'seasons'
    | 'followsNewSeasons'
    | 'followsAfter'
    | 'releaseDates'
    | 'musicBrainzId'
    | 'releaseTypes'
    | 'bookFormats'
  >,
  catalogue: Pick<RequestCatalogue, 'episodes' | 'albums'>,
  items: readonly RequestItemRecord[],
  waitFor: ReleaseWait = 'digital',
  held: readonly HeldEpisode[] = [],
): ItemChanges => {
  const wanted = wantedOf(request, catalogue, waitFor, held);
  const keyOf = (item: Pick<ItemDraft, 'musicBrainzId' | 'season' | 'episode' | 'format'>) =>
    item.musicBrainzId ??
    `${item.season?.toString() ?? '-'}x${item.episode?.toString() ?? '-'}${item.format ?? ''}`;
  const kept = new Map(items.map((item) => [keyOf(item), item]));
  const wantedKeys = new Set(wanted.map(keyOf));

  return {
    add: wanted.filter((draft) => !kept.has(keyOf(draft))),
    change: wanted.flatMap((draft) => {
      const item = kept.get(keyOf(draft));

      return item === undefined || (item.title === draft.title && item.airDate === draft.airDate)
        ? []
        : [{ id: item.id, changes: { title: draft.title, airDate: draft.airDate } }];
    }),
    remove: items
      .filter((item) => !wantedKeys.has(keyOf(item)) && LETTING_GO.has(item.state))
      .map((item) => item.id),
    arrive: items
      .filter(
        (item) =>
          item.season !== null &&
          LETTING_GO.has(item.state) &&
          wantedKeys.has(keyOf(item)) &&
          isHeld(held, item.season, item.episode),
      )
      .map((item) => item.id),
  };
};

export type { ItemDraft };

export { syncItems };
