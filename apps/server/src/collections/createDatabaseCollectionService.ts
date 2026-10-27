import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { hasSomethingStillThere } from '@ValenceServer/visibility/hasSomethingStillThere';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  and,
  asc,
  eq,
  exists,
  gt,
  inArray,
  isNotNull,
  isNull,
  max,
  min,
  or,
  sql,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import {
  collection,
  collectionEntry,
  library,
  mediaItem,
  series,
  viewerProfile,
} from '#dialect/Schema';
import { COLLECTION_ENTRY_KINDS } from '@ValenceContracts/schemas/Collection';
import { TitleRulesSchema } from '@ValenceContracts/schemas/SmartRules';
import { rememberFor } from '@ValenceServer/smart/rememberFor';
import { smartEntryId } from '@ValenceServer/smart/smartEntryId';
import { titlesMatching } from '@ValenceServer/smart/titlesMatching';
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
import type { TitleRules } from '@ValenceContracts/schemas/SmartRules';
import type { SmartTitle } from '@ValenceServer/smart/titlesMatching';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { CollectionService } from './CollectionService';

const COVER_TILES = 4;

const REMEMBERED_MS = 20_000;

const FILMS_AT_ONCE = 1000;

/**
 * What a collection holds, for a page of films or of programmes to show it on: what its rules say
 * where it is smart, or else what is in it, and either where it holds nothing yet.
 *
 * @param rules - Its rules, where it is smart.
 * @param inside - What is in it that the viewer may see.
 * @returns The kinds it holds.
 */
const holdsOf = (
  rules: TitleRules | null,
  inside: readonly { kind: CollectionEntry['kind'] }[],
): CollectionEntry['kind'][] => {
  if (rules !== null) {
    return rules.holds === 'films' ? ['film'] : ['series'];
  }

  const kinds = COLLECTION_ENTRY_KINDS.filter((kind) =>
    inside.some((entry) => entry.kind === kind),
  );

  return kinds.length === 0 ? [...COLLECTION_ENTRY_KINDS] : kinds;
};

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
  now?: () => number;
};

type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
  isOrdered: boolean;
  artworkPath: string | null;
  profileId: string | null;
  ownerName: string | null;
  ownerColour: string | null;
  isShared: boolean;
  rules: TitleRules | null;
  updatedAt: Date;
};

