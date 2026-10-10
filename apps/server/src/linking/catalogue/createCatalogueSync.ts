import { and, eq, inArray } from 'drizzle-orm';
import {
  book,
  bookChapter,
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
  series,
} from '#dialect/Schema';
import { upsert } from '@ValenceDatabase/upsert';
import { localIdOf } from './localIdOf';
import { linkedAddressOf } from './linkedAddressOf';
import { localRowsOf } from './localRowsOf';
import { setEverythingFrom } from './setEverythingFrom';
import { foldCopiesHere } from './foldCopiesHere';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { SharedLibrary } from '@ValenceContracts/schemas/LinkSharing';
import type { LinkService } from '@ValenceServer/linking/LinkService';
import type { LinkStore } from '@ValenceServer/linking/LinkStore';
import type { PeerAnswer, PeerClient } from '@ValenceServer/linking/createPeerClient';
import type { CataloguePage } from './CataloguePageSchema';

const MOST_PAGES = 1000;

const FORGOTTEN_AT_ONCE = 500;

type SyncOutcome = { serverId: string; libraries: number; kept: number; forgotten: number };

type CatalogueSyncOptions = {
  db: AnyValenceDatabase;
  linking: LinkService;
  links: LinkStore;
  peers: PeerClient;
  warn?: (message: string) => void;
};

/**
 * Deletes rows by id a few hundred at a time, so a library that lost thousands of titles is not one
 * statement too long for the database.
 *
 * @param ids - The ids.
 * @param remove - How to delete one batch.
 */
const inBatches = async (ids: readonly string[], remove: (batch: string[]) => Promise<void>) => {
  for (let at = 0; at < ids.length; at += FORGOTTEN_AT_ONCE) {
    await remove(ids.slice(at, at + FORGOTTEN_AT_ONCE));
  }
};

/**
 * Keeps this server's index of what each linked server shares with it: a library here for every
 * library shared, holding that library's titles, programmes, songs, albums, artists, books and
 * chapters as rows of this server's own — metadata only, never a file — so every shelf, search and
 * page treats them as it treats anything else.
 *
 * A pass reads every page of every shared library and writes each row over the one already kept,
 * by an id made from the other server's, so every other key a row has — its path, which is made
 * from the same id, or its name in its library, which the other server keeps unique as this one
 * does — names that same row. What people here have watched, rated or kept on those rows is
 * never lost to a refresh. What a whole pass no longer brings has gone from the other server and
 * goes here too, and a library that is no longer shared goes with everything in it, as does one
 * an administrator here chose not to take.
 *
 * A server that cannot be reached is left as it was, so its titles stay browsable while it is away,
 * and is remembered as unreachable until it answers again, so a page can say so.
 *
 * @param options - The database, the link service and store, the peer client, and where to warn.
 * @returns A sync of one linked server, or of them all.
 */
