import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { hasSomethingStillThere } from '@ValenceServer/visibility/hasSomethingStillThere';
import { and, eq, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import type { HealthItem, HealthList } from '@ValenceContracts/schemas/LibraryHealth';
import { library, mediaItem, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { findDuplicates } from './findDuplicates';
import type { LibraryHealthReader } from './LibraryHealthReader';

const SHOWN = 100;

const WATCHED_KINDS = ['movies', 'shows', 'anime'];

/**
 * Builds the reader of what is wrong in this server's films and series: titles the catalogue never
 * matched, matched films with no poster, titles that are there twice, and files that could not be
 * read. Each list says how many there are and names the first hundred.
 *
 * @param db - The database to read.
 * @param now - The clock.
 * @returns The reader.
 */
const createLibraryHealthReader =
  (db: AnyValenceDatabase, now: () => Date = () => new Date()): LibraryHealthReader =>
  async () => {
    const topLevel = and(
      isNull(mediaItem.parentId),
      isNull(mediaItem.extraKind),
      inArray(library.kind, WATCHED_KINDS),
      isStillThere(),
    );
    const columns = {
      id: mediaItem.id,
      title: mediaItem.title,
      year: mediaItem.year,
      libraryId: mediaItem.libraryId,
      libraryName: library.name,
      path: mediaItem.path,
    };

    const listOf = (
      rows: readonly Omit<HealthItem, 'group'>[],
      total = rows.length,
    ): HealthList => ({
      total,
      items: rows.slice(0, SHOWN).map((row) => ({ ...row, group: null })),
    });

    const [unmatchedFilms, unmatchedSeries, noArtwork, unreadable, placed] = await Promise.all([
      db
        .select(columns)
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            topLevel,
            isNull(mediaItem.seriesId),
            or(isNull(mediaItem.externalId), eq(mediaItem.externalId, '')),
          ),
        ),
      db
        .select({
          id: series.id,
          title: series.title,
          libraryId: series.libraryId,
          libraryName: library.name,
          path: sql<string>`coalesce((select min(${mediaItem.path}) from ${mediaItem} where ${mediaItem.seriesId} = ${series.id} and ${mediaItem.missingSince} is null), ${series.key})`,
        })
        .from(series)
        .innerJoin(library, eq(library.id, series.libraryId))
        .where(
          and(
            or(isNull(series.externalId), eq(series.externalId, '')),
            inArray(library.kind, WATCHED_KINDS),
            hasSomethingStillThere(db),
          ),
        ),
      db
        .select(columns)
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            topLevel,
            isNull(mediaItem.seriesId),
            isNotNull(mediaItem.externalId),
            isNull(mediaItem.posterUrl),
          ),
        ),
      db
        .select(columns)
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            topLevel,
            or(
              lte(mediaItem.durationSeconds, 0),
              and(eq(mediaItem.width, 0), eq(mediaItem.height, 0)),
            ),
          ),
        ),
      db
        .select({
          id: mediaItem.id,
          externalId: mediaItem.externalId,
          seriesId: mediaItem.seriesId,
          seasonNumber: mediaItem.seasonNumber,
          episodeNumber: mediaItem.episodeNumber,
        })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(topLevel),
    ]);

    const duplicated = findDuplicates(placed);
    const shownDuplicates = [...duplicated.keys()].slice(0, SHOWN);
    const duplicateRows =
      shownDuplicates.length === 0
        ? []
        : await db
            .select(columns)
            .from(mediaItem)
            .innerJoin(library, eq(library.id, mediaItem.libraryId))
            .where(inArray(mediaItem.id, shownDuplicates));

    return {
      checkedAt: now().toISOString(),
      unmatched: listOf(
        [...unmatchedSeries.map((row) => ({ ...row, year: null })), ...unmatchedFilms].toSorted(
          (a, b) => a.title.localeCompare(b.title),
        ),
      ),
      noArtwork: listOf(noArtwork.toSorted((a, b) => a.title.localeCompare(b.title))),
      duplicate: {
        total: duplicated.size,
        items: duplicateRows
          .map((row) => ({ ...row, group: duplicated.get(row.id) ?? null }))
          .toSorted(
            (a, b) => (a.group ?? '').localeCompare(b.group ?? '') || a.path.localeCompare(b.path),
          ),
      },
      unreadable: listOf(unreadable.toSorted((a, b) => a.title.localeCompare(b.title))),
    };
  };

export { createLibraryHealthReader };
