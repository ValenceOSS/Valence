/**
 * Where a book's cover is, from the number Open Library keeps it under.
 *
 * @param coverId - The cover's number, or nothing where the book has none.
 * @returns The picture's address, or null where there is no cover.
 */
const openLibraryCover = (coverId: number | null | undefined): string | null =>
  coverId === null || coverId === undefined || coverId <= 0
    ? null
    : `https://covers.openlibrary.org/b/id/${coverId.toString()}-M.jpg`;

export { openLibraryCover };
