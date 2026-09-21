import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gt, inArray, isNull, max, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  library,
  mediaItem,
  musicTrack,
  playlist,
  playlistEntry,
  viewerProfile,
} from '@ValenceServer/db/Schema';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import { STEP, positionBetween } from './positionBetween';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { MediaKind } from '@ValenceContracts/schemas/MediaKind';
import type { PlaylistEntry, PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { MusicService } from '@ValenceServer/music/MusicService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { PlaylistService } from './PlaylistService';

const ARTWORK_TILES = 4;

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
 * @param db - The database.
 * @param music - Where a song entry is read out as a full track.
 * @returns The service.
 */
const createDatabasePlaylistService = (
  db: ValenceDatabase,
  music: MusicService,
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
        entryCount: sql<number>`count(*)::int`,
        durationSeconds: sql<number>`coalesce(sum(${mediaItem.durationSeconds}), 0)::float`,
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
          sql`exists (select 1 from music_album a where a.id = ${musicTrack.albumId} and a."artworkPath" is not null)`,
        ),
      )
      .orderBy(asc(playlistEntry.position));

    const tallied = new Map(tallies.map((row) => [row.playlistId, row]));
    const tiled = new Map<string, string[]>();

    const losses = await db
      .select({ playlistId: playlistEntry.playlistId, lostCount: sql<number>`count(*)::int` })
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

    const lost = new Map(losses.map((row) => [row.playlistId, row.lostCount]));

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
      lostCount: lost.get(row.id) ?? 0,
      durationSeconds: tallied.get(row.id)?.durationSeconds ?? 0,
      artworkAlbumIds: tiled.get(row.id) ?? [],
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
    mediaItemIds: readonly string[],
  ): Promise<number> => {
    const wanted = [...new Set(mediaItemIds)];

    if (wanted.length === 0) {
      return 0;
    }

    const allowed = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(inArray(mediaItem.id, wanted), entryVisible(viewer)));

    const known = new Set(allowed.map((row) => row.id));
    const kept = mediaItemIds.filter((id) => known.has(id));

    if (kept.length === 0) {
      return 0;
    }

    const [last] = await db
      .select({ position: max(playlistEntry.position) })
      .from(playlistEntry)
      .where(eq(playlistEntry.playlistId, playlistId));

    const from = last?.position ?? 0;

    await db.insert(playlistEntry).values(
      kept.map((id, at) => ({
        id: randomUUID(),
        playlistId,
        mediaItemId: id,
        position: from + STEP * (at + 1),
      })),
    );

    await touch(playlistId);

    return kept.length;
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

    add: async (viewer, playlistId, mediaItemIds) =>
      (await owned(viewer, playlistId)) ? append(viewer, playlistId, mediaItemIds) : null,

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
        .where(and(eq(playlistEntry.id, entryId), eq(playlistEntry.playlistId, playlistId)))
        .returning({ id: playlistEntry.id });

      if (dropped.length > 0) {
        await touch(playlistId);
      }

      return dropped.length > 0;
    },
  };
};

export { createDatabasePlaylistService };
