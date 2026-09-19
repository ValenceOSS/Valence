import { releaseDateOf } from '@ValenceRequests/mediaRequests/releaseDateOf';
import type { CatalogueEpisode } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type ItemDraft = Pick<RequestItemRecord, 'season' | 'episode' | 'title' | 'airDate'>;

type ItemChanges = {
  add: ItemDraft[];
  change: Array<{ id: string; changes: Pick<RequestItemRecord, 'title' | 'airDate'> }>;
  remove: string[];
};

const LETTING_GO = new Set<RequestItemRecord['state']>(['waiting', 'wanted', 'failed']);

/**
 * Brings what a request waits for into line with what it asks for and what the catalogue now says:
 * a film is one thing, held until its release; a series is each episode of the seasons asked for —
 * every regular season, and any that come later, where none were named — each held until it airs.
 * An episode the catalogue has renamed or re-dated is changed, and one no longer asked for is let
 * go, unless it is on its way or here already.
 *
 * @param request - The request.
 * @param episodes - Every episode the catalogue knows of.
 * @param items - What the request waits for now.
 * @returns What to add, change and remove.
 */
const syncItems = (
  request: Pick<MediaRequestRecord, 'kind' | 'title' | 'seasons' | 'waitFor' | 'releaseDates'>,
  episodes: readonly CatalogueEpisode[],
  items: readonly RequestItemRecord[],
): ItemChanges => {
  const wanted: ItemDraft[] =
    request.kind === 'film'
      ? [{ season: null, episode: null, title: request.title, airDate: releaseDateOf(request) }]
      : episodes
          .filter((episode) =>
            request.seasons === null
              ? episode.season > 0
              : request.seasons.includes(episode.season),
          )
          .map(({ season, episode, title, airDate }) => ({ season, episode, title, airDate }));
  const keyOf = (item: Pick<ItemDraft, 'season' | 'episode'>) =>
    `${item.season?.toString() ?? '-'}x${item.episode?.toString() ?? '-'}`;
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
