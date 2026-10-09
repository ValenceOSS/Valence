import { and, eq, isNull, or } from 'drizzle-orm';
import { book, library, mediaItem, musicAlbum, musicTrack, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { TitleFile, TitleFiles } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

const NOTHING_HELD: TitleFiles = { folder: null, files: [] };

const FOLDER_KEY = 'folder:';

/**
 * The files the server's own libraries hold of one title, for its admin page: a film's copies, a
 * series' episodes with the folder it is kept in, an album's tracks with the folder they are in, or a
 * book's file. An artist is read from its own pages, and holds nothing here.
 *
 * @param db - The database.
 * @returns How to read a title's files by what it is and the catalogue id it is known by.
 */
const createDatabaseTitleFiles =
  (db: AnyValenceDatabase) =>
  async (kind: MediaRequestKind, catalogueId: string): Promise<TitleFiles> => {
    const columns = {
      mediaId: mediaItem.id,
      path: mediaItem.path,
      season: mediaItem.seasonNumber,
      episode: mediaItem.episodeNumber,
      lastEpisode: mediaItem.episodeNumberEnd,
      sizeBytes: mediaItem.sizeBytes,
      width: mediaItem.width,
      height: mediaItem.height,
      videoCodec: mediaItem.videoCodec,
      addedAt: mediaItem.addedAt,
    };
    const asFile = (row: Omit<TitleFile, 'addedAt'> & { addedAt: Date | null }): TitleFile => ({
      ...row,
      addedAt: row.addedAt === null ? null : row.addedAt.toISOString(),
    });

    if (kind === 'film') {
      const rows = await db
        .select(columns)
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            eq(mediaItem.externalId, catalogueId),
            isNull(mediaItem.seriesId),
            isNull(mediaItem.extraKind),
            isNull(library.linkedServerId),
          ),
        );

      return { folder: null, files: rows.map(asFile) };
    }

    if (kind === 'series') {
      const rows = await db
        .select({ ...columns, key: series.key })
        .from(mediaItem)
        .innerJoin(series, eq(series.id, mediaItem.seriesId))
        .innerJoin(library, eq(library.id, series.libraryId))
        .where(
          and(
            eq(series.externalId, catalogueId),
            isNull(mediaItem.extraKind),
            isNull(library.linkedServerId),
          ),
        );
      const key = rows.find((row) => row.key.startsWith(FOLDER_KEY))?.key;

      return {
        folder: key === undefined ? null : key.slice(FOLDER_KEY.length),
        files: rows.map(({ key: _key, ...row }) => asFile(row)),
      };
    }

    if (kind === 'album') {
      const rows = await db
        .select({ ...columns, disc: musicTrack.discNumber, track: musicTrack.trackNumber })
        .from(mediaItem)
        .innerJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
        .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            or(
              eq(musicAlbum.releaseGroupMusicbrainzId, catalogueId),
              eq(musicAlbum.musicbrainzId, catalogueId),
            ),
            isNull(library.linkedServerId),
          ),
        );
      const first = rows[0]?.path;
      const cut = first === undefined ? -1 : first.lastIndexOf('/');

      return {
        folder: first === undefined || cut <= 0 ? null : first.slice(0, cut),
        files: rows.map(({ disc, track, ...row }) =>
          asFile({ ...row, season: disc, episode: track, lastEpisode: null }),
        ),
      };
    }

    if (kind === 'book') {
      const rows = await db
        .select({ id: book.id, path: book.path, addedAt: book.addedAt })
        .from(book)
        .innerJoin(library, eq(library.id, book.libraryId))
        .where(and(eq(book.externalId, catalogueId), isNull(library.linkedServerId)));

      return {
        folder: null,
        files: rows.map((row) => ({
          mediaId: row.id,
          path: row.path,
          season: null,
          episode: null,
          lastEpisode: null,
          sizeBytes: null,
          width: null,
          height: null,
          videoCodec: null,
          addedAt: row.addedAt.toISOString(),
        })),
      };
    }

    return NOTHING_HELD;
  };

export { createDatabaseTitleFiles };
