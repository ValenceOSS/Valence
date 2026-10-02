/* eslint-disable valence/no-hard-coded-strings -- the source's own item types, fields, modes and element names, sent and matched rather than shown */
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { SegmentKind } from '@ValenceContracts/schemas/MediaSegment';
import { saying } from '@ValenceI18n/saying';
import {
  IntroSkipperTimestampsSchema,
  MediaBrowserFolderQuerySchema,
  MediaBrowserFoldersSchema,
  MediaBrowserItemSchema,
  MediaBrowserItemsSchema,
  MediaBrowserParentalRatingsSchema,
  MediaBrowserPlaylistSchema,
  MediaBrowserPublicInfoSchema,
  MediaBrowserSegmentsSchema,
  MediaBrowserUserQuerySchema,
  MediaBrowserUsersSchema,
} from './MediaBrowserSchemas';
import type { MediaBrowserFolder, MediaBrowserItem, MediaBrowserUser } from './MediaBrowserSchemas';
import { SourceFailure } from './SourceFailure';
import { ageCeilingOf } from './ageCeilingOf';
import { allowedRatingNames } from './allowedRatingNames';
import type { RatingStep } from './allowedRatingNames';
import { dateOf } from './dateOf';
import { isVersionAtLeast } from './isVersionAtLeast';
import { providerIdsOf } from './providerIdsOf';
import type { SourceCaller } from './createSourceCaller';
import type {
  SourceIdentity,
  SourceItem,
  SourceItemKind,
  SourceLibrary,
  SourceMarker,
  SourcePlaylist,
  SourceReader,
  SourceUser,
  SourceUserState,
} from './SourceReader';

type MediaBrowserReaderOptions = {
  kind: 'jellyfin' | 'emby';
  caller: SourceCaller;
  regions: readonly string[];
  pageSize?: number;
};

const TICKS_PER_SECOND = 10_000_000;

const PAGE_SIZE = 500;

const ITEM_KINDS: Readonly<Record<string, SourceItemKind>> = {
  movie: 'movie',
  series: 'series',
  episode: 'episode',
  musicartist: 'artist',
  musicalbum: 'album',
  audio: 'track',
};

const LIBRARY_KINDS: Readonly<Record<string, LibraryKind>> = {
  movies: 'movies',
  tvshows: 'shows',
  music: 'music',
  books: 'books',
};

const TYPES_OF_LIBRARY: Readonly<Record<LibraryKind, string>> = {
  movies: 'Movie',
  shows: 'Series,Episode',
  music: 'MusicAlbum,Audio',
  books: '',
};

const SEGMENT_KINDS: Readonly<Record<string, SegmentKind>> = {
  intro: 'intro',
  outro: 'credits',
  recap: 'recap',
  preview: 'preview',
};

const USER_STATE_TYPES = 'Movie,Episode,Audio,Series';

const STATE_FILTERS = ['IsPlayed', 'IsResumable', 'IsFavorite'] as const;

const INTRO_SKIPPER_GIVES_UP_AFTER = 5;

/**
 * Reads a Jellyfin or Emby server through its API key: the two share an ancestor and most of an
 * API, and differ in their paths, how the key is sent and which version moved what.
 *
 * @param options - Which of the two it is, how to reach it, and the certification systems its
 *   parental ratings are read in.
 * @returns The reader.
 */