type Summarised = {
  collections: Collection[];
  entries: ReadonlyMap<string, readonly VisibleEntry[]>;
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
 * A collection is the whole server's unless a profile made it for themselves, when only they see it
 * until they share it. A smart collection holds no entries of its own: it is filled, each time it is
 * read, with the titles that keep its rules, read from its owner's viewing where it has one and from
 * the viewer's where it is the server's, and nobody adds to it, moves anything in it or takes
 * anything out. A profile's own collection is always offered to them, empty or not.
 *
 * Changing a collection asks nobody: whoever calls has already been allowed to, which is what lets
 * the importer fill one as readily as somebody at the library page does. Every change is said once
 * it is made, so open pages read it again.
 *
 * @param options - The database, where the library's titles are read out as cards, where uploaded
 *   artwork is kept, who to tell when something changed, and the time, for a test.
 * @returns The service.
 */
const createDatabaseCollectionService = ({
  db,
  library: titles,
  artworkDirectory,
  onChanged = () => undefined,
  now = () => Date.now(),
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

  const profileOf = (viewer: Viewer): string | null =>
    viewer.kind === 'account' ? viewer.profileId : null;

  const readable = (viewer: Viewer): SQL | undefined => {
    if (viewer.kind === 'server') {
      return undefined;
    }

    const profileId = profileOf(viewer);

    return profileId === null
      ? or(isNull(collection.profileId), eq(collection.isShared, true))
      : or(
          isNull(collection.profileId),
          eq(collection.profileId, profileId),
          eq(collection.isShared, true),
        );
  };

  const rulesOf = (stored: TitleRules | null): TitleRules | null => {
    const read = TitleRulesSchema.safeParse(stored);

    return read.success ? read.data : null;
  };

  const remembered = rememberFor<SmartTitle[]>(REMEMBERED_MS, now);

  const smartEntries = async (viewer: Viewer, row: CollectionRow): Promise<VisibleEntry[]> => {
    const rules = rulesOf(row.rules);

    if (rules === null) {
      return [];
    }

    const profileId = row.profileId ?? profileOf(viewer);
    const titles = await remembered.get(row.id, JSON.stringify([viewer, profileId, rules]), () =>
      titlesMatching(db, { listId: row.id, viewer, profileId, rules, now: new Date(now()) }),
    );

    return titles.map((title, at) => ({
      id: smartEntryId(row.id, `${title.kind}:${title.id}`),
      collectionId: row.id,
      position: at,
      addedAt: title.addedAt,
      kind: title.kind,
      subjectId: title.id,
    }));
  };

  const summarise = async (
    viewer: Viewer,
    condition: SQL | undefined,
    withEmpty: boolean,
  ): Promise<Summarised> => {
    const rows: CollectionRow[] = await db
      .select({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isOrdered: collection.isOrdered,
        artworkPath: collection.artworkPath,
        profileId: collection.profileId,
        ownerName: viewerProfile.name,
        ownerColour: viewerProfile.colour,
        isShared: collection.isShared,
        rules: collection.rules,
        updatedAt: collection.updatedAt,
      })
      .from(collection)
      .leftJoin(viewerProfile, eq(viewerProfile.id, collection.profileId))
      .where(and(readable(viewer), condition))
      .orderBy(asc(collection.name));

    const [kept, filled] = await Promise.all([
      visibleEntries(
        viewer,
        rows.flatMap((row) => (row.rules === null ? [row.id] : [])),
      ),
      Promise.all(rows.flatMap((row) => (row.rules === null ? [] : [smartEntries(viewer, row)]))),
    ]);
    const entries = [...kept, ...filled.flat()];

    const filmIds = [
      ...new Set(entries.flatMap((entry) => (entry.kind === 'film' ? [entry.subjectId] : []))),
    ];
    const posteredFilms = new Set<string>();

    for (let at = 0; at < filmIds.length; at += FILMS_AT_ONCE) {
      const postered = await db
        .select({ id: mediaItem.id })
        .from(mediaItem)
        .where(
          and(
            inArray(mediaItem.id, filmIds.slice(at, at + FILMS_AT_ONCE)),
            isNotNull(mediaItem.posterUrl),
          ),
        );

      for (const row of postered) {
        posteredFilms.add(row.id);
      }
    }

    const seriesCovers = await coversOf(
      viewer,
      [...new Set(entries.flatMap((entry) => (entry.kind === 'series' ? [entry.subjectId] : [])))],
      true,
    );

    const held = new Map<string, VisibleEntry[]>();

    for (const entry of entries) {
      held.set(entry.collectionId, [...(held.get(entry.collectionId) ?? []), entry]);
    }

    const me = profileOf(viewer);

    const collections = rows.flatMap((row): Collection[] => {
      const inside = held.get(row.id) ?? [];
      const isMine = row.profileId !== null && row.profileId === me;

      if (
        inside.length === 0 &&
        !isMine &&
        !(withEmpty && (row.profileId === null || viewer.kind === 'server'))
      ) {
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
          isOrdered: row.rules !== null || row.isOrdered,
          hasOwnArtwork: row.artworkPath !== null,
          entryCount: inside.length,
          coverMediaIds: covers,
          holds: holdsOf(rulesOf(row.rules), inside),
          isSmart: row.rules !== null,
          rules: rulesOf(row.rules),
          owner:
            row.profileId === null || row.ownerName === null || row.ownerColour === null
              ? null
              : { profileId: row.profileId, name: row.ownerName, colour: row.ownerColour },
          isMine,
          isShared: row.isShared,
          updatedAt: row.updatedAt.toISOString(),
        },
      ];
    });

    return { collections, entries: held };
  };

  const one = async (viewer: Viewer, collectionId: string): Promise<Collection | null> => {
    const {
      collections: [found],
    } = await summarise(viewer, eq(collection.id, collectionId), true);

    return found ?? null;
  };

  const ownership = async (
    collectionId: string,
  ): Promise<{ profileId: string | null; isSmart: boolean; isShared: boolean } | null> => {
    const [row] = await db
      .select({
        profileId: collection.profileId,
        rules: collection.rules,
        isShared: collection.isShared,
      })
      .from(collection)
      .where(eq(collection.id, collectionId))
      .limit(1);

    return row === undefined
      ? null
      : { profileId: row.profileId, isSmart: row.rules !== null, isShared: row.isShared };
  };

  const isManual = async (collectionId: string): Promise<boolean> =>
    (await ownership(collectionId))?.isSmart === false;

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
            .where(and(inArray(mediaItem.id, mediaIds), isNotATrack(db), isStillThere())),
      seriesIds.length === 0
        ? Promise.resolve([])
        : db
            .select({ id: series.id })
            .from(series)
            .where(and(inArray(series.id, seriesIds), hasSomethingStillThere(db))),
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
        return (await summarise(viewer, undefined, withEmpty)).collections;
      }

      const [settled] = await settle([containing]);

      if (settled === undefined) {
        return [];
      }

      const { collections } = await summarise(
        viewer,
        and(
          isNull(collection.rules),
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
        ),
        false,
      );

      return collections;
    },

    ownership,

    get: async (viewer, collectionId, withEmpty = false) => {
      const {
        collections: [summary],
        entries: held,
      } = await summarise(viewer, eq(collection.id, collectionId), withEmpty);

      if (summary === undefined) {
        return null;
      }

      const entries = held.get(collectionId) ?? [];
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

    create: async (
      {
        name,
        description = null,
        isOrdered = false,
        entries = [],
        createdBy,
        rules = null,
        profileId = null,
        isShared = false,
      },
      viewer = asTheServer,
    ) => {
      const id = randomUUID();
      const settled = rules === null ? await settle(entries) : [];

      await db
        .insert(collection)
        .values({ id, name, description, isOrdered, createdBy, rules, profileId, isShared });

      if (settled.length > 0) {
        await db.insert(collectionEntry).values(rowsFor(id, settled, 0));
      }

      onChanged();

      const made = await one(viewer, id);

      if (made === null) {
        throw new Error(`collection ${id} was not there once it had been made`);
      }

      return made;
    },

    update: async (collectionId, change, viewer = asTheServer) => {
      const owned = await ownership(collectionId);

      if (
        owned === null ||
        (change.rules !== undefined && !owned.isSmart) ||
        (change.isShared !== undefined && owned.profileId === null)
      ) {
        return null;
      }

      await db
        .update(collection)
        .set({
          ...(change.name === undefined ? {} : { name: change.name }),
          ...(change.description === undefined ? {} : { description: change.description }),
          ...(change.isOrdered === undefined ? {} : { isOrdered: change.isOrdered }),
          ...(change.rules === undefined ? {} : { rules: change.rules }),
          ...(change.isShared === undefined ? {} : { isShared: change.isShared }),
          updatedAt: new Date(),
        })
        .where(eq(collection.id, collectionId));
      remembered.forget(collectionId);
      onChanged();

      return one(viewer, collectionId);
    },

    remove: async (collectionId) => {
      const artworkPath = await artworkPathOf(collectionId);

      if (artworkPath === undefined) {
        return false;
      }

      await db.delete(collection).where(eq(collection.id, collectionId));
      remembered.forget(collectionId);
      await forgetArtwork(artworkPath);
      onChanged();

      return true;
    },

    replaceEntries: async (collectionId, entries) => {
      if (!(await isManual(collectionId))) {
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
      if (!(await isManual(collectionId))) {
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
      if (!(await isManual(collectionId))) {
        return false;
      }

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

    readArtwork: async (viewer, collectionId) => {
      const [readableRow] = await db
        .select({ id: collection.id })
        .from(collection)
        .where(and(eq(collection.id, collectionId), readable(viewer)))
        .limit(1);
      const artworkPath = readableRow === undefined ? null : await artworkPathOf(collectionId);

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
