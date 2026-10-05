import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  max,
  or,
  sql,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import {
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
  playlist,
  playlistEntry,
  viewerProfile,
} from '#dialect/Schema';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import { STEP, positionBetween } from './positionBetween';
import { isTheTrackNamed } from '@ValenceServer/music/isTheTrackNamed';
import { missingCoverUrl } from '@ValenceServer/music/web/missingCoverUrl';
import { ARTWORK_LIMITS } from '@ValenceServer/playlists/ARTWORK_LIMITS';
import {
  contentTypeFor,
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaKind } from '@ValenceContracts/schemas/MediaKind';
import type {
  PlaylistEntry,
  PlaylistMissingSong,
  PlaylistSummary,
} from '@ValenceContracts/schemas/Playlist';
import type { MusicService } from '@ValenceServer/music/MusicService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { PlaylistService } from './PlaylistService';

const ARTWORK_TILES = 4;

const MISSING_LOOKED_FOR_AT_ONCE = 50;

const LOOKS_AGAIN_AFTER_MS = 5 * 60 * 1000;

const CHECKS_THE_LIBRARY_EVERY_MS = 30 * 1000;

/**
 * The profile a viewer is acting as, where they are acting as one.
 *
 * @param viewer - Who is asking.
 * @returns Their profile, or nothing.
 */
const profileOf = (viewer: Viewer): string | null =>
  viewer.kind === 'account' ? viewer.profileId : null;

/**
 * What kind of thing a playlist entry is, from the library it lives in.
 *
 * @param libraryKind - The kind of library.
 * @param seriesTitle - The programme it belongs to, where it is an episode.
 * @returns The kind.
 */
const kindOf = (libraryKind: string, seriesTitle: string | null): MediaKind => {
  if (libraryKind === 'music') {
    return 'song';
  }

  if (libraryKind === 'shows' || seriesTitle !== null) {
    return 'episode';
  }

  return libraryKind === 'movies' ? 'movie' : 'video';
};

/**
 * Playlists: a named, ordered list of media items, owned by a profile and shared in one action.
 *
 * A playlist holds media items rather than tracks, so a film-night list works exactly as a mixtape
 * does. Everything a viewer reads is filtered for them on the way out: an entry they may not see is
 * left out of somebody else's shared playlist entirely — its title, artwork and length included —
 * rather than shown and then refused. Only the owner may change a playlist; anybody may read one
 * that has been shared.
 *
 * A playlist's owner may give it a cover of its own, kept as a file beside the other uploaded
 * pictures and checked the way a face is; without one it is drawn from its songs' albums.
 *
 * A song a playlist holds that the library does not have yet is filled in when its owner reads the
 * playlist and the library has it — looked for again only once the library's songs, their files or
 * the playlist's missing ones have changed, or a few minutes have passed for a change the files do
 * not show, such as a correction. A playlist being watched is read every moment, so the library is
 * checked for changes at most every half minute.
 *
 * @param db - The database.
 * @param music - Where a song entry is read out as a full track.
 * @param artworkDirectory - Where the covers people upload for their playlists are kept.
 * @param now - The time, for a test.
 * @returns The service.
 */
