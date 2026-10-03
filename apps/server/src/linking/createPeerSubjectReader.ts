import { eq } from 'drizzle-orm';
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
        .where(eq(mediaItem.id, id));

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
            .where(eq(book.id, id))
        : kind === 'album'
          ? await db
              .select({
                id: musicAlbum.id,
                title: musicAlbum.title,
                libraryId: musicAlbum.libraryId,
              })
              .from(musicAlbum)
              .where(eq(musicAlbum.id, id))
          : await db
              .select({
                id: musicArtist.id,
                title: musicArtist.name,
                libraryId: musicArtist.libraryId,
              })
              .from(musicArtist)
              .where(eq(musicArtist.id, id));

    return row === undefined ? null : { ...row, certificationAge: null, isNeverRated: true };
  };

export { createPeerSubjectReader };
