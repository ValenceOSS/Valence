import { releaseDateOf } from '@ValenceRequests/mediaRequests/releaseDateOf';
import type { ReleaseWait } from '@ValenceContracts/schemas/QualityProfile';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type ItemDraft = Pick<
  RequestItemRecord,
  'musicBrainzId' | 'season' | 'episode' | 'title' | 'airDate'
>;

type ItemChanges = {
  add: ItemDraft[];
  change: Array<{ id: string; changes: Pick<RequestItemRecord, 'title' | 'airDate'> }>;
  remove: string[];
};

const LETTING_GO = new Set<RequestItemRecord['state']>(['waiting', 'wanted', 'failed']);

/**
 * Everything a request asks for, by what the catalogue says: the film, the episodes of the seasons
 * asked for, the artist's albums of the kinds asked for, or the album.
 *
 * @param request - The request.
 * @param catalogue - What the catalogue knows.
 * @param waitFor - What its quality profile holds a film until.
 * @returns What it asks for.
 */
const wantedOf = (
  request: Pick<
    MediaRequestRecord,
    'kind' | 'title' | 'seasons' | 'releaseDates' | 'musicBrainzId' | 'releaseTypes'
  >,
  catalogue: Pick<RequestCatalogue, 'episodes' | 'albums'>,
  waitFor: ReleaseWait,
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
        },
      ];
    case 'series':
      return catalogue.episodes
        .filter((episode) =>
          request.seasons === null ? episode.season > 0 : request.seasons.includes(episode.season),
        )
        .map(({ season, episode, title, airDate }) => ({
          musicBrainzId: null,
          season,
          episode,
          title,
          airDate,
        }));
    case 'artist':
    case 'album':
      return catalogue.albums
        .filter((album) =>
          request.kind === 'album'
            ? album.id === request.musicBrainzId
            : album.type !== null && (request.releaseTypes ?? ['album']).includes(album.type),
        )
        .map((album) => ({
          musicBrainzId: album.id,
          season: null,
          episode: null,
          title: album.title,
          airDate: album.firstReleased,
        }));
  }
};

/**
 * Brings what a request waits for into line with what it asks for and what the catalogue now says:
 * a film is one thing, held until its release; a series is each episode of the seasons asked for —
 * every regular season, and any that come later, where none were named — each held until it airs;
 * an artist is each of their albums of the kinds asked for, and any that come later; an album is
 * itself. Something the catalogue has renamed or re-dated is changed, and something no longer asked
 * for is let go, unless it is on its way or here already.
 *
 * @param request - The request.
 * @param catalogue - What the catalogue knows: every episode, or every album.
 * @param items - What the request waits for now.
 * @param waitFor - What its quality profile holds a film until.
 * @returns What to add, change and remove.
 */
const syncItems = (
  request: Pick<
    MediaRequestRecord,
    'kind' | 'title' | 'seasons' | 'releaseDates' | 'musicBrainzId' | 'releaseTypes'
  >,
  catalogue: Pick<RequestCatalogue, 'episodes' | 'albums'>,
  items: readonly RequestItemRecord[],
  waitFor: ReleaseWait = 'digital',
): ItemChanges => {
  const wanted = wantedOf(request, catalogue, waitFor);
  const keyOf = (item: Pick<ItemDraft, 'musicBrainzId' | 'season' | 'episode'>) =>
    item.musicBrainzId ?? `${item.season?.toString() ?? '-'}x${item.episode?.toString() ?? '-'}`;
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
  };
};

export type { ItemDraft };

export { syncItems };
