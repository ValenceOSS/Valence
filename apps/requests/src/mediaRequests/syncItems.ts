import { DEFAULT_RELEASE_TYPES } from '@ValenceContracts/schemas/MediaRequest';
import { isSeasonWanted } from '@ValenceRequests/mediaRequests/isSeasonWanted';
import { releaseDateOf } from '@ValenceRequests/mediaRequests/releaseDateOf';
import type { ReleaseWait } from '@ValenceContracts/schemas/QualityProfile';
import type {
  HeldAlbum,
  HeldEpisode,
  RequestCatalogue,
} from '@ValenceContracts/schemas/MediaRequest';
import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type ItemDraft = Pick<
  RequestItemRecord,
  | 'musicBrainzId'
  | 'season'
  | 'episode'
  | 'format'
  | 'versionProfileId'
  | 'title'
  | 'airDate'
  | 'trackCount'
  | 'heldQuality'
  | 'narration'
> & { state: Extract<RequestItemRecord['state'], 'waiting' | 'available'> };

type ItemChanges = {
  add: ItemDraft[];
  change: Array<{
    id: string;
    changes: Partial<
      Pick<RequestItemRecord, 'title' | 'airDate' | 'trackCount' | 'heldQuality' | 'state'>
    >;
  }>;
  remove: string[];
  arrive: string[];
};

const LOSSLESS = new Set<MusicQuality>(['flac24', 'flac', 'alac']);

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
 * How the library's own copy of an album stands with a request: here, where it is good enough, or
 * a rung to climb from, where the request upgrades lossy copies to lossless and this one is lossy.
 *
 * @param request - Whether it upgrades to lossless.
 * @param heldAlbums - The albums the library holds, each at its quality.
 * @param musicBrainzId - The album's release group.
 * @returns Whether it is here, the quality to climb from, or nothing where it is not held.
 */
const standingOfHeld = (
  request: Pick<MediaRequestRecord, 'upgradesToLossless'>,
  heldAlbums: readonly HeldAlbum[],
  musicBrainzId: string | null,
): { isHere: true } | { isHere: false; quality: MusicQuality } | null => {
  const held = heldAlbums.find((album) => album.id === musicBrainzId);

  if (held === undefined) {
    return null;
  }

  return request.upgradesToLossless === true && !LOSSLESS.has(held.quality)
    ? { isHere: false, quality: held.quality }
    : { isHere: true };
};

