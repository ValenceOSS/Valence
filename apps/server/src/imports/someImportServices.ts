import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { Said } from '@ValenceI18n/SaidSchema';
import { collection, library as libraryTable, user, viewerProfile } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { createDatabaseFavouriteService } from '@ValenceServer/favourites/createDatabaseFavouriteService';
import { createDatabaseRatingService } from '@ValenceServer/ratings/createDatabaseRatingService';
import { createDatabaseSegmentService } from '@ValenceServer/segments/createDatabaseSegmentService';
import type { JobProgress } from '@ValenceServer/jobs/JobQueue';
import { aSourceToImport } from './aSourceToImport';
import { createDatabaseImportStore } from './createDatabaseImportStore';
import type { ImportServices } from './ImportServices';
import type { SourceReader } from './SourceReader';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';

type FakePlaylist = {
  id: string;
  ownerId: string;
  name: string;
  isShared: boolean;
  entries: { id: string; mediaItemId: string }[];
};

/**
 * A playlist as the playlist service sums one up.
 *
 * @param playlist - The playlist.
 * @returns Its summary.
 */
const summaryOf = (playlist: FakePlaylist): PlaylistSummary => ({
  id: playlist.id,
  name: playlist.name,
  description: null,
  isShared: playlist.isShared,
  isOrdered: true,
  isMine: true,
  owner: null,
  entryCount: playlist.entries.length,
  lostCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  hasOwnArtwork: false,
  updatedAt: new Date(0).toISOString(),
});

/**
 * A library as the library service lists one.
 *
 * @param row - Its row.
 * @returns The library.
 */
const libraryOf = (row: typeof libraryTable.$inferSelect): Library => ({
  id: row.id,
  name: row.name,
  kind: row.kind === 'shows' || row.kind === 'music' || row.kind === 'books' ? row.kind : 'movies',
  path: row.path,
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
});

/**
 * Everything an import works with, over a test's own database: the real stores for what is written
 * there, and stand-ins that remember what they were asked for the rest, so a test can say what an
 * import did.
 *
 * @param db - The database.
 * @param reader - The source the import reads.
 * @param changes - Anything a test replaces.
 * @returns The services, and what the stand-ins were asked.
 */
