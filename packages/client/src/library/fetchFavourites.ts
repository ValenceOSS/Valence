import { readFromServer } from '@ValenceClient/query/readFromServer';
import { FavouriteListSchema } from '@ValenceContracts/schemas/Favourite';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';

/**
 * Everything this viewer has kept. Kept per profile rather than per account, since what one person in
 * a household wants to come back to is not what another does.
 */
const fetchFavourites = async (): Promise<string[]> => {
  return (
    await readFromServer('/api/favourites', FavouriteListSchema, profileHeaders())
  ).favourites.map((entry) => entry.mediaId);
};

/**
 * Every book this viewer has kept, from the same list as everything else they kept.
 *
 * @returns The ids of the books, most recently kept first.
 */
const fetchKeptBooks = async (): Promise<string[]> =>
  (await readFromServer('/api/favourites', FavouriteListSchema, profileHeaders())).books.map(
    (entry) => entry.bookId,
  );

/**
 * Asks the server to keep something, or stop, at the address it is kept at.
 *
 * @param address - Where the thing's favourite lives.
 * @param isKept - Whether it should be kept.
 * @returns Whether the server agreed.
 */
const setKept = async (address: string, isKept: boolean): Promise<boolean> => {
  const response = await fetch(address, {
    method: isKept ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
    headers: profileHeaders(),
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Keeps something for this profile, or stops keeping it. One call for both directions, since the
 * gesture in the interface is one control that already knows which way it is going.
 *
 * @param mediaId - The item.
 * @param isKept - Whether it should be kept.
 */
const setFavourite = async (mediaId: string, isKept: boolean): Promise<boolean> =>
  setKept(`/api/media/${mediaId}/favourite`, isKept);

/**
 * Keeps a book for this profile, or stops keeping it.
 *
 * @param bookId - The book.
 * @param isKept - Whether it should be kept.
 * @returns Whether the server agreed.
 */
const setBookFavourite = (bookId: string, isKept: boolean): Promise<boolean> =>
  setKept(`/api/books/${bookId}/favourite`, isKept);

export { fetchFavourites, fetchKeptBooks, setBookFavourite, setFavourite };