/**
 * Everything a request asks for, by what the catalogue says: the film, and each further version of
 * it kept at a profile of its own; the episodes of the seasons asked for; the artist's albums of the
 * kinds asked for; the album; or the book, once in each format asked for — the ebook, the
 * audiobook or both, the audiobook once in each narration chosen — each wanted at once, since a
 * book has no release to wait for.
 *
 * An episode or album the library already holds is asked for as already there, so nothing searches
 * for it — unless the request upgrades lossy albums to lossless and the library's copy is lossy,
 * when that copy is the quality to climb from. A single whose every track is on one of the artist's
 * albums is not asked for at all.
 *
 * @param request - The request.
 * @param catalogue - What the catalogue knows.
 * @param waitFor - What its quality profile holds a film until.
 * @param held - The episodes the library already holds.
 * @param heldAlbums - The albums the library already holds, each at its quality.
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
    | 'versions'
    | 'upgradesToLossless'
    | 'narrationsWanted'
  >,
  catalogue: Pick<RequestCatalogue, 'episodes' | 'albums'>,
  waitFor: ReleaseWait,
  held: readonly HeldEpisode[],
  heldAlbums: readonly HeldAlbum[],
): ItemDraft[] => {
  switch (request.kind) {
    case 'film':
      return [null, ...(request.versions ?? [])].map((versionProfileId) => ({
        musicBrainzId: null,
        season: null,
        episode: null,
        versionProfileId,
        title: request.title,
        airDate: releaseDateOf(request, waitFor),
        state: 'waiting',
      }));
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
      return (request.bookFormats ?? ['ebook']).flatMap((format) =>
        (format === 'audiobook' && (request.narrationsWanted ?? []).length > 0
          ? (request.narrationsWanted ?? [])
          : [null]
        ).map((narration) => ({
          musicBrainzId: null,
          season: null,
          episode: null,
          format,
          narration,
          title: request.title,
          airDate: null,
          state: 'waiting' as const,
        })),
      );
    case 'artist':
    case 'album':
      return catalogue.albums
        .filter((album) =>
          request.kind === 'album'
            ? album.id === request.musicBrainzId
            : album.type !== null &&
              album.isOnAnAlbum !== true &&
              (request.releaseTypes ?? DEFAULT_RELEASE_TYPES).includes(album.type),
        )
        .map((album) => {
          const standing = standingOfHeld(request, heldAlbums, album.id);

          return {
            musicBrainzId: album.id,
            season: null,
            episode: null,
            title: album.title,
            airDate: album.firstReleased,
            trackCount: album.trackCount ?? null,
            heldQuality: standing === null || standing.isHere ? null : standing.quality,
            state: standing?.isHere === true ? 'available' : 'waiting',
          };
        });
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
    | 'versions'
    | 'upgradesToLossless'
    | 'narrationsWanted'
  >,
  catalogue: Pick<RequestCatalogue, 'episodes' | 'albums'>,
  items: readonly RequestItemRecord[],
  waitFor: ReleaseWait = 'digital',
  held: readonly HeldEpisode[] = [],
  heldAlbums: readonly HeldAlbum[] = [],
): ItemChanges => {
  const wanted = wantedOf(request, catalogue, waitFor, held, heldAlbums);
  const keyOf = (
    item: Pick<
      ItemDraft,
      'musicBrainzId' | 'season' | 'episode' | 'format' | 'versionProfileId' | 'narration'
    >,
  ) =>
    item.musicBrainzId ??
    `${item.season?.toString() ?? '-'}x${item.episode?.toString() ?? '-'}${item.format ?? ''}${item.versionProfileId ?? ''}${item.narration ?? ''}`;
  const kept = new Map(items.map((item) => [keyOf(item), item]));
  const wantedKeys = new Set(wanted.map(keyOf));

  return {
    add: wanted.filter((draft) => !kept.has(keyOf(draft))),
    change: wanted.flatMap((draft) => {
      const item = kept.get(keyOf(draft));

      if (item === undefined) {
        return [];
      }

      const standing = standingOfHeld(request, heldAlbums, item.musicBrainzId);
      const isClimbing =
        standing !== null &&
        !standing.isHere &&
        item.filePath === null &&
        (item.state === 'available' || LETTING_GO.has(item.state));
      const changes = {
        ...(item.title === draft.title && item.airDate === draft.airDate
          ? {}
          : { title: draft.title, airDate: draft.airDate }),
        ...((item.trackCount ?? null) === (draft.trackCount ?? null)
          ? {}
          : { trackCount: draft.trackCount ?? null }),
        ...(isClimbing && (item.heldQuality ?? null) !== standing.quality
          ? { heldQuality: standing.quality }
          : {}),
        ...(isClimbing && item.state === 'available' ? { state: 'wanted' as const } : {}),
      };

      return Object.keys(changes).length === 0 ? [] : [{ id: item.id, changes }];
    }),
    remove: items
      .filter((item) => !wantedKeys.has(keyOf(item)) && LETTING_GO.has(item.state))
      .map((item) => item.id),
    arrive: items
      .filter(
        (item) =>
          LETTING_GO.has(item.state) &&
          wantedKeys.has(keyOf(item)) &&
          (item.season === null
            ? standingOfHeld(request, heldAlbums, item.musicBrainzId)?.isHere === true
            : isHeld(held, item.season, item.episode)),
      )
      .map((item) => item.id),
  };
};

export type { ItemDraft };

export { syncItems };
