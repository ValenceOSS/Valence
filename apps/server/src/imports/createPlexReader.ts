/* eslint-disable valence/no-hard-coded-strings -- the source's own item types, fields, modes and element names, sent and matched rather than shown */
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import {
  PlexAccountsSchema,
  PlexIdentitySchema,
  PlexMetadataPageSchema,
  PlexRootSchema,
  PlexSectionsSchema,
} from './PlexSchemas';
import type { PlexMetadata } from './PlexSchemas';
import { dateOf } from './dateOf';
import { plexCeilingOf } from './plexCeilingOf';
import { plexIdsOf } from './plexIdsOf';
import { readPlexPeople } from './readPlexPeople';
import type { PlexPerson } from './readPlexPeople';
import { resolvePlexHomeToken } from './resolvePlexHomeToken';
import type { SourceCaller } from './createSourceCaller';
import type {
  SourceCollection,
  SourceIdentity,
  SourceIds,
  SourceItem,
  SourceItemKind,
  SourceLibrary,
  SourceMarker,
  SourcePlay,
  SourcePlaylist,
  SourceReader,
  SourceUser,
  SourceUserState,
} from './SourceReader';

type PlexReaderOptions = {
  server: SourceCaller;
  plexTv: SourceCaller;
  ownerToken: string;
  userTokens: Readonly<Record<string, string>>;
  regions: readonly string[];
  pageSize?: number;
};

const PAGE_SIZE = 500;

const OWNER_ACCOUNT = '1';

const LIBRARY_KINDS: Readonly<Record<string, LibraryKind>> = {
  movie: 'movies',
  show: 'shows',
  artist: 'music',
};

const CATALOGUE_TYPES: Readonly<Record<LibraryKind, readonly number[]>> = {
  movies: [1],
  shows: [2, 4],
  music: [9, 10],
  books: [],
};

const STATE_TYPES: Readonly<Record<LibraryKind, readonly number[]>> = {
  movies: [1],
  shows: [2, 4],
  music: [10],
  books: [],
};

const ITEM_KINDS: Readonly<Record<string, SourceItemKind>> = {
  movie: 'movie',
  show: 'series',
  episode: 'episode',
  artist: 'artist',
  album: 'album',
  track: 'track',
};

const MUSIC_ID_FIELDS: Readonly<Record<string, keyof SourceIds>> = {
  album: 'musicBrainzAlbum',
  track: 'musicBrainzTrack',
  artist: 'musicBrainzArtist',
};

/**
 * Reads a Plex Media Server through the owner's token on its own address, and plex.tv for the
 * people it is shared with, reading each person's own watch state with the token plex.tv holds for
 * them on this server.
 *
 * @param options - How to reach the server and plex.tv, the tokens already resolved for Home
 *   members with a PIN, and the certification systems ratings are read in.
 * @returns The reader.
 */
