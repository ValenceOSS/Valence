import { randomUUID } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { library, mediaItem, streamedChoice } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { isUniqueViolation } from '@ValenceDatabase/isUniqueViolation';
import { say } from '@ValenceI18n/say';
import { STREAMED_PREFIX } from './STREAMED_PREFIX';
import { streamedPathOf } from './streamedPathOf';

type StreamedChoice = {
  mediaItemId: string;
  pluginId: string;
  sourceId: string;
  streamKey: string;
  name: string;
  infoHash: string | null;
  fileName: string | null;
  sizeBytes: number | null;
};

type StreamedFilms = {
  libraryId: () => Promise<string>;
  itemOf: (tmdbId: number) => Promise<string | null>;
  itemsOf: (tmdbIds: readonly number[]) => Promise<ReadonlyMap<number, string>>;
  pathOf: (mediaItemId: string) => Promise<string | null>;
  choiceOf: (mediaItemId: string) => Promise<StreamedChoice | null>;
  choose: (choice: StreamedChoice) => Promise<void>;
};

/**
 * Where films played straight from a source are kept: one hidden library made the first time one
 * is played, a title in it for each film whatever source plays it, and for each the stream last
 * chosen, so it plays from the same one again. Two plays choosing at once both land, the later
 * one kept.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseStreamedFilms = (db: AnyValenceDatabase): StreamedFilms => {
  let made: Promise<string> | null = null;

  const make = async (): Promise<string> => {
    const [found] = await db
      .select({ id: library.id })
      .from(library)
      .where(eq(library.isStreamed, true))
      .limit(1);

    if (found !== undefined) {
      return found.id;
    }

    const id = randomUUID();

    await db.insert(library).values({
      id,
      name: say('server.streamSources.createDatabaseStreamedFilms.filmsPlayedFromSources'),
      kind: 'movies',
      path: STREAMED_PREFIX,
      takesRequests: false,
      isStreamed: true,
    });

    return id;
  };

  const libraryId = async (): Promise<string> => {
    made ??= make();

    try {
      return await made;
    } catch (error) {
      made = null;

      throw error;
    }
  };

  return {
    libraryId,

    itemOf: async (tmdbId) => {
      const [found] = await db
        .select({ id: mediaItem.id })
        .from(mediaItem)
        .where(
          and(
            eq(mediaItem.libraryId, await libraryId()),
            eq(mediaItem.path, streamedPathOf(tmdbId)),
          ),
        )
        .limit(1);

      return found?.id ?? null;
    },

    itemsOf: async (tmdbIds) => {
      if (tmdbIds.length === 0) {
        return new Map();
      }

      const rows = await db
        .select({ id: mediaItem.id, path: mediaItem.path })
        .from(mediaItem)
        .where(
          and(
            eq(mediaItem.libraryId, await libraryId()),
            inArray(
              mediaItem.path,
              tmdbIds.map((tmdbId) => streamedPathOf(tmdbId)),
            ),
          ),
        );

      return new Map(
        rows.map((row) => [Number(row.path.slice(STREAMED_PREFIX.length)), row.id] as const),
      );
    },

    pathOf: async (mediaItemId) => {
      const [found] = await db
        .select({ path: mediaItem.path })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaItemId))
        .limit(1);

      return found?.path ?? null;
    },

    choiceOf: async (mediaItemId) => {
      const [found] = await db
        .select()
        .from(streamedChoice)
        .where(eq(streamedChoice.mediaItemId, mediaItemId))
        .limit(1);

      return found === undefined
        ? null
        : {
            mediaItemId: found.mediaItemId,
            pluginId: found.pluginId,
            sourceId: found.sourceId,
            streamKey: found.streamKey,
            name: found.name,
            infoHash: found.infoHash,
            fileName: found.fileName,
            sizeBytes: found.sizeBytes,
          };
    },

    choose: async (choice) => {
      const chosen = { ...choice, chosenAt: new Date() };

      try {
        await db.insert(streamedChoice).values(chosen);
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }

        await db
          .update(streamedChoice)
          .set(chosen)
          .where(eq(streamedChoice.mediaItemId, choice.mediaItemId));
      }
    },
  };
};

export type { StreamedChoice, StreamedFilms };

export { createDatabaseStreamedFilms };
