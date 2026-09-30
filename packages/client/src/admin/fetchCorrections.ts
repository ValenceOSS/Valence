import { z } from 'zod';
import { BookMatchListSchema } from '@ValenceContracts/schemas/BookMatch';
import { MusicCatalogueHitSchema } from '@ValenceContracts/schemas/MediaRequest';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import type { BookMatch } from '@ValenceContracts/schemas/BookMatch';
import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

const AlbumMatchListSchema = z.object({ matches: z.array(MusicCatalogueHitSchema) });

const NOT_SENT = say('common.theServerCouldNotBeReached');

/**
 * Sends a correction and says what went wrong with it, where anything did.
 *
 * @param path - Where the correction goes.
 * @param method - Whether it is made or forgotten.
 * @param body - What is chosen, where anything is.
 * @returns Nothing where it was taken, or why it was not.
 */
const send = async (path: string, method: string, body?: object): Promise<string | null> => {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  }).catch(() => null);

  if (response === null) {
    return NOT_SENT;
  }

  if (response.ok) {
    return null;
  }

  const said = RefusalSchema.safeParse(await response.json().catch(() => null));

  return said.success
    ? said.data.error
    : say('client.admin.fetchCorrections.thatCouldNotBeChanged');
};

/**
 * Searches Open Library for what a book in the library really is.
 *
 * @param query - What to search for.
 * @returns What was found.
 */
const searchBookMatches = async (query: string): Promise<BookMatch[]> => {
  const response = await fetch(
    `/api/admin/books/matches?${new URLSearchParams({ q: query }).toString()}`,
    { credentials: 'same-origin' },
  ).catch(() => null);
  const read = BookMatchListSchema.safeParse(await response?.json().catch(() => null));

  return read.success ? read.data.matches : [];
};

/**
 * Says which Open Library work a book really is.
 *
 * @param bookId - The book.
 * @param openLibraryId - The work.
 * @returns Nothing where it was corrected, or why it was not.
 */
const correctBook = (bookId: string, openLibraryId: number): Promise<string | null> =>
  send(`/api/admin/books/${bookId}/match`, 'POST', { openLibraryId });

/**
 * Goes back to what a book's own file says it is, from the next scan.
 *
 * @param bookId - The book.
 * @returns Nothing where it was forgotten, or why it was not.
 */
const forgetBookCorrection = (bookId: string): Promise<string | null> =>
  send(`/api/admin/books/${bookId}/match`, 'DELETE');

/**
 * Searches MusicBrainz for what record an album in the library really is.
 *
 * @param query - What to search for.
 * @returns What was found.
 */
const searchAlbumMatches = async (query: string): Promise<MusicCatalogueHit[]> => {
  const response = await fetch(
    `/api/admin/music/albums/matches?${new URLSearchParams({ q: query }).toString()}`,
    { credentials: 'same-origin' },
  ).catch(() => null);
  const read = AlbumMatchListSchema.safeParse(await response?.json().catch(() => null));

  return read.success ? read.data.matches : [];
};

/**
 * Says which record an album really is, which takes that record's cover.
 *
 * @param albumId - The album.
 * @param chosen - The record chosen.
 * @returns Nothing where it was corrected, or why it was not.
 */
const correctAlbum = (albumId: string, chosen: MusicCatalogueHit): Promise<string | null> =>
  send(`/api/admin/music/albums/${albumId}/match`, 'POST', {
    releaseGroupId: chosen.musicBrainzId,
    title: chosen.title,
    artist: chosen.artist,
  });

/**
 * Goes back to what an album's own files say, from the next scan.
 *
 * @param albumId - The album.
 * @returns Nothing where it was forgotten, or why it was not.
 */
const forgetAlbumCorrection = (albumId: string): Promise<string | null> =>
  send(`/api/admin/music/albums/${albumId}/match`, 'DELETE');

export {
  correctAlbum,
  correctBook,
  forgetAlbumCorrection,
  forgetBookCorrection,
  searchAlbumMatches,
  searchBookMatches,
};
