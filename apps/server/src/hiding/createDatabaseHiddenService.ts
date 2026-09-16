import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { hidden, library, mediaItem, series } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { Hidden, HiddenKind } from '@ValenceContracts/schemas/Hidden';
import type { HiddenService, HiddenSubject } from '@ValenceServer/hiding/HiddenService';

const LIMIT = 500;

/**
 * Which column of the hidden row names a subject of this kind.
 *
 * @param kind - What is being hidden.
 * @returns The column that carries it.
 */
const columnFor = (kind: HiddenKind) =>
  kind === 'item' ? hidden.mediaItemId : kind === 'series' ? hidden.seriesId : hidden.libraryId;

/**
 * What somebody has hidden, and the two gestures that change it.
 *
 * A row names exactly one of the three things that can be hidden, which the table enforces, so the
 * kind is read back from whichever column is filled rather than stored twice and allowed to disagree
 * with itself.
 *
 * @param db - The database.
 * @returns The service.
 */
const createDatabaseHiddenService = (db: ValenceDatabase): HiddenService => {
  /**
   * Whether the thing somebody is trying to hide is a thing at all.
   *
   * @param subject - What they named.
   * @returns Whether it exists.
   */
  const exists = async (subject: HiddenSubject): Promise<boolean> => {
    const rows =
      subject.kind === 'item'
        ? await db
            .select({ id: mediaItem.id })
            .from(mediaItem)
            .where(eq(mediaItem.id, subject.subjectId))
            .limit(1)
        : subject.kind === 'series'
          ? await db
              .select({ id: series.id })
              .from(series)
              .where(eq(series.id, subject.subjectId))
              .limit(1)
          : await db
              .select({ id: library.id })
              .from(library)
              .where(eq(library.id, subject.subjectId))
              .limit(1);

    return rows.length > 0;
  };

  return {
    list: async (profileId) => {
      const rows = await db
        .select({
          mediaItemId: hidden.mediaItemId,
          seriesId: hidden.seriesId,
          libraryId: hidden.libraryId,
          hiddenAt: hidden.hiddenAt,
          itemTitle: mediaItem.title,
          seriesTitle: series.title,
          libraryName: library.name,
        })
        .from(hidden)
        .leftJoin(mediaItem, eq(mediaItem.id, hidden.mediaItemId))
        .leftJoin(series, eq(series.id, hidden.seriesId))
        .leftJoin(library, eq(library.id, hidden.libraryId))
        .where(eq(hidden.profileId, profileId))
        .orderBy(desc(hidden.hiddenAt))
        .limit(LIMIT);

      return rows.flatMap((row): Hidden[] => {
        const found =
          row.mediaItemId !== null
            ? { kind: 'item' as const, subjectId: row.mediaItemId, title: row.itemTitle }
            : row.seriesId !== null
              ? { kind: 'series' as const, subjectId: row.seriesId, title: row.seriesTitle }
              : row.libraryId !== null
                ? { kind: 'library' as const, subjectId: row.libraryId, title: row.libraryName }
                : null;

        if (found === null || found.title === null) {
          return [];
        }

        return [
          {
            kind: found.kind,
            subjectId: found.subjectId,
            title: found.title,
            hiddenAt: row.hiddenAt.toISOString(),
          },
        ];
      });
    },

    hide: async (profileId, subject) => {
      if (!(await exists(subject))) {
        return false;
      }

      await db
        .insert(hidden)
        .values({
          id: randomUUID(),
          profileId,
          mediaItemId: subject.kind === 'item' ? subject.subjectId : null,
          seriesId: subject.kind === 'series' ? subject.subjectId : null,
          libraryId: subject.kind === 'library' ? subject.subjectId : null,
          hiddenAt: new Date(),
        })
        .onConflictDoNothing();

      return true;
    },

    show: async (profileId, subject) => {
      const gone = await db
        .delete(hidden)
        .where(and(eq(hidden.profileId, profileId), eq(columnFor(subject.kind), subject.subjectId)))
        .returning({ id: hidden.id });

      return gone.length > 0;
    },
  };
};

export { createDatabaseHiddenService };