const createMediaBrowserReader = ({
  kind,
  caller,
  regions,
  pageSize = PAGE_SIZE,
}: MediaBrowserReaderOptions): SourceReader => {
  const prefix = kind === 'emby' ? '/emby' : '';
  let identity: SourceIdentity | null = null;
  let everyone: MediaBrowserUser[] | null = null;
  let ratingTable: RatingStep[] | null = null;
  let folders: MediaBrowserFolder[] | null = null;
  let introSkipperMisses = 0;

  const identify = async (): Promise<SourceIdentity> => {
    if (identity !== null) {
      return identity;
    }

    const info = await caller.json(`${prefix}/System/Info/Public`, MediaBrowserPublicInfoSchema);
    const looksLikeJellyfin = (info.ProductName ?? '') !== '';

    if (kind === 'jellyfin' && !looksLikeJellyfin) {
      throw new SourceFailure(saying('server.imports.mediaBrowserReader.thisLooksLikeEmby'));
    }

    if (kind === 'emby' && looksLikeJellyfin) {
      throw new SourceFailure(saying('server.imports.mediaBrowserReader.thisLooksLikeJellyfin'));
    }

    await caller.json(`${prefix}/System/Info`, MediaBrowserPublicInfoSchema);

    identity = {
      kind,
      serverId: info.Id ?? '',
      name: info.ServerName ?? (kind === 'emby' ? 'Emby' : 'Jellyfin'),
      version: info.Version ?? '0',
    };

    return identity;
  };

  const version = async (): Promise<string> => (await identify()).version;

  const isModernJellyfin = async (major: number, minor: number): Promise<boolean> =>
    kind === 'jellyfin' && isVersionAtLeast(await version(), major, minor);

  const readUsers = async (): Promise<MediaBrowserUser[]> => {
    if (everyone !== null) {
      return everyone;
    }

    if (kind === 'jellyfin') {
      everyone = await caller.json('/Users', MediaBrowserUsersSchema);
    } else {
      const queried = await caller.jsonOrNothing('/emby/Users/Query', MediaBrowserUserQuerySchema);

      everyone = queried?.Items ?? (await caller.json('/emby/Users', MediaBrowserUsersSchema));
    }

    return everyone;
  };

  const anAdministrator = async (): Promise<string> => {
    const users = await readUsers();
    const chosen = users.find((user) => user.Policy?.IsAdministrator === true) ?? users[0];

    if (chosen === undefined) {
      throw new SourceFailure(saying('server.imports.mediaBrowserReader.thereIsNobodyOnIt'));
    }

    return chosen.Id;
  };

  const itemsPath = async (
    userId: string | null,
  ): Promise<{ path: string; query: Record<string, string> }> => {
    if (userId === null && (await isModernJellyfin(10, 9))) {
      return { path: '/Items', query: {} };
    }

    const who = userId ?? (await anAdministrator());

    if (await isModernJellyfin(10, 9)) {
      return { path: '/Items', query: { UserId: who } };
    }

    return { path: `${prefix}/Users/${encodeURIComponent(who)}/Items`, query: {} };
  };

  const readAllItems = async (
    userId: string | null,
    query: Record<string, string>,
  ): Promise<MediaBrowserItem[]> => {
    const where = await itemsPath(userId);
    const found: MediaBrowserItem[] = [];

    for (let start = 0; ; start += pageSize) {
      const page = await caller.json(where.path, MediaBrowserItemsSchema, {
        query: {
          ...where.query,
          ...query,
          StartIndex: start.toString(),
          Limit: pageSize.toString(),
          EnableImages: 'false',
        },
      });

      found.push(...page.Items);

      if (page.Items.length < pageSize || found.length >= (page.TotalRecordCount ?? Infinity)) {
        return found;
      }
    }
  };

  const readFolders = async (): Promise<MediaBrowserFolder[]> => {
    if (folders !== null) {
      return folders;
    }

    if (kind === 'jellyfin') {
      folders = await caller.json('/Library/VirtualFolders', MediaBrowserFoldersSchema);
    } else {
      const queried = await caller.jsonOrNothing(
        '/emby/Library/VirtualFolders/Query',
        MediaBrowserFolderQuerySchema,
      );

      folders =
        queried?.Items ??
        (await caller.json('/emby/Library/VirtualFolders', MediaBrowserFoldersSchema));
    }

    return folders;
  };

  const folderIdOf = (folder: MediaBrowserFolder): string =>
    folder.ItemId ?? folder.Id ?? folder.Guid ?? folder.Name ?? '';

  const readRatingTable = async (): Promise<RatingStep[]> => {
    if (ratingTable !== null) {
      return ratingTable;
    }

    const read = await caller.jsonOrNothing(
      `${prefix}/Localization/ParentalRatings`,
      MediaBrowserParentalRatingsSchema,
    );

    ratingTable = (read ?? []).map((rating) => ({
      name: rating.Name,
      score: rating.RatingScore?.score ?? rating.Value ?? null,
      subScore: rating.RatingScore?.subScore ?? null,
    }));

    return ratingTable;
  };

  const sourceItemOf = (item: MediaBrowserItem, libraryId: string | null): SourceItem => {
    const itemKind = ITEM_KINDS[item.Type.toLowerCase()] ?? 'other';

    return {
      id: item.Id,
      kind: itemKind,
      libraryId,
      title: item.Name ?? '',
      year: item.ProductionYear ?? null,
      path: item.Path ?? null,
      ids: providerIdsOf(item.ProviderIds),
      seriesId: item.SeriesId ?? null,
      seasonNumber: itemKind === 'episode' ? (item.ParentIndexNumber ?? null) : null,
      episodeNumber: itemKind === 'episode' ? (item.IndexNumber ?? null) : null,
      albumId: item.AlbumId ?? null,
      discNumber: itemKind === 'track' ? (item.ParentIndexNumber ?? null) : null,
      trackNumber: itemKind === 'track' ? (item.IndexNumber ?? null) : null,
      durationSeconds:
        item.RunTimeTicks === null || item.RunTimeTicks === undefined
          ? null
          : item.RunTimeTicks / TICKS_PER_SECOND,
      addedAt: dateOf(item.DateCreated),
    };
  };

  const userOf = async (user: MediaBrowserUser): Promise<SourceUser> => {
    const policy = user.Policy;
    const blocked = new Set(policy?.BlockedMediaFolders ?? []);
    const enabled = policy?.EnabledFolders ?? [];
    const libraryAccess =
      policy?.EnableAllFolders === false
        ? { kind: 'only' as const, libraryIds: enabled }
        : blocked.size > 0
          ? {
              kind: 'only' as const,
              libraryIds: (await readFolders()).map(folderIdOf).filter((id) => !blocked.has(id)),
            }
          : { kind: 'all' as const };
    const maximum = policy?.MaxParentalRating ?? null;
    const unrated = new Set((policy?.BlockUnratedItems ?? []).map((one) => one.toLowerCase()));
    const ceiling =
      maximum === null
        ? null
        : {
            maximumAge: ageCeilingOf(
              allowedRatingNames(
                await readRatingTable(),
                maximum,
                policy?.MaxParentalSubRating ?? null,
              ),
              regions,
            ),
            allowsUnrated: !unrated.has('movie') && !unrated.has('series'),
          };
    const tag = user.PrimaryImageTag ?? null;
    const avatarUrl =
      tag === null
        ? null
        : (await isModernJellyfin(10, 9))
          ? `/UserImage?userId=${encodeURIComponent(user.Id)}&tag=${encodeURIComponent(tag)}`
          : `${prefix}/Users/${encodeURIComponent(user.Id)}/Images/Primary?tag=${encodeURIComponent(tag)}`;

    return {
      id: user.Id,
      name: user.Name ?? user.Id,
      username: user.Name ?? null,
      email: null,
      isAdministrator: policy?.IsAdministrator === true,
      isDisabled: policy?.IsDisabled === true,
      access: 'readable',
      libraryAccess,
      ceiling,
      avatarUrl,
    };
  };

  const introSkipperMarkers = async (itemId: string): Promise<SourceMarker[]> => {
    if (introSkipperMisses >= INTRO_SKIPPER_GIVES_UP_AFTER) {
      return [];
    }

    const found: SourceMarker[] = [];

    for (const [mode, segment] of [
      ['Introduction', 'intro'],
      ['Credits', 'credits'],
    ] as const) {
      const read = await caller
        .jsonOrNothing(
          `/Episode/${encodeURIComponent(itemId)}/IntroTimestamps/v1`,
          IntroSkipperTimestampsSchema,
          { query: { mode } },
        )
        .catch(() => null);

      if (read === null) {
        introSkipperMisses += mode === 'Introduction' ? 1 : 0;

        continue;
      }

      introSkipperMisses = 0;

      if (read.Valid !== false && read.IntroEnd > read.IntroStart) {
        found.push({ kind: segment, startSeconds: read.IntroStart, endSeconds: read.IntroEnd });
      }
    }

    return found;
  };

  const chapterMarkers = async (item: SourceItem): Promise<SourceMarker[]> => {
    const admin = await anAdministrator();
    const read = await caller.jsonOrNothing(
      `${prefix}/Users/${encodeURIComponent(admin)}/Items/${encodeURIComponent(item.id)}`,
      MediaBrowserItemSchema,
      { query: { Fields: 'Chapters' } },
    );
    const at = (type: string): number | null => {
      const chapter = (read?.Chapters ?? []).find(
        (one) => (one.MarkerType ?? '').toLowerCase() === type,
      );

      return chapter === undefined ? null : chapter.StartPositionTicks / TICKS_PER_SECOND;
    };
    const found: SourceMarker[] = [];
    const introStart = at('introstart');
    const introEnd = at('introend');
    const creditsStart = at('creditsstart');
    const end =
      read?.RunTimeTicks === null || read?.RunTimeTicks === undefined
        ? item.durationSeconds
        : read.RunTimeTicks / TICKS_PER_SECOND;

    if (introStart !== null && introEnd !== null && introEnd > introStart) {
      found.push({ kind: 'intro', startSeconds: introStart, endSeconds: introEnd });
    }

    if (creditsStart !== null && end !== null && end > creditsStart) {
      found.push({ kind: 'credits', startSeconds: creditsStart, endSeconds: end });
    }

    return found;
  };

  const playlistEntries = async (playlistId: string, ownerId: string): Promise<string[]> => {
    const found: string[] = [];

    for (let start = 0; ; start += pageSize) {
      const page = await caller.json(
        `${prefix}/Playlists/${encodeURIComponent(playlistId)}/Items`,
        MediaBrowserItemsSchema,
        {
          query: {
            UserId: ownerId,
            StartIndex: start.toString(),
            Limit: pageSize.toString(),
            Fields: 'ProviderIds,Path',
            EnableImages: 'false',
          },
        },
      );

      found.push(...page.Items.map((item) => item.Id));

      if (page.Items.length < pageSize || found.length >= (page.TotalRecordCount ?? Infinity)) {
        return found;
      }
    }
  };

  return {
    identify,

    users: async () => Promise.all((await readUsers()).map(userOf)),

    libraries: async () =>
      (await readFolders()).map((folder) => ({
        id: folderIdOf(folder),
        name: folder.Name ?? folderIdOf(folder),
        kind: LIBRARY_KINDS[(folder.CollectionType ?? '').toLowerCase()] ?? null,
        locations: folder.Locations ?? [],
      })),

    items: async (library: SourceLibrary) => {
      const types = library.kind === null ? '' : TYPES_OF_LIBRARY[library.kind];

      if (types === '') {
        return [];
      }

      const items = await readAllItems(null, {
        ParentId: library.id,
        Recursive: 'true',
        IncludeItemTypes: types,
        Fields: 'ProviderIds,Path,DateCreated,ParentId',
      });

      return items.map((item) => sourceItemOf(item, library.id));
    },

    userStates: async (user: SourceUser) => {
      const byItem = new Map<string, SourceUserState>();

      for (const filter of STATE_FILTERS) {
        const items = await readAllItems(user.id, {
          Recursive: 'true',
          Filters: filter,
          IncludeItemTypes: USER_STATE_TYPES,
          Fields: 'ProviderIds,Path',
          EnableUserData: 'true',
        });

        for (const item of items) {
          const data = item.UserData;

          if (data === null || data === undefined) {
            continue;
          }

          byItem.set(item.Id, {
            itemId: item.Id,
            isPlayed: data.Played === true,
            playCount: data.PlayCount ?? 0,
            lastPlayedAt: dateOf(data.LastPlayedDate),
            positionSeconds: (data.PlaybackPositionTicks ?? 0) / TICKS_PER_SECOND,
            isFavourite: data.IsFavorite === true,
            rating: data.Rating ?? null,
          });
        }
      }

      return [...byItem.values()];
    },

    plays: () => Promise.resolve([]),

    favouriteArtists: async (user: SourceUser) => {
      const artists = await readAllItems(user.id, {
        Recursive: 'true',
        Filters: 'IsFavorite',
        IncludeItemTypes: 'MusicArtist',
        Fields: 'ProviderIds',
      });

      return artists.map((artist) => ({
        name: artist.Name ?? '',
        musicBrainzId: providerIdsOf(artist.ProviderIds).musicBrainzArtist,
      }));
    },

    collections: async () => {
      const boxSets = await readAllItems(null, {
        Recursive: 'true',
        IncludeItemTypes: 'BoxSet',
        Fields: 'ProviderIds,Overview',
      });
      const admin = await anAdministrator();
      const collections = [];

      for (const boxSet of boxSets) {
        const entries = await readAllItems(admin, {
          ParentId: boxSet.Id,
          Fields: 'ProviderIds,Path',
        });

        collections.push({
          id: boxSet.Id,
          name: boxSet.Name ?? boxSet.Id,
          description: boxSet.Overview ?? null,
          itemIds: entries.map((entry) => entry.Id),
        });
      }

      return collections;
    },

    playlists: async (users: readonly SourceUser[]) => {
      const seenBy = new Map<string, { name: string; userIds: string[] }>();

      for (const user of users) {
        const lists = await readAllItems(user.id, {
          Recursive: 'true',
          IncludeItemTypes: 'Playlist',
        });

        for (const list of lists) {
          const known = seenBy.get(list.Id) ?? { name: list.Name ?? list.Id, userIds: [] };

          known.userIds.push(user.id);
          seenBy.set(list.Id, known);
        }
      }

      const byOwner = new Map<string, SourcePlaylist[]>();
      const sharesAreReadable = await isModernJellyfin(10, 9);

      for (const [playlistId, { name, userIds }] of seenBy) {
        const sharing = sharesAreReadable
          ? await caller
              .jsonOrNothing(
                `/Playlists/${encodeURIComponent(playlistId)}`,
                MediaBrowserPlaylistSchema,
              )
              .catch(() => null)
          : null;
        const sharedWith = new Set((sharing?.Shares ?? []).map((share) => share.UserId));
        const candidates = userIds.filter((id) => !sharedWith.has(id));
        const owner =
          candidates.length === 1
            ? candidates[0]
            : (users.find((user) => candidates.includes(user.id) && user.isAdministrator)?.id ??
              candidates[0] ??
              userIds[0]);

        if (owner === undefined) {
          continue;
        }

        const itemIds = await playlistEntries(playlistId, owner);
        const theirs = byOwner.get(owner) ?? [];

        theirs.push({
          id: playlistId,
          name,
          isShared: sharing?.OpenAccess === true || sharedWith.size > 0 || userIds.length > 1,
          itemIds,
        });
        byOwner.set(owner, theirs);
      }

      return byOwner;
    },

    markers: async (item: SourceItem) => {
      if (item.kind !== 'movie' && item.kind !== 'episode') {
        return [];
      }

      if (kind === 'emby') {
        return chapterMarkers(item);
      }

      if (await isModernJellyfin(10, 10)) {
        const read = await caller.jsonOrNothing(
          `/MediaSegments/${encodeURIComponent(item.id)}`,
          MediaBrowserSegmentsSchema,
        );

        return (read?.Items ?? []).flatMap((segment) => {
          const segmentKind = SEGMENT_KINDS[segment.Type.toLowerCase()];
          const startSeconds = segment.StartTicks / TICKS_PER_SECOND;
          const endSeconds = segment.EndTicks / TICKS_PER_SECOND;

          return segmentKind === undefined || endSeconds <= startSeconds
            ? []
            : [{ kind: segmentKind, startSeconds, endSeconds }];
        });
      }

      return item.kind === 'episode' ? introSkipperMarkers(item.id) : [];
    },

    avatar: async (user: SourceUser) =>
      user.avatarUrl === null ? null : caller.picture(user.avatarUrl),
  };
};

export { createMediaBrowserReader };