const createPlexReader = ({
  server,
  plexTv,
  ownerToken,
  userTokens,
  regions,
  pageSize = PAGE_SIZE,
}: PlexReaderOptions): SourceReader => {
  let identity: SourceIdentity | null = null;
  let people: PlexPerson[] | null = null;
  let sections: SourceLibrary[] | null = null;
  const tokens = new Map<string, string>(Object.entries(userTokens));

  const identify = async (): Promise<SourceIdentity> => {
    if (identity !== null) {
      return identity;
    }

    const found = await server.json('/identity', PlexIdentitySchema);
    const root = await server.json('/', PlexRootSchema);

    identity = {
      kind: 'plex',
      serverId: found.MediaContainer.machineIdentifier,
      name: root.MediaContainer.friendlyName ?? 'Plex',
      version: found.MediaContainer.version ?? '0',
    };

    return identity;
  };

  const readPeople = async (): Promise<PlexPerson[]> => {
    if (people !== null) {
      return people;
    }

    const { serverId } = await identify();

    people = await readPlexPeople(plexTv, serverId).catch(async () => {
      const accounts = await server.jsonOrNothing('/accounts', PlexAccountsSchema);

      return (accounts?.MediaContainer.Account ?? [])
        .filter((account) => account.id > 0)
        .map((account) => ({
          id: account.id.toString(),
          name: account.name ?? account.id.toString(),
          username: account.name ?? null,
          email: null,
          thumb: null,
          isOwner: account.id.toString() === OWNER_ACCOUNT,
          isHome: false,
          isProtected: false,
          restrictionProfile: null,
          filterMovies: null,
          filterTelevision: null,
          sharedToken: null,
          libraryKeys: 'all' as const,
        }));
    });

    return people;
  };

  const tokenOf = async (user: SourceUser): Promise<string | null> => {
    const person = (await readPeople()).find((one) => one.id === user.id);

    if (person === undefined) {
      return null;
    }

    if (person.isOwner) {
      return ownerToken;
    }

    const known = tokens.get(person.id) ?? person.sharedToken;

    if (known !== null) {
      return known;
    }

    if (!person.isHome || person.isProtected) {
      return null;
    }

    const resolved = await resolvePlexHomeToken(
      plexTv,
      (await identify()).serverId,
      person.id,
      null,
    ).catch(() => null);

    if (resolved !== null) {
      tokens.set(person.id, resolved);
    }

    return resolved;
  };

  const readAll = async (
    path: string,
    query: Record<string, string>,
    token: string,
  ): Promise<PlexMetadata[]> => {
    const found: PlexMetadata[] = [];

    for (let start = 0; ; start += pageSize) {
      const page = await server.json(path, PlexMetadataPageSchema, {
        query: {
          ...query,
          'X-Plex-Container-Start': start.toString(),
          'X-Plex-Container-Size': pageSize.toString(),
        },
        headers: {
          'X-Plex-Token': token,
          'X-Plex-Container-Start': start.toString(),
          'X-Plex-Container-Size': pageSize.toString(),
        },
      });
      const metadata = page.MediaContainer.Metadata ?? [];

      found.push(...metadata);

      if (
        metadata.length < pageSize ||
        found.length >= (page.MediaContainer.totalSize ?? Infinity)
      ) {
        return found;
      }
    }
  };

  const readSections = async (): Promise<SourceLibrary[]> => {
    if (sections !== null) {
      return sections;
    }

    const read = await server.json('/library/sections', PlexSectionsSchema);

    sections = (read.MediaContainer.Directory ?? []).map((directory) => ({
      id: directory.key,
      name: directory.title ?? directory.key,
      kind: LIBRARY_KINDS[directory.type] ?? null,
      locations: (directory.Location ?? []).map((location) => location.path),
    }));

    return sections;
  };

  const itemOf = (metadata: PlexMetadata, libraryId: string | null): SourceItem => {
    const type = metadata.type ?? '';
    const kind = ITEM_KINDS[type] ?? 'other';

    return {
      id: metadata.ratingKey,
      kind,
      libraryId,
      title: metadata.title ?? '',
      year: metadata.year ?? null,
      path: metadata.Media?.[0]?.Part?.[0]?.file ?? null,
      ids: plexIdsOf(
        { guid: metadata.guid ?? undefined, Guid: metadata.Guid ?? undefined },
        MUSIC_ID_FIELDS[type] ?? null,
      ),
      seriesId: kind === 'episode' ? (metadata.grandparentRatingKey ?? null) : null,
      seasonNumber: kind === 'episode' ? (metadata.parentIndex ?? null) : null,
      episodeNumber: kind === 'episode' ? (metadata.index ?? null) : null,
      albumId: kind === 'track' ? (metadata.parentRatingKey ?? null) : null,
      discNumber: kind === 'track' ? (metadata.parentIndex ?? null) : null,
      trackNumber: kind === 'track' ? (metadata.index ?? null) : null,
      durationSeconds:
        metadata.duration === null || metadata.duration === undefined
          ? null
          : metadata.duration / 1000,
      addedAt: dateOf(metadata.addedAt),
    };
  };

  const userOf = (person: PlexPerson, token: string | null): SourceUser => ({
    id: person.id,
    name: person.name,
    username: person.username,
    email: person.email,
    isAdministrator: person.isOwner,
    isDisabled: false,
    access:
      token !== null || person.isOwner || (person.isHome && !person.isProtected)
        ? 'readable'
        : person.isHome && person.isProtected
          ? 'needsPin'
          : 'unreadable',
    libraryAccess:
      person.isOwner || person.libraryKeys === 'all'
        ? { kind: 'all' }
        : { kind: 'only', libraryIds: person.libraryKeys },
    ceiling: person.isOwner
      ? null
      : plexCeilingOf(
          {
            filterMovies: person.filterMovies,
            filterTelevision: person.filterTelevision,
            restrictionProfile: person.restrictionProfile,
          },
          regions,
        ),
    avatarUrl: person.thumb,
  });

  return {
    identify,

    users: async () =>
      (await readPeople()).map((person) =>
        userOf(person, tokens.get(person.id) ?? person.sharedToken),
      ),

    libraries: readSections,

    items: async (library: SourceLibrary) => {
      const items: SourceItem[] = [];

      for (const type of library.kind === null ? [] : CATALOGUE_TYPES[library.kind]) {
        const metadata = await readAll(
          `/library/sections/${encodeURIComponent(library.id)}/all`,
          { type: type.toString(), includeGuids: '1' },
          ownerToken,
        );

        items.push(...metadata.map((one) => itemOf(one, library.id)));
      }

      return items;
    },

    userStates: async (user: SourceUser) => {
      const token = await tokenOf(user);

      if (token === null) {
        return [];
      }

      const states: SourceUserState[] = [];

      for (const library of await readSections()) {
        for (const type of library.kind === null ? [] : STATE_TYPES[library.kind]) {
          const metadata = await readAll(
            `/library/sections/${encodeURIComponent(library.id)}/all`,
            { type: type.toString() },
            token,
          );

          for (const one of metadata) {
            const viewCount = one.viewCount ?? 0;
            const offset = one.viewOffset ?? 0;
            const rating = one.userRating ?? null;

            if (viewCount === 0 && offset === 0 && rating === null) {
              continue;
            }

            states.push({
              itemId: one.ratingKey,
              isPlayed: one.type !== 'show' && viewCount > 0,
              playCount: one.type === 'show' ? 0 : viewCount,
              lastPlayedAt: dateOf(one.lastViewedAt),
              positionSeconds: offset / 1000,
              isFavourite: false,
              rating,
            });
          }
        }
      }

      return states;
    },

    plays: async (user: SourceUser) => {
      const person = (await readPeople()).find((one) => one.id === user.id);
      const accountId = person?.isOwner === true ? OWNER_ACCOUNT : user.id;
      const history = await readAll(
        '/status/sessions/history/all',
        { accountID: accountId, sort: 'viewedAt:desc' },
        ownerToken,
      ).catch(() => []);

      return history.flatMap((entry): SourcePlay[] => {
        const at = dateOf(entry.viewedAt);

        return at === null
          ? []
          : [
              {
                key:
                  entry.historyKey ?? `${accountId}:${entry.ratingKey}:${at.getTime().toString()}`,
                itemId: entry.ratingKey,
                at,
              },
            ];
      });
    },

    favouriteArtists: () => Promise.resolve([]),

    collections: async () => {
      const collections: SourceCollection[] = [];

      for (const library of await readSections()) {
        if (library.kind === null) {
          continue;
        }

        const found = await readAll(
          `/library/sections/${encodeURIComponent(library.id)}/collections`,
          {},
          ownerToken,
        );

        for (const collection of found) {
          const children = await readAll(
            `/library/collections/${encodeURIComponent(collection.ratingKey)}/children`,
            {},
            ownerToken,
          );

          collections.push({
            id: collection.ratingKey,
            name: collection.title ?? collection.ratingKey,
            description: collection.summary ?? null,
            itemIds: children.map((child) => child.ratingKey),
          });
        }
      }

      return collections;
    },

    playlists: async (users: readonly SourceUser[]) => {
      const byOwner = new Map<string, SourcePlaylist[]>();

      for (const user of users) {
        const token = await tokenOf(user);

        if (token === null) {
          continue;
        }

        const lists = await readAll('/playlists', {}, token);
        const theirs: SourcePlaylist[] = [];

        for (const list of lists) {
          if (list.playlistType === 'photo') {
            continue;
          }

          const entries = await readAll(
            `/playlists/${encodeURIComponent(list.ratingKey)}/items`,
            {},
            token,
          );

          theirs.push({
            id: list.ratingKey,
            name: list.title ?? list.ratingKey,
            isShared: false,
            itemIds: entries.map((entry) => entry.ratingKey),
          });
        }

        if (theirs.length > 0) {
          byOwner.set(user.id, theirs);
        }
      }

      return byOwner;
    },

    markers: async (item: SourceItem) => {
      if (item.kind !== 'movie' && item.kind !== 'episode') {
        return [];
      }

      const read = await server.jsonOrNothing(
        `/library/metadata/${encodeURIComponent(item.id)}`,
        PlexMetadataPageSchema,
        { query: { includeMarkers: '1' } },
      );
      const metadata = read?.MediaContainer.Metadata?.[0];
      const end = (metadata?.duration ?? (item.durationSeconds ?? 0) * 1000) / 1000;

      return (metadata?.Marker ?? []).flatMap((marker): SourceMarker[] => {
        const type = marker.type.toLowerCase();
        const kind = type === 'intro' ? 'intro' : type.startsWith('credit') ? 'credits' : null;
        const startSeconds = marker.startTimeOffset / 1000;
        const endSeconds =
          marker.final === true && kind === 'credits' && end > 0
            ? end
            : marker.endTimeOffset / 1000;

        return kind === null || endSeconds <= startSeconds
          ? []
          : [{ kind, startSeconds, endSeconds }];
      });
    },

    avatar: async (user: SourceUser) =>
      user.avatarUrl === null ? null : plexTv.picture(user.avatarUrl),
  };
};

export { createPlexReader };