const someImportServices = (
  db: AnyValenceDatabase,
  reader: SourceReader = aSourceToImport(),
  changes: Partial<ImportServices> = {},
) => {
  const asked = {
    refused: new Array<[string, string]>(),
    allowed: new Array<[string, string]>(),
    ceilings: new Array<[string, string, number, boolean]>(),
    administrators: new Array<string>(),
    photos: new Array<string>(),
    scanned: new Array<string>(),
    created: new Array<{ name: string; path: string }>(),
    issues: new Array<{ jobId: string; what: string; reason: Said }>(),
    enqueued: new Array<{ kind: string; runId: string }>(),
    cancelled: new Set<string>(),
    progress: new Map<string, JobProgress>(),
    playlists: new Map<string, FakePlaylist>(),
    collections: new Map<string, { name: string; entries: readonly object[] }>(),
    logged: new Array<string>(),
  };

  const services: ImportServices = {
    db,
    store: createDatabaseImportStore(db),
    library: {
      list: async () => (await db.select().from(libraryTable)).map(libraryOf),
      create: async (input) => {
        asked.created.push({ name: input.name, path: input.path });

        if (!input.path.startsWith('/media')) {
          return null;
        }

        const id = randomUUID();

        await db
          .insert(libraryTable)
          .values({ id, name: input.name, kind: input.kind, path: input.path });

        const [row] = await db.select().from(libraryTable).where(eq(libraryTable.id, id));

        return row === undefined ? null : libraryOf(row);
      },
      scan: (libraryId) => {
        asked.scanned.push(libraryId);

        return Promise.resolve({ jobId: `scan-${libraryId}`, state: 'queued' });
      },
      refuseLibrary: (accountId, libraryId) => {
        asked.refused.push([accountId, libraryId]);

        return Promise.resolve();
      },
      allowLibrary: (accountId, libraryId) => {
        asked.allowed.push([accountId, libraryId]);

        return Promise.resolve();
      },
      setCeiling: (accountId, ceiling) => {
        asked.ceilings.push([
          accountId,
          ceiling.libraryId,
          ceiling.maximumAge,
          ceiling.allowsUnrated,
        ]);

        return Promise.resolve();
      },
    },
    profiles: {
      ensureDefault: async (userId, name) => {
        const [held] = await db
          .select()
          .from(viewerProfile)
          .where(eq(viewerProfile.userId, userId))
          .limit(1);
        const id = held?.id ?? randomUUID();

        if (held === undefined) {
          await db.insert(viewerProfile).values({ id, userId, name, colour: 'pink' });
        }

        return {
          id,
          name: held?.name ?? name,
          colour: 'pink',
          avatar: { kind: 'initial', font: 'gilroy' },
          askStillWatchingAfter: 4,
          showsWhatIamWatching: false,
          discordPresence: DEFAULT_DISCORD_PRESENCE,
          prefersBestCopy: false,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString(),
        };
      },
      savePhoto: (userId) => {
        asked.photos.push(userId);

        return Promise.resolve(null);
      },
    },
    favourites: createDatabaseFavouriteService(db),
    ratings: createDatabaseRatingService(db),
    playlists: {
      create: (viewer, input) => {
        const id = randomUUID();
        const playlist = {
          id,
          ownerId: viewer.kind === 'account' ? viewer.accountId : '',
          name: input.name,
          isShared: false,
          entries: [],
        };

        asked.playlists.set(id, playlist);

        return Promise.resolve(summaryOf(playlist));
      },
      read: (_viewer, playlistId) => {
        const playlist = asked.playlists.get(playlistId);

        return Promise.resolve(
          playlist === undefined
            ? null
            : {
                playlist: summaryOf(playlist),
                entries: playlist.entries.map((entry) => ({
                  id: entry.id,
                  position: 0,
                  addedAt: new Date(0).toISOString(),
                  item: null,
                })),
              },
        );
      },
      add: (_viewer, playlistId, mediaItemIds) => {
        const playlist = asked.playlists.get(playlistId);

        playlist?.entries.push(
          ...mediaItemIds.map((mediaItemId) => ({ id: randomUUID(), mediaItemId })),
        );

        return Promise.resolve(playlist === undefined ? null : mediaItemIds.length);
      },
      drop: (_viewer, playlistId, entryId) => {
        const playlist = asked.playlists.get(playlistId);

        if (playlist !== undefined) {
          playlist.entries = playlist.entries.filter((entry) => entry.id !== entryId);
        }

        return Promise.resolve(playlist !== undefined);
      },
      update: (_viewer, playlistId, patch) => {
        const playlist = asked.playlists.get(playlistId);

        if (playlist === undefined) {
          return Promise.resolve(null);
        }

        playlist.isShared = patch.isShared ?? playlist.isShared;

        return Promise.resolve(summaryOf(playlist));
      },
    },
    segments: createDatabaseSegmentService(db),
    collections: {
      create: async (made) => {
        const id = randomUUID();

        await db
          .insert(collection)
          .values({ id, name: made.name, description: made.description ?? null });
        asked.collections.set(id, { name: made.name, entries: made.entries ?? [] });

        return {
          id,
          name: made.name,
          description: made.description ?? null,
          isOrdered: made.isOrdered ?? false,
          hasOwnArtwork: false,
          entryCount: made.entries?.length ?? 0,
          coverMediaIds: [],
          updatedAt: new Date(0).toISOString(),
        };
      },
      replaceEntries: (collectionId, entries) => {
        const held = asked.collections.get(collectionId);

        if (held !== undefined) {
          asked.collections.set(collectionId, { ...held, entries });
        }

        return Promise.resolve(held !== undefined);
      },
    },
    createAccountWithoutPassword: async (request) => {
      const username = request.username ?? request.name.toLowerCase();
      const [taken] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.username, username))
        .limit(1);

      if (taken !== undefined) {
        return { kind: 'taken', field: 'username' };
      }

      const userId = randomUUID();

      await db.insert(user).values({
        id: userId,
        name: request.name,
        email: request.email ?? `${userId}@no-email.invalid`,
        username,
      });

      return { kind: 'created', userId };
    },
    setupLinks: {
      issue: (userId, options) =>
        Promise.resolve({
          url: `http://valence/setup/${userId}`,
          token: `token-${userId}`,
          expiresAt: new Date(Date.UTC(2026, 9, 2 + options.lifetimeDays)),
        }),
    },
    email: { isOn: () => Promise.resolve(true) },
    grantAdministrator: (userId) => {
      asked.administrators.push(userId);

      return Promise.resolve();
    },
    banAccount: async (userId, reason) => {
      await db.update(user).set({ banned: true, banReason: reason }).where(eq(user.id, userId));

      return true;
    },
    tmdbOfTvdb: (tvdbId) => Promise.resolve(tvdbId === 79126 ? 1438 : null),
    regions: () => Promise.resolve(['US']),
    fetch: () => Promise.reject(new Error('the network is not used')),
    readerFor: () => reader,
    jobs: {
      enqueue: (kind, payload) => {
        asked.enqueued.push({
          kind,
          runId: typeof payload.runId === 'string' ? payload.runId : '',
        });

        return Promise.resolve(`job-${asked.enqueued.length.toString()}`);
      },
      reportProgress: (jobId, phase, processed, total, item = null) => {
        asked.progress.set(jobId, { phase, processed, total, item });
      },
      readProgress: (jobId) => asked.progress.get(jobId) ?? null,
      isCancelled: (jobId) => asked.cancelled.has(jobId),
      cancel: (jobId) => {
        asked.cancelled.add(jobId);

        return Promise.resolve(true);
      },
    },
    recordIssue: (jobId, what, reason) => {
      asked.issues.push({ jobId, what, reason });
    },
    requestsReach: () => 'off',
    log: (message) => {
      asked.logged.push(message);
    },
    ...changes,
  };

  return { services, asked };
};

export { someImportServices };