const createCatalogueSync = ({
  db,
  linking,
  links,
  peers,
  warn = () => undefined,
}: CatalogueSyncOptions) => {
  const reachable = new Map<string, boolean>();
  const downloads = new Map<string, boolean>();
  const requesting = new Map<string, boolean>();

  const keepLibrary = async (serverId: string, shared: SharedLibrary) => {
    const id = localIdOf(serverId, shared.id);
    const [kept] = await db.select({ id: library.id }).from(library).where(eq(library.id, id));

    if (kept === undefined) {
      await db.insert(library).values({
        id,
        name: shared.name,
        kind: shared.kind,
        path: linkedAddressOf(serverId, `/api/libraries/${shared.id}`),
        linkedServerId: serverId,
        takesRequests: false,
      });
    } else {
      await db
        .update(library)
        .set({ name: shared.name, kind: shared.kind })
        .where(eq(library.id, id));
    }

    return id;
  };

  const keepPage = async (rows: ReturnType<typeof localRowsOf>) => {
    if (rows.series.length > 0) {
      await upsert(db, series, {
        values: rows.series,
        target: series.id,
        set: setEverythingFrom(series, ['id']),
        sameRowOn: [[series.libraryId, series.key]],
      });
    }

    if (rows.artists.length > 0) {
      await upsert(db, musicArtist, {
        values: rows.artists,
        target: musicArtist.id,
        set: setEverythingFrom(musicArtist, ['id']),
        sameRowOn: [[musicArtist.libraryId, musicArtist.nameKey]],
      });
    }

    if (rows.albums.length > 0) {
      await upsert(db, musicAlbum, {
        values: rows.albums,
        target: musicAlbum.id,
        set: setEverythingFrom(musicAlbum, ['id']),
        sameRowOn: [[musicAlbum.libraryId, musicAlbum.artistId, musicAlbum.titleKey]],
      });
    }

    const parents = rows.mediaItems.filter((row) => row.parentId === null);
    const children = rows.mediaItems.filter((row) => row.parentId !== null);

    for (const batch of [parents, children]) {
      if (batch.length > 0) {
        await upsert(db, mediaItem, {
          values: batch,
          target: mediaItem.id,
          set: setEverythingFrom(mediaItem, ['id', 'addedAt']),
          sameRowOn: [[mediaItem.libraryId, mediaItem.path]],
        });
      }
    }

    if (rows.tracks.length > 0) {
      await upsert(db, musicTrack, {
        values: rows.tracks,
        target: musicTrack.mediaItemId,
        set: setEverythingFrom(musicTrack, ['mediaItemId']),
      });
      await db.delete(musicTrackArtist).where(
        inArray(
          musicTrackArtist.mediaItemId,
          rows.tracks.map((track) => track.mediaItemId),
        ),
      );

      if (rows.trackArtists.length > 0) {
        await db.insert(musicTrackArtist).values(rows.trackArtists);
      }
    }

    if (rows.books.length > 0) {
      await upsert(db, book, {
        values: rows.books,
        target: book.id,
        set: setEverythingFrom(book, ['id', 'addedAt']),
        sameRowOn: [[book.libraryId, book.path]],
      });
    }

    if (rows.chapters.length > 0) {
      await upsert(db, bookChapter, {
        values: rows.chapters,
        target: bookChapter.id,
        set: setEverythingFrom(bookChapter, ['id', 'addedAt']),
        sameRowOn: [[bookChapter.bookId, bookChapter.path]],
      });
    }
  };

  const forgetUnseen = async (libraryId: string, seen: ReadonlySet<string>) => {
    let forgotten = 0;

    for (const table of [mediaItem, series, musicAlbum, musicArtist, book] as const) {
      const kept = await db
        .select({ id: table.id })
        .from(table)
        .where(eq(table.libraryId, libraryId));
      const gone = kept.map((row) => row.id).filter((id) => !seen.has(id));

      forgotten += gone.length;
      await inBatches(gone, async (batch) => {
        await db.delete(table).where(inArray(table.id, batch));
      });
    }

    return forgotten;
  };

  const syncServer = async (serverId: string): Promise<SyncOutcome | null> => {
    const server = await links.readServer(serverId);

    if (server?.state !== 'linked') {
      return null;
    }

    const asked = await linking.signFor(serverId);
    const listed = asked === null ? null : await peers.libraries(asked.address, asked.token);

    reachable.set(serverId, listed?.kind === 'answered');

    if (listed?.kind !== 'answered') {
      warn(`linking: ${server.name} could not be reached to read what it shares`);

      return null;
    }

    let kept = 0;
    let forgotten = 0;
    const keptLibraries = new Set<string>();

    downloads.set(serverId, listed.answer.allowsDownloads);
    requesting.set(serverId, listed.answer.takesRequests);

    const declined = new Set(await links.listDeclined(serverId));

    for (const shared of listed.answer.libraries.filter((one) => !declined.has(one.id))) {
      const libraryId = await keepLibrary(serverId, shared);
      const seen = new Set<string>();
      let after: string | null = null;
      let isWhole = false;

      keptLibraries.add(libraryId);

      for (let page = 0; page < MOST_PAGES; page += 1) {
        const signed = await linking.signFor(serverId);
        const read: PeerAnswer<CataloguePage> | null =
          signed === null
            ? null
            : await peers.catalogue(signed.address, signed.token, shared.id, after);

        if (read?.kind !== 'answered') {
          warn(`linking: a page of ${shared.name} on ${server.name} could not be read`);

          break;
        }

        const rows = localRowsOf(read.answer, serverId, libraryId);

        await keepPage(rows);

        for (const row of [
          ...rows.mediaItems,
          ...rows.series,
          ...rows.albums,
          ...rows.artists,
          ...rows.books,
        ]) {
          seen.add(row.id);
        }

        kept += rows.mediaItems.length + rows.books.length;
        after = read.answer.next;

        if (after === null) {
          isWhole = true;

          break;
        }
      }

      if (isWhole) {
        forgotten += await forgetUnseen(libraryId, seen);
      }

      await foldCopiesHere(db, libraryId, server.name);

      await db.update(library).set({ lastScannedAt: new Date() }).where(eq(library.id, libraryId));
    }

    const ours = await db
      .select({ id: library.id })
      .from(library)
      .where(eq(library.linkedServerId, serverId));
    const unshared = ours.map((row) => row.id).filter((id) => !keptLibraries.has(id));

    if (unshared.length > 0) {
      await db
        .delete(library)
        .where(and(eq(library.linkedServerId, serverId), inArray(library.id, unshared)));
    }

    return { serverId, libraries: keptLibraries.size, kept, forgotten };
  };

  return {
    syncServer,
    isReachable: (serverId: string) => reachable.get(serverId) ?? true,
    allowsDownloads: (serverId: string) => downloads.get(serverId) ?? false,
    takesRequests: (serverId: string) => requesting.get(serverId) ?? false,
    syncAll: async (): Promise<SyncOutcome[]> => {
      const outcomes: SyncOutcome[] = [];

      for (const server of await links.listServers()) {
        const outcome = server.state === 'linked' ? await syncServer(server.id) : null;

        if (outcome !== null) {
          outcomes.push(outcome);
        }
      }

      return outcomes;
    },
  };
};

export type { CatalogueSyncOptions, SyncOutcome };

export { createCatalogueSync };
