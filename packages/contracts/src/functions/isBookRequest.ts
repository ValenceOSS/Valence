import type { BookRequestKind, MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether a kind of request is for a book, which is found by its Open Library id, and filed into a
 * books library.
 *
 * @param kind - The kind.
 * @returns Whether it is a book.
 */
const isBookRequest = (kind: MediaRequestKind): kind is BookRequestKind => kind === 'book';

export { isBookRequest };