const createDatabasePlaylistService = (
  db: AnyValenceDatabase,
  music: MusicService,
  artworkDirectory: string,
  now: () => number = () => Date.now(),
): PlaylistService => {
  const entryVisible = (viewer: Viewer): SQL | undefined =>
    and(visibleToViewer(db, viewer), librariesVisibleToViewer(db, viewer));

  const readable = (viewer: Viewer): SQL => {
    const profileId = profileOf(viewer);

    return profileId === null
      ? eq(playlist.isShared, true)
      : (or(eq(playlist.profileId, profileId), eq(playlist.isShared, true)) ?? sql`false`);
  };

  const summarise = async (
    viewer: Viewer,
    condition: SQL | undefined,
  ): Promise<PlaylistSummary[]> => {
    const profileId = profileOf(viewer);

    const rows = await db
      .select({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        isShared: playlist.isShared,
        isOrdered: playlist.isOrdered,
        profileId: playlist.profileId,
        ownerName: viewerProfile.name,
        ownerColour: viewerProfile.colour,
        artworkPath: playlist.artworkPath,
        updatedAt: playlist.updatedAt,
      })
      .from(playlist)
      .leftJoin(viewerProfile, eq(viewerProfile.id, playlist.profileId))
      .where(and(readable(viewer), condition))
      .orderBy(desc(playlist.updatedAt));

    if (rows.length === 0) {
      return [];
    }

    const tallies = await db
      .select({
        playlistId: playlistEntry.playlistId,
        entryCount: sql<number>`count(*)`.mapWith(Number),
        durationSeconds: sql<number>`coalesce(sum(${mediaItem.durationSeconds}), 0)`.mapWith(
          Number,
        ),
      })
      .from(playlistEntry)
      .innerJoin(mediaItem, eq(mediaItem.id, playlistEntry.mediaItemId))
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          inArray(
            playlistEntry.playlistId,
            rows.map((row) => row.id),
          ),
          entryVisible(viewer),
        ),
      )
      .groupBy(playlistEntry.playlistId);

    const tiles = await db
      .select({ playlistId: playlistEntry.playlistId, albumId: musicTrack.albumId })
      .from(playlistEntry)
      .innerJoin(mediaItem, eq(mediaItem.id, playlistEntry.mediaItemId))
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .innerJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
      .where(
        and(
          inArray(
            playlistEntry.playlistId,
            rows.map((row) => row.id),
          ),
          entryVisible(viewer),
          sql`exists (select 1 from ${musicAlbum} where ${musicAlbum.id} = ${musicTrack.albumId} and ${musicAlbum.artworkPath} is not null)`,
        ),
      )
      .orderBy(asc(playlistEntry.position));

    const tallied = new Map(tallies.map((row) => [row.playlistId, row]));
    const tiled = new Map<string, string[]>();

    const absences = await db
      .select({
        playlistId: playlistEntry.playlistId,
        lostCount:
          sql<number>`sum(case when ${playlistEntry.missingTitle} is null then 1 else 0 end)`.mapWith(
            Number,
          ),
        missingCount:
          sql<number>`sum(case when ${playlistEntry.missingTitle} is null then 0 else 1 end)`.mapWith(
            Number,
          ),
      })
      .from(playlistEntry)
      .where(
        and(
          inArray(
            playlistEntry.playlistId,
            rows.map((row) => row.id),
          ),
          isNull(playlistEntry.mediaItemId),
        ),
      )
      .groupBy(playlistEntry.playlistId);

    const absent = new Map(absences.map((row) => [row.playlistId, row]));

    for (const tile of tiles) {
      const held = tiled.get(tile.playlistId) ?? [];

      if (held.length < ARTWORK_TILES && !held.includes(tile.albumId)) {
        tiled.set(tile.playlistId, [...held, tile.albumId]);
      }
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isShared: row.isShared,
      isOrdered: row.isOrdered,
      isMine: row.profileId !== null && row.profileId === profileId,
      owner:
        row.profileId === null || row.ownerName === null || row.ownerColour === null
          ? null
          : { profileId: row.profileId, name: row.ownerName, colour: row.ownerColour },
      entryCount: tallied.get(row.id)?.entryCount ?? 0,
      lostCount: absent.get(row.id)?.lostCount ?? 0,
      missingCount: absent.get(row.id)?.missingCount ?? 0,
      durationSeconds: tallied.get(row.id)?.durationSeconds ?? 0,
      artworkAlbumIds: tiled.get(row.id) ?? [],
      hasOwnArtwork: row.artworkPath !== null,
      updatedAt: row.updatedAt.toISOString(),
    }));
  };

  const owned = async (viewer: Viewer, playlistId: string): Promise<boolean> => {
    const profileId = profileOf(viewer);

    if (profileId === null) {
      return false;
    }

    const [row] = await db
      .select({ id: playlist.id })
      .from(playlist)
      .where(and(eq(playlist.id, playlistId), eq(playlist.profileId, profileId)))
      .limit(1);

    return row !== undefined;
  };

  const abandoned = async (playlistId: string): Promise<boolean> => {
    const [row] = await db
      .select({ id: playlist.id })
      .from(playlist)
      .where(and(eq(playlist.id, playlistId), isNull(playlist.profileId)))
      .limit(1);

    return row !== undefined;
  };

  const touch = async (playlistId: string): Promise<void> => {
    await db.update(playlist).set({ updatedAt: new Date() }).where(eq(playlist.id, playlistId));
  };

  const append = async (
    viewer: Viewer,
    playlistId: string,
    items: readonly (string | PlaylistMissingSong)[],
  ): Promise<number> => {
    const asked = [...new Set(items.filter((item) => typeof item === 'string'))];
    const allowed =
      asked.length === 0
        ? []
        : await db
            .select({ id: mediaItem.id })
            .from(mediaItem)
            .innerJoin(library, eq(library.id, mediaItem.libraryId))
            .where(and(inArray(mediaItem.id, asked), entryVisible(viewer)));

    const known = new Set(allowed.map((row) => row.id));
    const kept = items.filter((item) => typeof item !== 'string' || known.has(item));

    if (kept.length === 0) {
      return 0;
    }

    const [last] = await db
      .select({ position: max(playlistEntry.position) })
      .from(playlistEntry)
      .where(eq(playlistEntry.playlistId, playlistId));

    const from = last?.position ?? 0;

    await db.insert(playlistEntry).values(
      kept.map((item, at) => ({
        id: randomUUID(),
        playlistId,
        position: from + STEP * (at + 1),
        ...(typeof item === 'string'
          ? { mediaItemId: item }
          : {
              missingTitle: item.title,
              missingArtist: item.artist,
              missingAlbum: item.album,
              missingReleaseId: item.releaseId,
            }),
      })),
    );

    await touch(playlistId);

    return kept.length;
  };

  const lastLooked = new Map<
    string,
    { waiting: string; songs: string; checkedAt: number; lookedAt: number }
  >();

  const fillMissing = async (viewer: Viewer, playlistId: string): Promise<void> => {
    const waiting = await db
      .select({
        id: playlistEntry.id,
        title: playlistEntry.missingTitle,
        artist: playlistEntry.missingArtist,
        album: playlistEntry.missingAlbum,
      })
      .from(playlistEntry)
      .where(
        and(
          eq(playlistEntry.playlistId, playlistId),
          isNull(playlistEntry.mediaItemId),
          isNotNull(playlistEntry.missingTitle),
        ),
      );

    if (waiting.length === 0) {
      lastLooked.delete(playlistId);

      return;
    }

    const waitingFor = waiting.map((entry) => entry.id).join(':');
    const last = lastLooked.get(playlistId);
    const same = last?.waiting === waitingFor ? last : undefined;

    if (same !== undefined && now() - same.checkedAt < CHECKS_THE_LIBRARY_EVERY_MS) {
      return;
    }

    const [tracks] = await db
      .select({ count: count(), newest: max(mediaItem.modifiedAtMs) })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId));
    const songsNow = `${(tracks?.count ?? 0).toString()}:${(tracks?.newest ?? 0).toString()}`;

    if (
      same !== undefined &&
      same.songs === songsNow &&
      now() - same.lookedAt < LOOKS_AGAIN_AFTER_MS
    ) {
      lastLooked.set(playlistId, { ...same, checkedAt: now() });

      return;
    }

    for (let at = 0; at < waiting.length; at += MISSING_LOOKED_FOR_AT_ONCE) {
      const looking = waiting.slice(at, at + MISSING_LOOKED_FOR_AT_ONCE);
      const found = await db
        .select({
          id: mediaItem.id,
          title: mediaItem.title,
          artist: musicArtist.name,
          album: musicAlbum.title,
        })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .innerJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
        .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
        .innerJoin(musicTrackArtist, eq(musicTrackArtist.mediaItemId, mediaItem.id))
        .innerJoin(musicArtist, eq(musicArtist.id, musicTrackArtist.artistId))
        .where(
          and(
            entryVisible(viewer),
            or(...looking.map((entry) => isTheTrackNamed(entry.title ?? '', entry.artist ?? ''))),
          ),
        );

      for (const entry of looking) {
        const same = (left: string | null, right: string | null) =>
          left !== null && right !== null && left.toLowerCase() === right.toLowerCase();
        const candidates = found.filter(
          (track) => same(track.title, entry.title) && same(track.artist, entry.artist),
        );
        const chosen = candidates.find((track) => same(track.album, entry.album)) ?? candidates[0];

        if (chosen !== undefined) {
          await db
            .update(playlistEntry)
            .set({
              mediaItemId: chosen.id,
              missingTitle: null,
              missingArtist: null,
              missingAlbum: null,
              missingReleaseId: null,
            })
            .where(eq(playlistEntry.id, entry.id));
        }
      }
    }

    lastLooked.set(playlistId, {
      waiting: waitingFor,
      songs: songsNow,
      checkedAt: now(),
      lookedAt: now(),
    });
  };

  const spaceOut = async (playlistId: string): Promise<void> => {
    const entries = await db
      .select({ id: playlistEntry.id })
      .from(playlistEntry)
      .where(eq(playlistEntry.playlistId, playlistId))
      .orderBy(asc(playlistEntry.position));

    for (const [at, entry] of entries.entries()) {
      await db
        .update(playlistEntry)
        .set({ position: STEP * (at + 1) })
        .where(eq(playlistEntry.id, entry.id));
    }
  };

  return {
    list: (viewer) => summarise(viewer, undefined),

    read: async (viewer, playlistId) => {
      if (await owned(viewer, playlistId)) {
        await fillMissing(viewer, playlistId);
      }

      const [summary] = await summarise(viewer, eq(playlist.id, playlistId));

      if (summary === undefined) {
        return null;
      }

      const rows = await db
        .select({
          id: playlistEntry.id,
          position: playlistEntry.position,
          addedAt: playlistEntry.addedAt,
          mediaItemId: mediaItem.id,
          title: mediaItem.title,
          year: mediaItem.year,
          seriesTitle: mediaItem.seriesTitle,
          durationSeconds: mediaItem.durationSeconds,
          libraryKind: library.kind,
          missingTitle: playlistEntry.missingTitle,
          missingArtist: playlistEntry.missingArtist,
          missingAlbum: playlistEntry.missingAlbum,
          missingReleaseId: playlistEntry.missingReleaseId,
        })
        .from(playlistEntry)
        .leftJoin(mediaItem, eq(mediaItem.id, playlistEntry.mediaItemId))
        .leftJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            eq(playlistEntry.playlistId, playlistId),
            or(isNull(playlistEntry.mediaItemId), entryVisible(viewer)),
          ),
        )
        .orderBy(asc(playlistEntry.position));

      const songs = await music.listTracks(
        viewer,
        rows.flatMap((row) =>
          row.libraryKind === 'music' && row.mediaItemId !== null ? [row.mediaItemId] : [],
        ),
      );
      const trackOf = new Map(songs.map((track) => [track.id, track]));

      const entries: PlaylistEntry[] = rows.map((row) => {
        if (
          row.mediaItemId === null ||
          row.title === null ||
          row.durationSeconds === null ||
          row.libraryKind === null
        ) {
          return {
            id: row.id,
            position: row.position,
            addedAt: row.addedAt.toISOString(),
            item: null,
            missing:
              row.mediaItemId === null && row.missingTitle !== null && row.missingArtist !== null
                ? {
                    title: row.missingTitle,
                    artist: row.missingArtist,
                    album: row.missingAlbum,
                    releaseId: row.missingReleaseId,
                    coverUrl: missingCoverUrl({
                      releaseId: row.missingReleaseId,
                      title: row.missingAlbum ?? row.missingTitle,
                      artist: row.missingArtist,
                    }),
                  }
                : null,
          };
        }

        const kind = kindOf(row.libraryKind, row.seriesTitle);
        const track = trackOf.get(row.mediaItemId) ?? null;

        return {
          id: row.id,
          position: row.position,
          addedAt: row.addedAt.toISOString(),
          item: {
            id: row.mediaItemId,
            kind,
            title: row.title,
            subtitle:
              track !== null
                ? track.artists.map((artist) => artist.name).join(', ')
                : kind === 'episode'
                  ? row.seriesTitle
                  : row.year === null
                    ? null
                    : String(row.year),
            durationSeconds: row.durationSeconds,
            track,
          },
          missing: null,
        };
      });

      return { playlist: summary, entries };
    },

    create: async (viewer, input) => {
      const profileId = profileOf(viewer);

      if (profileId === null) {
        return null;
      }

      const id = randomUUID();

      await db.insert(playlist).values({
        id,
        profileId,
        name: input.name,
        description: input.description ?? null,
        isOrdered: input.isOrdered ?? false,
      });

      await append(viewer, id, input.mediaItemIds ?? []);

      const [made] = await summarise(viewer, eq(playlist.id, id));

      return made ?? null;
    },

    update: async (viewer, playlistId, patch) => {
      if (!(await owned(viewer, playlistId))) {
        return null;
      }

      await db
        .update(playlist)
        .set({
          ...(patch.name === undefined ? {} : { name: patch.name }),
          ...(patch.description === undefined ? {} : { description: patch.description }),
          ...(patch.isShared === undefined ? {} : { isShared: patch.isShared }),
          ...(patch.isOrdered === undefined ? {} : { isOrdered: patch.isOrdered }),
          updatedAt: new Date(),
        })
        .where(eq(playlist.id, playlistId));

      const [changed] = await summarise(viewer, eq(playlist.id, playlistId));

      return changed ?? null;
    },

    remove: async (viewer, playlistId, mayClearAbandoned) => {
      if (
        !(await owned(viewer, playlistId)) &&
        !(mayClearAbandoned && (await abandoned(playlistId)))
      ) {
        return false;
      }

      await db.delete(playlist).where(eq(playlist.id, playlistId));

      return true;
    },

    add: async (viewer, playlistId, items) =>
      (await owned(viewer, playlistId)) ? append(viewer, playlistId, items) : null,

    move: async (viewer, playlistId, entryId, afterEntryId) => {
      if (!(await owned(viewer, playlistId))) {
        return false;
      }

      const placeAfter = async (): Promise<number | null> => {
        const anchor =
          afterEntryId === null
            ? null
            : ((
                await db
                  .select({ position: playlistEntry.position })
                  .from(playlistEntry)
                  .where(
                    and(
                      eq(playlistEntry.id, afterEntryId),
                      eq(playlistEntry.playlistId, playlistId),
                    ),
                  )
                  .limit(1)
              )[0]?.position ?? null);

        const [next] = await db
          .select({ position: playlistEntry.position })
          .from(playlistEntry)
          .where(
            and(
              eq(playlistEntry.playlistId, playlistId),
              sql`${playlistEntry.id} <> ${entryId}`,
              ...(anchor === null ? [] : [gt(playlistEntry.position, anchor)]),
            ),
          )
          .orderBy(asc(playlistEntry.position))
          .limit(1);

        return positionBetween(anchor, next?.position ?? null);
      };

      const [entry] = await db
        .select({ id: playlistEntry.id })
        .from(playlistEntry)
        .where(and(eq(playlistEntry.id, entryId), eq(playlistEntry.playlistId, playlistId)))
        .limit(1);

      if (entry === undefined) {
        return false;
      }

      const first = await placeAfter();
      const position = first ?? (await spaceOut(playlistId).then(placeAfter));

      if (position === null) {
        return false;
      }

      await db.update(playlistEntry).set({ position }).where(eq(playlistEntry.id, entryId));
      await touch(playlistId);

      return true;
    },

    drop: async (viewer, playlistId, entryId) => {
      if (!(await owned(viewer, playlistId))) {
        return false;
      }

      const dropped = await db
        .delete(playlistEntry)
        .where(and(eq(playlistEntry.id, entryId), eq(playlistEntry.playlistId, playlistId)));
      const isDropped = countAffected(dropped) > 0;

      if (isDropped) {
        await touch(playlistId);
      }

      return isDropped;
    },

    readArtwork: async (viewer, playlistId) => {
      const [row] = await db
        .select({ artworkPath: playlist.artworkPath })
        .from(playlist)
        .where(and(eq(playlist.id, playlistId), readable(viewer)))
        .limit(1);

      if (row?.artworkPath === null || row?.artworkPath === undefined) {
        return null;
      }

      const contentType = contentTypeFor(extname(row.artworkPath));
      const body = await readFile(join(artworkDirectory, row.artworkPath)).catch(() => null);

      return body === null || contentType === undefined
        ? null
        : { body: new Uint8Array(body), contentType };
    },

    saveArtwork: async (viewer, playlistId, artwork) => {
      if (!(await owned(viewer, playlistId))) {
        return 'notYours';
      }

      const wrong = await whatIsWrongWithThePicture(artwork, ARTWORK_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      const name = `${playlistId}-${Date.now().toString()}${extensionFor(artwork.contentType) ?? '.png'}`;
      const [was] = await db
        .select({ artworkPath: playlist.artworkPath })
        .from(playlist)
        .where(eq(playlist.id, playlistId))
        .limit(1);

      await mkdir(artworkDirectory, { recursive: true });
      await writeFile(join(artworkDirectory, name), artwork.body);
      await db
        .update(playlist)
        .set({ artworkPath: name, updatedAt: new Date() })
        .where(eq(playlist.id, playlistId));

      if (was?.artworkPath !== null && was?.artworkPath !== undefined) {
        await unlink(join(artworkDirectory, was.artworkPath)).catch(() => undefined);
      }

      return null;
    },

    dropArtwork: async (viewer, playlistId) => {
      if (!(await owned(viewer, playlistId))) {
        return false;
      }

      const [was] = await db
        .select({ artworkPath: playlist.artworkPath })
        .from(playlist)
        .where(eq(playlist.id, playlistId))
        .limit(1);

      await db
        .update(playlist)
        .set({ artworkPath: null, updatedAt: new Date() })
        .where(eq(playlist.id, playlistId));

      if (was?.artworkPath !== null && was?.artworkPath !== undefined) {
        await unlink(join(artworkDirectory, was.artworkPath)).catch(() => undefined);
      }

      return true;
    },
  };
};

export { createDatabasePlaylistService };
