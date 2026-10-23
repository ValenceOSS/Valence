import { bookHasSomethingStillThere } from '@ValenceServer/visibility/bookHasSomethingStillThere';
import { artistHasSomethingStillThere } from '@ValenceServer/visibility/artistHasSomethingStillThere';
import { albumHasSomethingStillThere } from '@ValenceServer/visibility/albumHasSomethingStillThere';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { and, eq } from 'drizzle-orm';
import { book, mediaItem, musicAlbum, musicArtist, musicTrack } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { PeerSubject } from './FederationReach';
import type { PeerItem } from './PeerItem';

/**
 * Reads what a linked server asks about as the federation gate weighs it: the library it is in, the
 * age it was certificated for, and whether it is something nothing certificates — a song, a book,
 * an album or an artist.
 *
 * @param db - The database.
 * @returns A reader of a title, book, album or artist, answering nothing where there is none.
 */
const createPeerSubjectReader =
  (db: AnyValenceDatabase) =>
  async ({ kind, id }: PeerSubject): Promise<PeerItem | null> => {
    if (kind === 'item') {
      const [row] = await db
        .select({
          id: mediaItem.id,
          title: mediaItem.title,
          libraryId: mediaItem.libraryId,
          certificationAge: mediaItem.certificationAge,
          trackId: musicTrack.mediaItemId,
        })
        .from(mediaItem)
        .leftJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
        .where(and(eq(mediaItem.id, id), isStillThere()));

      return row === undefined
        ? null
        : {
            id: row.id,
            title: row.title,
            libraryId: row.libraryId,
            certificationAge: row.certificationAge,
            isNeverRated: row.trackId !== null,
          };
    }

    const [row] =
      kind === 'book'
        ? await db
            .select({ id: book.id, title: book.title, libraryId: book.libraryId })
            .from(book)
            .where(and(eq(book.id, id), bookHasSomethingStillThere(db)))
        : kind === 'album'
          ? await db
              .select({
                id: musicAlbum.id,
                title: musicAlbum.title,
                libraryId: musicAlbum.libraryId,
              })
              .from(musicAlbum)
              .where(and(eq(musicAlbum.id, id), albumHasSomethingStillThere(db)))
          : await db
              .select({
                id: musicArtist.id,
                title: musicArtist.name,
                libraryId: musicArtist.libraryId,
              })
              .from(musicArtist)
              .where(and(eq(musicArtist.id, id), artistHasSomethingStillThere(db)));

    return row === undefined ? null : { ...row, certificationAge: null, isNeverRated: true };
  };

export { createPeerSubjectReader };
