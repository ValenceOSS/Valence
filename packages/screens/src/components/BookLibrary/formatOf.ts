import type { Book } from '@ValenceContracts/schemas/Book';

/**
 * What a book is to read as: an ebook, an audiobook, or pages of pictures such as a comic.
 *
 * @param book - The book.
 * @returns Its format.
 */
const formatOf = (book: Book): 'ebook' | 'audiobook' | 'comic' =>
  book.layout === 'audio' ? 'audiobook' : book.layout === 'reflow' ? 'ebook' : 'comic';

export { formatOf };
