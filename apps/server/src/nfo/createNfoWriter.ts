import { describeFailure } from '@ValenceServer/logging/describeFailure';
import { writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { z } from 'zod';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { library, mediaItem } from '#dialect/Schema';
import { titleFolderOf } from '@ValenceCore/functions/titleFolderOf';
import { nfoOf } from './nfoOf';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { NfoTitle } from './NfoTitle.types';

const WordsSchema = z.array(z.string()).catch([]);

const CastSchema = z.array(z.object({ name: z.string(), role: z.string().catch('') })).catch([]);

/**
 * Writes the NFO files of a library that keeps its metadata beside its media: an NFO for each film
 * and each episode, named as its file, and a show's in its folder, so Kodi, Jellyfin and Emby read
 * what was edited here.
 *
 * @param db - The database.
 * @param write - Writes a file, so tests need not touch the disk.
 * @param onProblem - Told of a file that could not be written.
 * @returns How to write the NFO files of some files.
 */
const createNfoWriter = (
  db: AnyValenceDatabase,
  write: (path: string, text: string) => Promise<void> = (path, text) =>
    writeFile(path, text, 'utf8'),
  onProblem: (path: string, reason: string) => void = () => {},
) => {
  /**
   * Writes one NFO file, telling where it could not be.
   *
   * @param path - Where.
   * @param title - What it says.
   */
  const put = async (path: string, title: NfoTitle) => {
    await write(path, nfoOf(title)).catch((error: Error) => {
      onProblem(path, describeFailure(error));
    });
  };

  /**
   * Writes the NFO files of the films and episodes asked about, where their library keeps them.
   *
   * @param mediaIds - The files whose metadata changed.
   */
  const writeFor = async (mediaIds: readonly string[]) => {
    if (mediaIds.length === 0) {
      return;
    }

    const rows = await db
      .select({
        path: mediaItem.path,
        title: mediaItem.title,
        originalTitle: mediaItem.originalTitle,
        sortTitle: mediaItem.sortTitle,
        year: mediaItem.year,
        overview: mediaItem.overview,
        tagline: mediaItem.tagline,
        releaseDate: mediaItem.releaseDate,
        rating: mediaItem.rating,
        genres: mediaItem.genres,
        tags: mediaItem.tags,
        studios: mediaItem.studios,
        directors: mediaItem.directors,
        writers: mediaItem.writers,
        castMembers: mediaItem.castMembers,
        guestStars: mediaItem.guestStars,
        seriesId: mediaItem.seriesId,
        seriesTitle: mediaItem.seriesTitle,
        seriesSortTitle: mediaItem.seriesSortTitle,
        seasonNumber: mediaItem.seasonNumber,
        episodeNumber: mediaItem.episodeNumber,
        externalId: mediaItem.externalId,
        catalogueEpisodeId: mediaItem.catalogueEpisodeId,
        imdbId: mediaItem.imdbId,
        tvdbId: mediaItem.tvdbId,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          inArray(mediaItem.id, [...mediaIds]),
          eq(library.writesNfo, true),
          isNull(mediaItem.extraKind),
        ),
      );
    const shows = new Map<string, typeof rows>();

    for (const row of rows) {
      const isEpisode = row.seriesTitle !== null;
      const beside = join(parse(row.path).dir, `${parse(row.path).name}.nfo`);

      await put(beside, {
        kind: isEpisode ? 'episodedetails' : 'movie',
        title: row.title,
        originalTitle: isEpisode ? null : row.originalTitle,
        sortTitle: isEpisode ? null : row.sortTitle,
        year: row.year,
        plot: row.overview,
        tagline: isEpisode ? null : row.tagline,
        premiered: row.releaseDate,
        rating: isEpisode ? null : row.rating,
        genres: isEpisode ? [] : WordsSchema.parse(row.genres),
        tags: isEpisode ? [] : WordsSchema.parse(row.tags),
        studios: isEpisode ? [] : WordsSchema.parse(row.studios),
        directors: WordsSchema.parse(row.directors),
        writers: WordsSchema.parse(row.writers),
        cast: CastSchema.parse(isEpisode ? row.guestStars : row.castMembers),
        season: row.seasonNumber,
        episode: row.episodeNumber,
        ids: {
          tmdb: isEpisode ? row.catalogueEpisodeId : row.externalId,
          imdb: isEpisode ? null : row.imdbId,
          tvdb: isEpisode ? null : row.tvdbId,
        },
      });

      if (isEpisode && row.seriesId !== null) {
        shows.set(row.seriesId, [...(shows.get(row.seriesId) ?? []), row]);
      }
    }

    for (const [seriesId] of shows) {
      const episodes = await db
        .select({ path: mediaItem.path })
        .from(mediaItem)
        .where(and(eq(mediaItem.seriesId, seriesId), isNull(mediaItem.extraKind)));
      const folder = titleFolderOf(episodes.map((one) => one.path));
      const [show] = shows.get(seriesId) ?? [];

      if (folder === null || show === undefined) {
        continue;
      }

      await put(join(folder, 'tvshow.nfo'), {
        kind: 'tvshow',
        title: show.seriesTitle ?? show.title,
        originalTitle: show.originalTitle,
        sortTitle: show.seriesSortTitle,
        year: null,
        plot: null,
        tagline: show.tagline,
        premiered: null,
        rating: show.rating,
        genres: WordsSchema.parse(show.genres),
        tags: WordsSchema.parse(show.tags),
        studios: WordsSchema.parse(show.studios),
        directors: [],
        writers: [],
        cast: CastSchema.parse(show.castMembers),
        season: null,
        episode: null,
        ids: { tmdb: show.externalId, imdb: show.imdbId, tvdb: show.tvdbId },
      });
    }
  };

  return { writeFor };
};

export { createNfoWriter };
