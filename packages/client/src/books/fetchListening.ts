import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import {
  BookListeningListSchema,
  ListeningProgressAnswerSchema,
} from '@ValenceContracts/schemas/Book';
import type { BookListening, ListeningProgress } from '@ValenceContracts/schemas/Book';

/**
 * Where one of an audiobook's tracks is listened to from, a range at a time.
 *
 * @param bookId - The book.
 * @param chapterId - The track.
 * @returns The address.
 */
const bookAudioUrl = (bookId: string, chapterId: string): string =>
  `/api/books/${bookId}/chapters/${chapterId}/audio`;

/**
 * The audiobooks the watching profile is partway through, the latest first.
 *
 * @returns What they are listening to.
 */
const fetchListening = async (): Promise<BookListening[]> =>
  (await readFromServer('/api/listening', BookListeningListSchema, profileHeaders())).listenings;

/**
 * Where the watching profile has got to in an audiobook.
 *
 * @param bookId - The book.
 * @returns Where they are, or nothing where they have not started it.
 */
const fetchListeningProgress = async (bookId: string): Promise<ListeningProgress | null> =>
  (
    await readFromServer(
      `/api/books/${bookId}/listening`,
      ListeningProgressAnswerSchema,
      profileHeaders(),
    )
  ).progress;

/**
 * Says where the watching profile has got to in an audiobook.
 *
 * @param bookId - The book.
 * @param place - The track they are on, how far into it, and whether that is the end of the book.
 * @returns Whether it was kept.
 */
const saveListeningProgress = async (
  bookId: string,
  place: { chapterId: string; positionSeconds: number; isFinished: boolean },
): Promise<boolean> => {
  const response = await fetch(`/api/books/${bookId}/listening`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...profileHeaders() },
    body: JSON.stringify(place),
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Forgets where the watching profile had got to in an audiobook.
 *
 * @param bookId - The book.
 * @returns Whether it was forgotten.
 */
const forgetListening = async (bookId: string): Promise<boolean> => {
  const response = await fetch(`/api/books/${bookId}/listening`, {
    method: 'DELETE',
    headers: profileHeaders(),
  }).catch(() => null);

  return response !== null && response.ok;
};

export {
  bookAudioUrl,
  fetchListening,
  fetchListeningProgress,
  forgetListening,
  saveListeningProgress,
};
