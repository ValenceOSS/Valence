import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { and, asc, eq, exists, gt, inArray, isNotNull, max, min, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import { collection, collectionEntry, library, mediaItem, series } from '#dialect/Schema';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import { STEP, positionBetween } from '@ValenceServer/playlists/positionBetween';
import { ARTWORK_LIMITS } from '@ValenceServer/playlists/ARTWORK_LIMITS';
import {
  contentTypeFor,
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { subjectKeyOf } from './subjectKeyOf';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  Collection,
  CollectionEntry,
  CollectionSubject,
} from '@ValenceContracts/schemas/Collection';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { CollectionService } from './CollectionService';

const COVER_TILES = 4;

type VisibleEntry = {
  id: string;
  collectionId: string;
  position: number;
  addedAt: Date;
  kind: CollectionEntry['kind'];
  subjectId: string;
};

type CollectionServiceOptions = {
  db: AnyValenceDatabase;
  library: Pick<LibraryService, 'listItems'>;
  artworkDirectory: string;
  onChanged?: () => void;
};

/**
 * Collections: a named group of films and whole programmes that belong together — a franchise, a
 * director's work, a box set — kept for the whole server rather than for one profile.
 *
 * Everything read is filtered for whoever asks. An entry they may not reach, because of a library
 * they were refused, an age ceiling or something they hid, is left out as though it were not there,
 * and a collection left with nothing in it for them is not offered at all unless they are somebody
 * who looks after collections and asks for the empty ones too. A programme counts as there for them
 * while any one of its episodes is.
 *
 * Changing a collection asks nobody: whoever calls has already been allowed to, which is what lets
 * the importer fill one as readily as somebody at the library page does. Every change is said once
 * it is made, so open pages read it again.
 *
 * @param options - The database, where the library's titles are read out as cards, where uploaded
 *   artwork is kept, and who to tell when something changed.
 * @returns The service.
 */
const createDatabaseCollectionService = ({
  db,
  library: titles,
  artworkDirectory,
  onChanged = () => undefined,
}: CollectionServiceOptions): CollectionService => {
  const itemVisible = (viewer: Viewer): SQL | undefined =>
    and(isNotATrack(db), visibleToViewer(db, viewer), librariesVisibleToViewer(db, viewer));

  const seriesVisible = (viewer: Viewer): SQL =>
    exists(
      db
        .select({ one: sql`1` })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(and(eq(mediaItem.seriesId, collectionEntry.seriesId), itemVisible(viewer))),
    );

  const visibleEntries = async (
    viewer: Viewer,
    collectionIds: readonly string[],
  ): Promise<VisibleEntry[]> => {
    if (collectionIds.length === 0) {
      return [];
    }

    const [films, programmes] = await Promise.all([
      db
        .select({
          id: collectionEntry.id,
          collectionId: collectionEntry.collectionId,
          position: collectionEntry.position,
          addedAt: collectionEntry.addedAt,
          subjectId: mediaItem.id,
        })
        .from(collectionEntry)
        .innerJoin(mediaItem, eq(mediaItem.id, collectionEntry.mediaItemId))
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(and(inArray(collectionEntry.collectionId, [...collectionIds]), itemVisible(viewer))),
      db
        .select({
          id: collectionEntry.id,
          collectionId: collectionEntry.collectionId,
          position: collectionEntry.position,
          addedAt: collectionEntry.addedAt,
          subjectId: series.id,
        })
        .from(collectionEntry)
        .innerJoin(series, eq(series.id, collectionEntry.seriesId))
        .where(
          and(inArray(collectionEntry.collectionId, [...collectionIds]), seriesVisible(viewer)),
        ),
    ]);

    return [
      ...films.map((row) => ({ ...row, kind: 'film' as const })),
      ...programmes.map((row) => ({ ...row, kind: 'series' as const })),
    ].sort((left, right) => left.position - right.position);
  };

  const coversOf = async (
    viewer: Viewer,
    seriesIds: readonly string[],
    isPosterNeeded: boolean,
  ): Promise<Map<string, string>> => {
    if (seriesIds.length === 0) {
      return new Map();
    }

    const rows = await db
      .select({ seriesId: mediaItem.seriesId, mediaId: min(mediaItem.id) })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          inArray(mediaItem.seriesId, [...seriesIds]),
          itemVisible(viewer),
          ...(isPosterNeeded ? [isNotNull(mediaItem.posterUrl)] : []),
        ),
      )
      .groupBy(mediaItem.seriesId);

    return new Map(
      rows.flatMap((row) =>
        row.seriesId === null || row.mediaId === null ? [] : [[row.seriesId, row.mediaId]],
      ),
    );
  };

  const summarise = async (
    viewer: Viewer,
    condition: SQL | undefined,
    withEmpty: boolean,
  ): Promise<Collection[]> => {
    const rows = await db
      .select({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isOrdered: collection.isOrdered,
        artworkPath: collection.artworkPath,
        updatedAt: collection.updatedAt,
      })
      .from(collection)
      .where(condition)
      .orderBy(asc(collection.name));

    const entries = await visibleEntries(
      viewer,
      rows.map((row) => row.id),
    );

    const filmIds = entries.flatMap((entry) => (entry.kind === 'film' ? [entry.subjectId] : []));
    const posteredFilms =
      filmIds.length === 0
        ? new Set<string>()
        : new Set(
            (
              await db
                .select({ id: mediaItem.id })
                .from(mediaItem)
                .where(and(inArray(mediaItem.id, filmIds), isNotNull(mediaItem.posterUrl)))
            ).map((row) => row.id),
          );

    const seriesCovers = await coversOf(
      viewer,
      [...new Set(entries.flatMap((entry) => (entry.kind === 'series' ? [entry.subjectId] : [])))],
      true,
    );

    const held = new Map<string, VisibleEntry[]>();

    for (const entry of entries) {
      held.set(entry.collectionId, [...(held.get(entry.collectionId) ?? []), entry]);
    }

    return rows.flatMap((row) => {
      const inside = held.get(row.id) ?? [];

      if (inside.length === 0 && !withEmpty) {
        return [];
      }

      const covers = inside
        .flatMap((entry) => {
          if (entry.kind === 'film') {
            return posteredFilms.has(entry.subjectId) ? [entry.subjectId] : [];
          }

          const cover = seriesCovers.get(entry.subjectId);

          return cover === undefined ? [] : [cover];
        })
        .slice(0, COVER_TILES);

      return [
        {
          id: row.id,
          name: row.name,
          description: row.description,
          isOrdered: row.isOrdered,
          hasOwnArtwork: row.artworkPath !== null,
          entryCount: inside.length,
          coverMediaIds: covers,
          updatedAt: row.updatedAt.toISOString(),
        },
      ];
    });
  };

  const one = async (collectionId: string): Promise<Collection | null> => {
    const [found] = await summarise(asTheServer, eq(collection.id, collectionId), true);

    return found ?? null;
  };

  const isThere = async (collectionId: string): Promise<boolean> => {
    const [row] = await db
      .select({ id: collection.id })
      .from(collection)
      .where(eq(collection.id, collectionId))
      .limit(1);

    return row !== undefined;
  };

  const touch = async (collectionId: string): Promise<void> => {
    await db
      .update(collection)
      .set({ updatedAt: new Date() })
      .where(eq(collection.id, collectionId));
  };

  const settle = async (subjects: readonly CollectionSubject[]): Promise<CollectionSubject[]> => {
    const mediaIds = subjects.flatMap((subject) =>
      'mediaItemId' in subject ? [subject.mediaItemId] : [],
    );
    const seriesIds = subjects.flatMap((subject) =>
      'seriesId' in subject ? [subject.seriesId] : [],
    );

    const [items, programmes] = await Promise.all([
      mediaIds.length === 0
        ? Promise.resolve([])
        : db
            .select({ id: mediaItem.id, seriesId: mediaItem.seriesId })
            .from(mediaItem)
            .where(and(inArray(mediaItem.id, mediaIds), isNotATrack(db))),
      seriesIds.length === 0
        ? Promise.resolve([])
        : db.select({ id: series.id }).from(series).where(inArray(series.id, seriesIds)),
    ]);

    const seriesOfItem = new Map(items.map((item) => [item.id, item.seriesId]));
    const knownSeries = new Set(programmes.map((programme) => programme.id));
    const seen = new Set<string>();

    const settleOne = (subject: CollectionSubject): CollectionSubject | null => {
      if ('seriesId' in subject) {
        return knownSeries.has(subject.seriesId) ? subject : null;
      }

      if (!seriesOfItem.has(subject.mediaItemId)) {
        return null;
      }

      const seriesId = seriesOfItem.get(subject.mediaItemId) ?? null;

      return seriesId === null ? subject : { seriesId };
    };

    return subjects.flatMap((subject): CollectionSubject[] => {
      const settled = settleOne(subject);

      if (settled === null || seen.has(subjectKeyOf(settled))) {
        return [];
      }

      seen.add(subjectKeyOf(settled));

      return [settled];
    });
  };

  const rowsFor = (
    collectionId: string,
    subjects: readonly CollectionSubject[],
    from: number,
  ): (typeof collectionEntry.$inferInsert)[] =>
    subjects.map((subject, at) => ({
      id: randomUUID(),
      collectionId,
      mediaItemId: 'mediaItemId' in subject ? subject.mediaItemId : null,
      seriesId: 'seriesId' in subject ? subject.seriesId : null,
      position: from + STEP * (at + 1),
    }));

  const spaceOut = async (collectionId: string): Promise<void> => {
    const entries = await db
      .select({ id: collectionEntry.id })
      .from(collectionEntry)
      .where(eq(collectionEntry.collectionId, collectionId))
      .orderBy(asc(collectionEntry.position));

    for (const [at, entry] of entries.entries()) {
      await db
        .update(collectionEntry)
        .set({ position: STEP * (at + 1) })
        .where(eq(collectionEntry.id, entry.id));
    }
  };

  const forgetArtwork = async (path: string | null | undefined): Promise<void> => {
    if (path !== null && path !== undefined) {
      await unlink(join(artworkDirectory, path)).catch(() => undefined);
    }
  };

  const artworkPathOf = async (collectionId: string): Promise<string | null | undefined> => {
    const [row] = await db
      .select({ artworkPath: collection.artworkPath })
      .from(collection)
      .where(eq(collection.id, collectionId))
      .limit(1);

    return row === undefined ? undefined : row.artworkPath;
  };

  return {
    list: async (viewer, reading = {}) => {
      const { containing, withEmpty = false } = reading;

      if (containing === undefined) {
        return summarise(viewer, undefined, withEmpty);
      }

      const [settled] = await settle([containing]);

      if (settled === undefined) {
        return [];
      }

      return summarise(
        viewer,
        exists(
          db
            .select({ one: sql`1` })
            .from(collectionEntry)
            .where(
              and(
                eq(collectionEntry.collectionId, collection.id),
                'mediaItemId' in settled
                  ? eq(collectionEntry.mediaItemId, settled.mediaItemId)
                  : eq(collectionEntry.seriesId, settled.seriesId),
              ),
            ),
        ),
        false,
      );
    },

    get: async (viewer, collectionId, withEmpty = false) => {
      const [summary] = await summarise(viewer, eq(collection.id, collectionId), withEmpty);

      if (summary === undefined) {
        return null;
      }

      const entries = await visibleEntries(viewer, [collectionId]);
      const seriesIds = entries.flatMap((entry) =>
        entry.kind === 'series' ? [entry.subjectId] : [],
      );
      const [postered, anyEpisode] = await Promise.all([
        coversOf(viewer, seriesIds, true),
        coversOf(viewer, seriesIds, false),
      ]);

      const cardOf = new Map(
        entries.flatMap((entry) => {
          const mediaId =
            entry.kind === 'film'
              ? entry.subjectId
              : (postered.get(entry.subjectId) ?? anyEpisode.get(entry.subjectId));

          return mediaId === undefined ? [] : [[entry.id, mediaId] as const];
        }),
      );

      const wanted = [...new Set(cardOf.values())];
      const placed =
        wanted.length === 0
          ? []
          : await db
              .select({ id: mediaItem.id, libraryId: mediaItem.libraryId })
              .from(mediaItem)
              .where(inArray(mediaItem.id, wanted));

      const byLibrary = new Map<string, string[]>();

      for (const row of placed) {
        byLibrary.set(row.libraryId, [...(byLibrary.get(row.libraryId) ?? []), row.id]);
      }

      const pages = await Promise.all(
        [...byLibrary].map(([libraryId, ids]) =>
          titles.listItems(viewer, libraryId, { ids, limit: ids.length, offset: 0 }),
        ),
      );

      const cards = new Map<string, MediaSummary>(
        pages.flatMap((page) => (page?.items ?? []).map((media) => [media.id, media] as const)),
      );

      return {
        collection: summary,
        entries: entries.flatMap((entry): CollectionEntry[] => {
          const media = cards.get(cardOf.get(entry.id) ?? '');

          return media === undefined
            ? []
            : [
                {
                  id: entry.id,
                  position: entry.position,
                  addedAt: entry.addedAt.toISOString(),
                  kind: entry.kind,
                  media,
                },
              ];
        }),
      };
    },

    create: async ({ name, description = null, isOrdered = false, entries = [], createdBy }) => {
      const id = randomUUID();
      const settled = await settle(entries);

      await db.insert(collection).values({ id, name, description, isOrdered, createdBy });

      if (settled.length > 0) {
        await db.insert(collectionEntry).values(rowsFor(id, settled, 0));
      }

      onChanged();

      const made = await one(id);

      if (made === null) {
        throw new Error(`collection ${id} was not there once it had been made`);
      }

      return made;
    },

    update: async (collectionId, change) => {
      if (!(await isThere(collectionId))) {
        return null;
      }

      await db
        .update(collection)
        .set({
          ...(change.name === undefined ? {} : { name: change.name }),
          ...(change.description === undefined ? {} : { description: change.description }),
          ...(change.isOrdered === undefined ? {} : { isOrdered: change.isOrdered }),
          updatedAt: new Date(),
        })
        .where(eq(collection.id, collectionId));
      onChanged();

      return one(collectionId);
    },

    remove: async (collectionId) => {
      const artworkPath = await artworkPathOf(collectionId);

      if (artworkPath === undefined) {
        return false;
      }

      await db.delete(collection).where(eq(collection.id, collectionId));
      await forgetArtwork(artworkPath);
      onChanged();

      return true;
    },

    replaceEntries: async (collectionId, entries) => {
      if (!(await isThere(collectionId))) {
        return false;
      }

      const settled = await settle(entries);

      await db.transaction(async (tx) => {
        await tx.delete(collectionEntry).where(eq(collectionEntry.collectionId, collectionId));

        if (settled.length > 0) {
          await tx.insert(collectionEntry).values(rowsFor(collectionId, settled, 0));
        }

        await tx
          .update(collection)
          .set({ updatedAt: new Date() })
          .where(eq(collection.id, collectionId));
      });
      onChanged();

      return true;
    },

    add: async (collectionId, entries) => {
      if (!(await isThere(collectionId))) {
        return null;
      }

      const present = await db
        .select({ mediaItemId: collectionEntry.mediaItemId, seriesId: collectionEntry.seriesId })
        .from(collectionEntry)
        .where(eq(collectionEntry.collectionId, collectionId));
      const already = new Set(
        present.flatMap((row) =>
          row.mediaItemId !== null
            ? [subjectKeyOf({ mediaItemId: row.mediaItemId })]
            : row.seriesId !== null
              ? [subjectKeyOf({ seriesId: row.seriesId })]
              : [],
        ),
      );
      const fresh = (await settle(entries)).filter(
        (subject) => !already.has(subjectKeyOf(subject)),
      );

      if (fresh.length === 0) {
        return 0;
      }

      const [last] = await db
        .select({ position: max(collectionEntry.position) })
        .from(collectionEntry)
        .where(eq(collectionEntry.collectionId, collectionId));

      await db.insert(collectionEntry).values(rowsFor(collectionId, fresh, last?.position ?? 0));
      await touch(collectionId);
      onChanged();

      return fresh.length;
    },

    move: async (collectionId, entryId, afterEntryId) => {
      const [entry] = await db
        .select({ id: collectionEntry.id })
        .from(collectionEntry)
        .where(and(eq(collectionEntry.id, entryId), eq(collectionEntry.collectionId, collectionId)))
        .limit(1);

      if (entry === undefined) {
        return false;
      }

      const placeAfter = async (): Promise<number | null> => {
        const [anchor] =
          afterEntryId === null
            ? []
            : await db
                .select({ position: collectionEntry.position })
                .from(collectionEntry)
                .where(
                  and(
                    eq(collectionEntry.id, afterEntryId),
                    eq(collectionEntry.collectionId, collectionId),
                  ),
                )
                .limit(1);
        const from = anchor?.position ?? null;

        const [next] = await db
          .select({ position: collectionEntry.position })
          .from(collectionEntry)
          .where(
            and(
              eq(collectionEntry.collectionId, collectionId),
              sql`${collectionEntry.id} <> ${entryId}`,
              ...(from === null ? [] : [gt(collectionEntry.position, from)]),
            ),
          )
          .orderBy(asc(collectionEntry.position))
          .limit(1);

        return positionBetween(from, next?.position ?? null);
      };

      const first = await placeAfter();
      const position = first ?? (await spaceOut(collectionId).then(placeAfter));

      if (position === null) {
        return false;
      }

      await db.update(collectionEntry).set({ position }).where(eq(collectionEntry.id, entryId));
      await touch(collectionId);
      onChanged();

      return true;
    },

    drop: async (collectionId, entryId) => {
      const dropped = await db
        .delete(collectionEntry)
        .where(
          and(eq(collectionEntry.id, entryId), eq(collectionEntry.collectionId, collectionId)),
        );
      const isDropped = countAffected(dropped) > 0;

      if (isDropped) {
        await touch(collectionId);
        onChanged();
      }

      return isDropped;
    },

    readArtwork: async (collectionId) => {
      const artworkPath = await artworkPathOf(collectionId);

      if (artworkPath === null || artworkPath === undefined) {
        return null;
      }

      const contentType = contentTypeFor(extname(artworkPath));
      const body = await readFile(join(artworkDirectory, artworkPath)).catch(() => null);

      return body === null || contentType === undefined
        ? null
        : { body: new Uint8Array(body), contentType };
    },

    saveArtwork: async (collectionId, artwork) => {
      const was = await artworkPathOf(collectionId);

      if (was === undefined) {
        return 'missing';
      }

      const wrong = await whatIsWrongWithThePicture(artwork, ARTWORK_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      const name = `${collectionId}-${Date.now().toString()}${extensionFor(artwork.contentType) ?? '.png'}`;

      await mkdir(artworkDirectory, { recursive: true });
      await writeFile(join(artworkDirectory, name), artwork.body);
      await db
        .update(collection)
        .set({ artworkPath: name, updatedAt: new Date() })
        .where(eq(collection.id, collectionId));
      await forgetArtwork(was);
      onChanged();

      return null;
    },

    dropArtwork: async (collectionId) => {
      const was = await artworkPathOf(collectionId);

      if (was === undefined) {
        return false;
      }

      await db
        .update(collection)
        .set({ artworkPath: null, updatedAt: new Date() })
        .where(eq(collection.id, collectionId));
      await forgetArtwork(was);
      onChanged();

      return true;
    },
  };
};

export { createDatabaseCollectionService };
